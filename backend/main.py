from fastapi import FastAPI, HTTPException, Header, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
import os
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from dotenv import load_dotenv
import uuid
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Load environment variables (e.g., from .env file)
load_dotenv()

# --- Firebase Admin Setup ---
try:
    # Check if a service account key path is provided
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(f"Firebase Admin initialized with credentials from {cred_path}")
    else:
        # Attempt default initialization (e.g. for cloud run) or warn
        # If no credentials, verify_id_token might fail depending on environment
        # For local dev without keys, we might need to skip strict verification or mock it
        try:
            firebase_admin.initialize_app()
            print("Firebase Admin initialized with default credentials")
        except Exception:
            print("Warning: Firebase Admin could not be initialized. Auth verification may fail.")
except ValueError:
    # App already initialized
    pass

app = FastAPI(title="Kinetik API", description="Backend for the Kinetik Volunteering Platform")

# Allow requests from the Next.js frontend
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate Limiting Setup ---
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- Neo4j Connection Setup ---
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
# Use NEO4J_USER if NEO4J_USERNAME not found
NEO4J_USERNAME = os.getenv("NEO4J_USER", os.getenv("NEO4J_USERNAME", "neo4j"))
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

driver = None

try:
    # Initialize the Neo4j driver
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
    # We won't verify connectivity on startup so the app doesn't crash if AuraDB isn't set up yet
    print(f"Neo4j driver initialized for {NEO4J_URI}")
except Exception as e:
    print(f"Failed to initialize Neo4j driver: {e}")

@app.on_event("shutdown")
def close_driver():
    if driver is not None:
        driver.close()

# --- Auth Dependency ---
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"

async def get_current_user(authorization: str = Header(None), x_user_id: str = Header(None)):
    """
    Verifies the Firebase ID token from the Authorization header.
    X-User-ID fallback is ONLY allowed in DEBUG_MODE (local dev).
    """
    user_id = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            user_id = decoded_token.get("uid")
        except Exception as e:
            print(f"Token verification failed: {e}")
            pass
    
    if not user_id:
        # Only allow X-User-ID fallback in debug/dev mode
        if DEBUG_MODE and x_user_id:
            print(f"⚠️  DEBUG MODE: Using X-User-ID header for auth: {x_user_id}")
            user_id = x_user_id
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    return user_id

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Kinetik Backend API is running!"}

@app.get("/api/health")
def health_check():
    # Simple check to see if database is reachable
    if not driver:
        return {"status": "degraded", "database": "disconnected"}
    
    try:
        driver.verify_connectivity()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": f"error: {str(e)}"}

# The Core Recommendation Engine Endpoint
@app.get("/api/recommendations/users/{user_id}")
def get_user_event_recommendations(
    user_id: str, 
    limit: int = 20, 
    skip: int = 0, 
    search_query: str = None,
    current_user: str = Depends(get_current_user)
):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: cannot access another user's recommendations")
    """
    Finds the best events for a user based on their skills and the event's required skills.
    In a real scenario, this would also factor in location, past events, and friends' activity.
    """
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection not ready")
        
    query = """
    MATCH (e:Event)
    """
    
    if search_query:
        query += """
      WHERE toLower(e.title) CONTAINS toLower($search_query) 
         OR toLower(e.role) CONTAINS toLower($search_query) 
         OR toLower(e.location) CONTAINS toLower($search_query)
    """
        
    query += """
      OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(es:Skill)
      OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
      WITH e, count(DISTINCT es.name) as total_event_skills, count(DISTINCT v) as current_volunteers

      MATCH (u:User {id: $user_id})
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(e)
      WHERE NOT (u)-[:APPLIED_FOR]->(e) AND e.status = 'OPEN'
      WITH e, total_event_skills, current_volunteers, count(s.name) AS matched_skills, collect(s.name) AS matched_tech_stack
      
      RETURN e.id AS event_id, e.title AS title, e.role as role_needed, e.location as location, current_volunteers,
             matched_tech_stack,
             CASE
               WHEN total_event_skills = 0 THEN 1.0
               ELSE (((matched_skills * 1.0) / total_event_skills) * 0.8) + 0.2
             END AS match_score
      ORDER BY match_score DESC
      SKIP $skip
      LIMIT $limit
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id, limit=limit, skip=skip, search_query=search_query)
            recommendations = []
            for record in result:
                # Ensure fields exist, otherwise provide fallbacks
                recommendations.append({
                    "id": record.get("event_id", "unknown-id"),
                    "title": record.get("title", "Event Title"),
                    "role_needed": record.get("role_needed") or "Volunteer",
                    "match_score": record.get("match_score", 0.1),
                    "location": record.get("location") or "Remote",
                    "tech_stack": record.get("matched_tech_stack") or [],
                    "current_volunteers": record.get("current_volunteers", 0)
                })
            
        return {"data": recommendations}
    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        return {"data": []}

@app.post("/api/users")
async def create_or_sync_user(request: Request, current_user: str = Depends(get_current_user)):
    """
    Create or update a user from Firebase auth.
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    firebase_uid = data.get("firebase_uid")
    # Verify the token matches the claimed UID
    if current_user != firebase_uid:
         raise HTTPException(status_code=403, detail="Token UID does not match body UID")

    email = data.get("email")
    name = data.get("name")
    role = data.get("role")
    photo_url = data.get("photo_url")
    bio = data.get("bio", "")
    location = data.get("location", "")
    
    if not firebase_uid or not email:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Validate role
    valid_roles = ["volunteer", "organizer"]
    if role and role.lower() not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    query = """
    MERGE (u:User {id: $uid})
    SET u.email = $email,
        u.name = $name,
        u.role = $role,
        u.photo_url = $photo_url,
        u.bio = $bio,
        u.location = $location,
        u.updated_at = datetime()
    RETURN u.id
    """
    
    try:
        with driver.session() as session:
            session.run(query, uid=firebase_uid, email=email, name=name, role=role, photo_url=photo_url, bio=bio, location=location)
        return {"status": "success", "message": "User synced successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/users/{user_id}")
