from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

# Load environment variables (e.g., from .env file)
load_dotenv()

app = FastAPI(title="Kinetik API", description="Backend for the Kinetik Volunteering Platform")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Update this when deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def get_user_event_recommendations(user_id: str):
    """
    Finds the best events for a user based on their skills and the event's required skills.
    In a real scenario, this would also factor in location, past events, and friends' activity.
    """
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection not ready")
        
    query = """
    MATCH (e:Event)
      OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(es:Skill)
      OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
      WITH e, count(DISTINCT es.name) as total_event_skills, count(DISTINCT v) as current_volunteers

      MATCH (u:User {id: $user_id})
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(e)
      WHERE NOT (u)-[:APPLIED_FOR]->(e)
      WITH e, total_event_skills, current_volunteers, count(s.name) AS matched_skills, collect(s.name) AS matched_tech_stack
      
      RETURN e.id AS event_id, e.title AS title, e.role as role_needed, e.location as location, current_volunteers,
             matched_tech_stack,
             CASE
               WHEN total_event_skills = 0 THEN 1.0
               ELSE (((matched_skills * 1.0) / total_event_skills) * 0.8) + 0.2
             END AS match_score
      ORDER BY match_score DESC
      LIMIT 20
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id)
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

from pydantic import BaseModel
from typing import List
from fastapi import Request

class SkillsPayload(BaseModel):
    skills: List[str]

@app.post("/api/users/skills")
async def update_user_skills(request: Request):
    """
    Update or create a user in Neo4j and link their skills.
    Accepts a list of skills. Expected headers: X-User-ID.
    """
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID header is missing")

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

@app.post("/api/events")
async def create_event(request: Request):
    """
    Create a new event in Neo4j and link it to the organizer and required skills.
    Required headers: X-User-ID.
    """
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID header is missing")
        
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    title = data.get("title", "Untitled Event")
    description = data.get("description", "")
    role_needed = data.get("role_needed", "")
    location = data.get("location", "")
    date = data.get("date", "")
    skills = data.get("skills", [])
    
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
        date: $date
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

@app.post("/api/events/{event_id}/apply")
async def apply_to_event(event_id: str, request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID header is missing")
    
    # We can also capture volunteer display name from the firebase UI just to store in Neo4j for easy reading
    try:
        data = await request.json()
    except Exception:
        data = {}
    name = data.get("name", "Unknown Volunteer")

    if not driver:
        return {"status": "success"}

    query = """
    MERGE (u:User {id: $user_id})
    SET u.name = $name
    WITH u
    MATCH (e:Event {id: $event_id})
    MERGE (u)-[:APPLIED_FOR]->(e)
    """
    
    try:
        with driver.session() as session:
            session.run(query, user_id=user_id, event_id=event_id, name=name)
        return {"status": "success", "message": "Successfully applied to event"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/applications")
def get_user_applications(user_id: str):
    """
    Get all applications for a volunteer.
    """
    if not driver:
        return {"applications": []}
        
    query = """
    MATCH (u:User {id: $user_id})-[:APPLIED_FOR]->(e:Event)
    OPTIONAL MATCH (e)<-[:ORGANIZED]-(o:User)
    RETURN e.id AS event_id, e.title AS title, e.role as role, e.location as location, e.date as date, o.name as organizer
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
                    "organizer": r["organizer"] or "Organizer"
                })
        return {"applications": apps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events/{event_id}/applications/{volunteer_id}/status")
async def update_application_status(event_id: str, volunteer_id: str, request: Request):
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID header is missing")
    
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
    RETURN r.status AS new_status
    """
    try:
        with driver.session() as session:
            result = session.run(query, organizer_id=user_id, event_id=event_id, volunteer_id=volunteer_id, status=new_status).data()
            if not result:
                raise HTTPException(status_code=404, detail="Application not found or unauthorized")
            return {"status": "success", "new_status": result[0]["new_status"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/organizers/{user_id}/analytics")
def get_organizer_analytics(user_id: str):
    if not driver:
        return {"stats": {"total_volunteers": 128, "volunteer_hours": 450, "completed_events": 14, "satisfaction": 98}}
    
    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (v:User)-[r:APPLIED_FOR {status: 'ACCEPTED'}]->(e)
    RETURN 
        count(DISTINCT v) AS total_volunteers,
        count(DISTINCT e) AS completed_events,
        count(v) * 4 AS volunteer_hours,
        98 AS satisfaction
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).data()
            if result:
                return {"stats": result[0]}
            return {"stats": {"total_volunteers": 0, "volunteer_hours": 0, "completed_events": 0, "satisfaction": 0}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/organizers/{user_id}/dashboard")
def get_organizer_dashboard(user_id: str):
    """
    Get stats and recent applications for an organizer's events.
    """
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
    RETURN v.id AS volunteer_id, v.name AS volunteer_name,
           e.id AS event_id, e.title AS event_title, e.role as role_applied,
    ORDER BY e.title
    LIMIT 20
    """
    
    events_query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(es:Skill)
    RETURN e.id AS id, e.title AS title, e.role AS role, e.location AS location, 
           e.date AS date, collect(es.name) AS skills
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
                    "skills": r["skills"]
                })
                
        return {
            "stats": {
                "active_events": active_events,
                "pending_applications": pending_apps,
                "total_volunteers": stats_res[0]["total_volunteers"]
            },
            "applications": applications,
            "recent_events": active_events_list
        }
    except Exception as e:
        print("db error:", str(e))
        return {"stats": {"active_events": 0, "pending_applications": 0, "total_volunteers": 0}, "applications": []}

@app.get("/api/organizers/{user_id}/events")
def get_organizer_events(user_id: str):
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
                    "volunteersTotal": 20,
                    "status": "Active"
                })
        return {"events": events}
    except Exception as e:
        print("db error in get_organizer_events:", str(e))
        return {"events": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
