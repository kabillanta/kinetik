from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["users"])

class UserSyncPayload(BaseModel):
    firebase_uid: str
    email: str
    name: str = Field(max_length=150)
    role: str
    photo_url: str = Field(default="", max_length=1000)
    bio: str = Field(default="", max_length=5000)
    location: str = Field(default="", max_length=200)

@router.post("/users")
async def create_or_sync_user(payload: UserSyncPayload, current_user: str = Depends(get_current_user)):
    """
    Create or update a user from Firebase auth.
    """
    if current_user != payload.firebase_uid:
         raise HTTPException(status_code=403, detail="Token UID does not match body UID")

    if not payload.firebase_uid or not payload.email:
        raise HTTPException(status_code=400, detail="Missing required fields")

    valid_roles = ["volunteer", "organizer"]
    if payload.role.lower() not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    driver = get_db()
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
            session.run(query, 
                        uid=payload.firebase_uid, 
                        email=payload.email, 
                        name=payload.name, 
                        role=payload.role, 
                        photo_url=payload.photo_url, 
                        bio=payload.bio, 
                        location=payload.location)
        return {"status": "success", "message": "User synced successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/users/{user_id}")
def get_user_profile(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get user profile including role.
    """
    driver = get_db()
    if not driver:
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/users/{user_id}")
def get_public_user_profile(user_id: str):
    """
    Get public user profile including stats. No auth required.
    """
    driver = get_db()
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SkillsPayload(BaseModel):
    skills: List[str]

class ProfileUpdatePayload(BaseModel):
    displayName: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    imageUrl: Optional[str] = None
    skills: Optional[List[str]] = []
    portfolioUrl: Optional[str] = None
    linkedInUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    availability: Optional[str] = None

@router.patch("/users/{user_id}")
async def update_user_profile(user_id: str, payload: ProfileUpdatePayload, current_user: str = Depends(get_current_user)):
    """Update a user's full profile settings."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    query = """
    MATCH (u:User {id: $user_id})
    SET u.name = coalesce($displayName, u.name),
        u.headline = coalesce($headline, u.headline),
        u.bio = coalesce($bio, u.bio),
        u.location = coalesce($location, u.location),
        u.photo_url = coalesce($imageUrl, u.photo_url),
        u.portfolio_url = coalesce($portfolioUrl, u.portfolio_url),
        u.linkedin_url = coalesce($linkedInUrl, u.linkedin_url),
        u.github_url = coalesce($githubUrl, u.github_url),
        u.availability = coalesce($availability, u.availability)
        
    WITH u
    OPTIONAL MATCH (u)-[r:HAS_SKILL]->()
    DELETE r
    
    WITH u
    UNWIND (CASE WHEN size($skills) = 0 THEN [null] ELSE $skills END) AS skill_name
    WITH u, skill_name
    WHERE skill_name IS NOT NULL
    MERGE (s:Skill {name: skill_name})
    MERGE (u)-[:HAS_SKILL]->(s)
    
    RETURN u.id
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, 
                user_id=user_id,
                displayName=payload.displayName,
                headline=payload.headline,
                bio=payload.bio,
                location=payload.location,
                imageUrl=payload.imageUrl,
                portfolioUrl=payload.portfolioUrl,
                linkedInUrl=payload.linkedInUrl,
                githubUrl=payload.githubUrl,
                availability=payload.availability,
                skills=[s.strip().title() for s in payload.skills if s.strip()] if payload.skills else []
            ).single()
            
            if not result:
                raise HTTPException(status_code=404, detail="User not found")
                
        return {"status": "success", "message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/skills")
async def update_user_skills(skills: List[str] = Body(...), user_id: str = Depends(get_current_user)):
    """
    Update or create a user in Neo4j and link their skills.
    Expects a JSON array of strings e.g., ["React", "Python"]
    """
    if len(skills) > 50:
        raise HTTPException(status_code=400, detail="Too many skills")

    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MERGE (u:User {id: $user_id})
    WITH u
    
    OPTIONAL MATCH (u)-[r:HAS_SKILL]->()
    DELETE r

    WITH u
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/users/{user_id}/notifications")
def get_user_notifications(user_id: str, current_user: str = Depends(get_current_user)):
    """Fetch all unread or recent notifications for a user."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    driver = get_db()
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, current_user: str = Depends(get_current_user)):
    """Mark a notification as read."""
    driver = get_db()
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