def get_user_profile(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get user profile including role.
    """
    if not driver:
        # Return mock data if db down, or error
        raise HTTPException(status_code=503, detail="Database not available")

    query = """
    MATCH (u:User {id: $user_id})
    OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
    RETURN u.id as uid, u.name as name, u.email as email, u.role as role, u.photo_url as photo_url, collect(s.name) as skills
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).single()
            if not result:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {
                "uid": result["uid"],
                "name": result["name"],
                "email": result["email"],
                "role": result["role"],
                "photo_url": result["photo_url"],
                "skills": result["skills"]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/public/users/{user_id}")
def get_public_user_profile(user_id: str):
    """
    Get public user profile including stats. No auth required.
    """
    if not driver:
        raise HTTPException(status_code=503, detail="Database not available")

    query = """
    MATCH (u:User {id: $user_id})
    OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
    OPTIONAL MATCH (u)-[r_acc:APPLIED_FOR {status: 'ACCEPTED'}]->(e_acc:Event {status: 'COMPLETED'})
    RETURN u.id as uid, u.name as name, u.role as role, u.photo_url as photo_url, u.bio as bio, u.location as location,
           collect(DISTINCT s.name) as skills,
           count(DISTINCT e_acc) as events_completed,
           count(DISTINCT e_acc) * 4 as impact_hours
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).single()
            if not result or not result["uid"]:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {
                "uid": result["uid"],
                "name": result["name"],
                "role": result["role"],
                "photo_url": result["photo_url"],
                "bio": result["bio"],
                "location": result["location"],
                "skills": result["skills"],
                "events_completed": result["events_completed"],
                "impact_hours": result["impact_hours"]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SkillsPayload(BaseModel):
    skills: List[str]

@app.post("/api/users/skills")
async def update_user_skills(request: Request, user_id: str = Depends(get_current_user)):
    """
    Update or create a user in Neo4j and link their skills.
    Accepts a list of skills. Expected headers: X-User-ID.
    """
    try:
        # Pydantic validation via body
        body = await request.json()
        skills = body if isinstance(body, list) else body.get("skills", [])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MERGE (u:User {id: $user_id})
    WITH u
    
    // Remove old skills
    OPTIONAL MATCH (u)-[r:HAS_SKILL]->()
    DELETE r

    WITH u
    // Add new skills (if any)
    UNWIND (CASE WHEN size($skills) = 0 THEN [null] ELSE $skills END) AS skill_name
    WITH u, skill_name
    WHERE skill_name IS NOT NULL
    MERGE (s:Skill {name: skill_name})
    MERGE (u)-[:HAS_SKILL]->(s)
    """

    try:
        with driver.session() as session:
            session.run(query, user_id=user_id, skills=[s.strip().title() for s in skills if s.strip()])
        return {"status": "success", "message": "Skills updated successfully", "skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., max_length=5000)
    role_needed: str = Field(..., max_length=100)
    location: str = Field(..., max_length=150)
    date: str = Field(..., max_length=100)
    skills: List[str] = Field(default_factory=list, max_items=20)

@app.post("/api/events")
async def create_event(request: Request, event: EventCreate, user_id: str = Depends(get_current_user)):
    """
    Create a new event in Neo4j and link it to the organizer and required skills.
    Requires Bearer token.
    """
    title = event.title
    description = event.description
    role_needed = event.role_needed
    location = event.location
    date = event.date
    skills = event.skills
    
    event_id = str(uuid.uuid4())
    
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    query = """
    // Ensure Organizer exists
    MERGE (o:User {id: $user_id})
    // Create Event node
    CREATE (e:Event {
        id: $event_id,
        title: $title,
        description: $description,
        role: $role_needed,
        location: $location,
        date: $date,
        status: 'OPEN'
    })
    // Link Organizer to Event
    CREATE (o)-[:ORGANIZED]->(e)
    
    WITH e
    // Link Skills
    UNWIND $skills AS skill_name
    MERGE (s:Skill {name: skill_name})
    MERGE (e)-[:REQUIRES_SKILL]->(s)
    """
    
    try:
        with driver.session() as session:
            session.run(query, 
                        user_id=user_id, 
                        event_id=event_id,
                        title=title,
                        description=description,
                        role_needed=role_needed,
                        location=location,
                        date=date,
                        skills=[s.strip().title() for s in skills if s.strip()])
        return {"status": "success", "event_id": event_id, "message": "Event created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/events/{event_id}")
def get_event_detail(event_id: str, current_user: str = Depends(get_current_user)):
    """Get full details for a single event."""
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (e:Event {id: $event_id})
    OPTIONAL MATCH (o:User)-[:ORGANIZED]->(e)
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(s:Skill)
    OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
    RETURN e.id AS id, e.title AS title, e.description AS description,
           e.role AS role, e.location AS location, e.date AS date,
           o.name AS organizer_name, o.id AS organizer_id,
           collect(DISTINCT s.name) AS skills,
           count(DISTINCT v) AS applicant_count
    """
    try:
        with driver.session() as session:
            result = session.run(query, event_id=event_id).single()
            if not result:
                raise HTTPException(status_code=404, detail="Event not found")
            return {
                "event": {
                    "id": result["id"],
                    "title": result["title"] or "Untitled Event",
                    "description": result["description"] or "",
                    "role": result["role"] or "",
                    "location": result["location"] or "Remote",
                    "date": result["date"] or "TBD",
                    "organizer_name": result["organizer_name"] or "Unknown",
                    "organizer_id": result["organizer_id"] or "",
                    "skills": result["skills"],
                    "applicant_count": result["applicant_count"],
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/events/{event_id}")
def delete_event(event_id: str, current_user: str = Depends(get_current_user)):
    """Delete an event. Only the organizer who created it can delete."""
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    OPTIONAL MATCH (e)-[r]-() 
    DELETE r, e
    RETURN count(e) AS deleted
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=current_user, event_id=event_id).single()
            if not result or result["deleted"] == 0:
                raise HTTPException(status_code=404, detail="Event not found or unauthorized")
            return {"status": "success", "message": "Event deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events/{event_id}/apply")
async def apply_to_event(event_id: str, request: Request, user_id: str = Depends(get_current_user)):
    # We can also capture volunteer display name from the firebase UI just to store in Neo4j for easy reading
    try:
        data = await request.json()
    except Exception:
        data = {}
    name = data.get("name", "Unknown Volunteer")

    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed. Please try again later.")

    query = """
    MERGE (u:User {id: $user_id})
    SET u.name = $name
    WITH u
    MATCH (e:Event {id: $event_id})
    MERGE (u)-[:APPLIED_FOR]->(e)
    """
    
    try:
        with driver.session() as session:
            # Check if user is the organizer of the event
            check_query = """
            MATCH (u:User {id: $user_id})-[:ORGANIZED]->(e:Event {id: $event_id})
            RETURN e LIMIT 1
            """
            result = session.run(check_query, user_id=user_id, event_id=event_id).data()
            if result:
                raise HTTPException(status_code=400, detail="Organizers cannot apply to their own events.")

            session.run(query, user_id=user_id, event_id=event_id, name=name)
        return {"status": "success", "message": "Successfully applied to event"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/events/{event_id}/apply")
def withdraw_application(event_id: str, current_user: str = Depends(get_current_user)):
    """Withdraw (cancel) a volunteer's application to an event."""
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (u:User {id: $user_id})-[r:APPLIED_FOR]->(e:Event {id: $event_id})
    DELETE r
    RETURN count(r) AS deleted
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=current_user, event_id=event_id).single()
            if not result or result["deleted"] == 0:
                raise HTTPException(status_code=404, detail="Application not found")
            return {"status": "success", "message": "Application withdrawn"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/applications")
def get_user_applications(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get all applications for a volunteer.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to applications")

    if not driver:
        return {"applications": []}
        
    query = """
    MATCH (u:User {id: $user_id})-[r:APPLIED_FOR]->(e:Event)
    OPTIONAL MATCH (e)<-[:ORGANIZED]-(o:User)
    RETURN e.id AS event_id, e.title AS title, e.role as role, e.location as location, e.date as date, o.name as organizer, r.status as status
    """
    
    try:
        with driver.session() as session:
            res = session.run(query, user_id=user_id)
            apps = []
            for r in res:
                apps.append({
                    "id": r["event_id"],
                    "title": r["title"] or "Untitled Event",
                    "role": r["role"],
                    "location": r["location"],
                    "date": r["date"] or "TBD",
                    "organizer": r["organizer"] or "Organizer",
                    "status": r["status"] or "PENDING"
                })
        return {"applications": apps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events/{event_id}/applications/{volunteer_id}/status")
async def update_application_status(event_id: str, volunteer_id: str, request: Request, user_id: str = Depends(get_current_user)):
    try:
        data = await request.json()
    except Exception:
        data = {}
    
    new_status = data.get("status")
    if new_status not in ["ACCEPTED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be ACCEPTED or REJECTED.")

    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (o:User {id: $organizer_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    MATCH (v:User {id: $volunteer_id})-[r:APPLIED_FOR]->(e)
    SET r.status = $status
    WITH v, e, o, $status AS new_status
    CREATE (n:Notification {
        id: randomUUID(),
        type: 'APPLICATION_' + new_status,
        message: 'Your application for ' + e.title + ' was ' + toLower(new_status) + ' by ' + o.name + '.',
        created_at: datetime(),
        read: false
    })
    CREATE (v)-[:HAS_NOTIFICATION]->(n)
    RETURN new_status
    """
    try:
        with driver.session() as session:
            result = session.run(query, organizer_id=user_id, event_id=event_id, volunteer_id=volunteer_id, status=new_status).data()
            if not result:
                raise HTTPException(status_code=404, detail="Application not found or unauthorized")
            return {"status": "success", "new_status": result[0]["new_status"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/notifications")
def get_user_notifications(user_id: str, current_user: str = Depends(get_current_user)):
    """Fetch all unread or recent notifications for a user."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not driver:
        return {"notifications": []}
        
    query = """
    MATCH (u:User {id: $user_id})-[:HAS_NOTIFICATION]->(n:Notification)
    RETURN n.id AS id, n.type AS type, n.message AS message, n.read AS read, toString(n.created_at) AS created_at
    ORDER BY n.created_at DESC
    LIMIT 20
    """
    try:
        with driver.session() as session:
            res = session.run(query, user_id=user_id).data()
            return {"notifications": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, current_user: str = Depends(get_current_user)):
    """Mark a notification as read."""
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    query = """
    MATCH (u:User {id: $user_id})-[:HAS_NOTIFICATION]->(n:Notification {id: $notif_id})
    SET n.read = true
    RETURN n.id
    """
    try:
        with driver.session() as session:
            res = session.run(query, user_id=current_user, notif_id=notif_id).data()
            if not res:
                raise HTTPException(status_code=404, detail="Notification not found")
            return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events/{event_id}/complete")
def complete_event(event_id: str, current_user: str = Depends(get_current_user)):
    """Mark an event as completed. Only the organizer can do this."""
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    SET e.status = 'COMPLETED'
    RETURN e.id
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=current_user, event_id=event_id).data()
            if not result:
                raise HTTPException(status_code=404, detail="Event not found or unauthorized")
        return {"status": "success", "message": "Event marked as completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/organizers/{user_id}/analytics")
def get_organizer_analytics(user_id: str, current_user: str = Depends(get_current_user)):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not driver:
        return {"stats": {"total_volunteers": 128, "volunteer_hours": 450, "completed_events": 14, "satisfaction": 98}}
    
    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (v:User)-[r:APPLIED_FOR]->(e)
    OPTIONAL MATCH (v_acc:User)-[r_acc:APPLIED_FOR {status: 'ACCEPTED'}]->(e_acc:Event {status: 'COMPLETED'})
    WHERE id(e) = id(e_acc)
    RETURN 
        count(DISTINCT v_acc) AS total_volunteers,
        count(DISTINCT e_acc) AS completed_events,
        count(DISTINCT v_acc) * 4 AS volunteer_hours,
        CASE 
            WHEN count(DISTINCT v) = 0 THEN 0
            ELSE toInteger((count(DISTINCT v_acc) * 100.0) / count(DISTINCT v))
        END AS satisfaction
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).data()
            if result:
                return {"stats": result[0]}
            return {"stats": {"total_volunteers": 0, "volunteer_hours": 0, "completed_events": 0, "satisfaction": 0}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers/{user_id}/dashboard")
def get_volunteer_dashboard(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get stats for a volunteer dashboard.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not driver:
        return {"stats": {"reputation_score": 850, "events_joined": 0, "impact_hours": 0}}
        
    query = """
    MATCH (v:User {id: $user_id})
    OPTIONAL MATCH (v)-[r_acc:APPLIED_FOR {status: 'ACCEPTED'}]->(e_acc:Event)
    OPTIONAL MATCH (v)-[r_done:APPLIED_FOR {status: 'ACCEPTED'}]->(e_done:Event {status: 'COMPLETED'})
    OPTIONAL MATCH (v)-[r_all:APPLIED_FOR]->(e_all:Event)
    RETURN 
        count(DISTINCT e_acc) * 50 + count(DISTINCT e_all) * 10 AS reputation_score,
        count(DISTINCT e_acc) AS events_joined,
        count(DISTINCT e_done) * 4 AS impact_hours
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).data()
            if result:
                return {"stats": result[0]}
            return {"stats": {"reputation_score": 850, "events_joined": 0, "impact_hours": 0}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/organizers/{user_id}/dashboard")
def get_organizer_dashboard(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get stats and recent applications for an organizer's events.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not driver:
        return {"stats": {"active_events": 0, "pending_applications": 0, "total_volunteers": 0}, "applications": []}
    
    # Get active events the organizer created
    stats_query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (v:User)-[r:APPLIED_FOR]->(e) WHERE r.status IS NULL OR r.status = 'PENDING'
    OPTIONAL MATCH (v_total:User)-[r_acc:APPLIED_FOR {status: 'ACCEPTED'}]->(e_total:Event)<-[:ORGANIZED]-(o)
    RETURN count(DISTINCT e) AS active_events, count(DISTINCT v) AS pending_applications, count(DISTINCT v_total) AS total_volunteers
    """
    
    apps_query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)<-[r:APPLIED_FOR]-(v:User)
    WHERE r.status IS NULL OR r.status = 'PENDING'
    OPTIONAL MATCH (v)-[:HAS_SKILL]->(s:Skill)
    WITH v, e, r, collect(s.name) as volunteer_skills
    RETURN v.id AS volunteer_id, v.name AS volunteer_name,
           e.id AS event_id, e.title AS event_title, e.role as role_applied,
           volunteer_skills
    ORDER BY e.title
    LIMIT 20
    """
    
    events_query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(es:Skill)
    RETURN e.id AS id, e.title AS title, e.role AS role, e.location AS location, 
           e.date AS date, e.status AS status, collect(es.name) AS skills
    ORDER BY e.title DESC
    LIMIT 10
    """
    
    try:
        with driver.session() as session:
            stats_res = session.run(stats_query, user_id=user_id).single()
            active_events = stats_res["active_events"] if stats_res else 0
            pending_apps = stats_res["pending_applications"] if stats_res else 0
            
            apps_res = session.run(apps_query, user_id=user_id)
            applications = []
            for r in apps_res:
                applications.append({
                    "volunteer_id": r["volunteer_id"],
                    "volunteer_name": r.get("volunteer_name") or "Volunteer",
                    "event_id": r["event_id"],
                    "event_title": r["event_title"],
                    "role_applied": r.get("role_applied", "Volunteer"),
                    "skills": r.get("volunteer_skills", [])
                })
                
            events_res = session.run(events_query, user_id=user_id)
            active_events_list = []
            for r in events_res:
                active_events_list.append({
                    "id": r["id"],
                    "title": r["title"] or "Untitled Event",
                    "role": r["role"],
                    "location": r["location"],
                    "date": r["date"],
                    "status": r.get("status") or "OPEN",
                    "skills": r["skills"]
                })
                
        return {
            "stats": {
                "active_events": active_events,
                "pending_applications": pending_apps,
                "total_volunteers": stats_res["total_volunteers"] if stats_res else 0
            },
            "applications": applications,
            "recent_events": active_events_list
        }
    except Exception as e:
        print("db error:", str(e))
        return {"stats": {"active_events": 0, "pending_applications": 0, "total_volunteers": 0}, "applications": []}

@app.get("/api/organizers/{user_id}/events")
def get_organizer_events(user_id: str, current_user: str = Depends(get_current_user)):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not driver:
        return {"events": []}
        
    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
    RETURN e.id AS id, e.title AS title, e.role AS role, e.location AS location,
           e.date AS date, count(v) as volunteers_filled
    ORDER BY e.title DESC
    """
    try:
        with driver.session() as session:
            res = session.run(query, user_id=user_id)
            events = []
            for r in res:
                events.append({
                    "id": r["id"],
                    "title": r["title"] or "Untitled Event",
                    "role": r["role"],
                    "location": r["location"],
                    "date": r["date"],
                    "volunteersFilled": r["volunteers_filled"],
                    "volunteersTotal": r.get("max_volunteers") or "-",
                    "status": "Active"
                })
        return {"events": events}
    except Exception as e:
        print("db error in get_organizer_events:", str(e))
        return {"events": []}

class UserUpdate(BaseModel):
    displayName: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    imageUrl: Optional[str] = None
    portfolioUrl: Optional[str] = None
    linkedInUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    availability: Optional[str] = None
    skills: Optional[List[str]] = None

@app.patch("/api/users/{user_id}")
async def update_user_profile(user_id: str, update: UserUpdate, current_user: str = Depends(get_current_user)):
    """
    Update user profile fields in Neo4j.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    # Build update payload
    data = update.model_dump(exclude_unset=True)
    if not data:
        return {"message": "No changes provided"}

    skills = data.pop("skills", None)

    # Whitelist of allowed field name mappings (prevents Cypher injection)
    ALLOWED_FIELDS = {
        "displayName": "name",
        "headline": "headline",
        "bio": "bio",
        "location": "location",
        "imageUrl": "photo_url",
        "portfolioUrl": "portfolioUrl",
        "linkedInUrl": "linkedInUrl",
        "githubUrl": "githubUrl",
        "availability": "availability",
    }

    set_clauses = []
    params = {"user_id": user_id}
    
    for key, value in data.items():
        if key not in ALLOWED_FIELDS:
            continue  # Skip unknown fields
        db_key = ALLOWED_FIELDS[key]
        param_name = f"p_{db_key}"  # Safe parameterized name
        set_clauses.append(f"u.{db_key} = ${param_name}")
        params[param_name] = value

    try:
        with driver.session() as session:
            # Update User properties
            if set_clauses:
                query = f"""
                MATCH (u:User {{id: $user_id}})
                SET {', '.join(set_clauses)}
                RETURN u
                """
                result = session.run(query, **params).single()
                if not result:
                     raise HTTPException(status_code=404, detail="User not found")

            # Update Skills if provided
            if skills is not None:
                # Clear existing skills and add new ones
                skills_query = """
                MATCH (u:User {id: $user_id})
                OPTIONAL MATCH (u)-[r:HAS_SKILL]->()
                DELETE r
                WITH u
                UNWIND $skills as skill_name
                MERGE (s:Skill {name: skill_name})
                MERGE (u)-[:HAS_SKILL]->(s)
                """
                session.run(skills_query, user_id=user_id, skills=skills)
                
            return {"message": "Profile updated successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
