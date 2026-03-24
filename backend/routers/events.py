import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., max_length=5000)
    role_needed: str = Field(..., max_length=100)
    location: str = Field(..., max_length=150)
    date: str = Field(..., max_length=100)
    skills: List[str] = Field(default_factory=list, max_items=20)

@router.post("")
async def create_event(request: Request, event: EventCreate, user_id: str = Depends(get_current_user)):
    """Create a new event in Neo4j and link it to the organizer and required skills."""
    title = event.title
    description = event.description
    role_needed = event.role_needed
    location = event.location
    date = event.date
    skills = event.skills
    
    event_id = str(uuid.uuid4())
    
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    query = """
    MERGE (o:User {id: $user_id})
    CREATE (e:Event {
        id: $event_id,
        title: $title,
        description: $description,
        role: $role_needed,
        location: $location,
        date: $date,
        status: 'OPEN'
    })
    CREATE (o)-[:ORGANIZED]->(e)
    
    WITH e
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

@router.get("/{event_id}")
def get_event_detail(event_id: str, current_user: str = Depends(get_current_user)):
    """Get full details for a single event."""
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (e:Event {id: $event_id})
    OPTIONAL MATCH (o:User)-[:ORGANIZED]->(e)
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(s:Skill)
    OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
    RETURN e.id AS id, e.title AS title, e.description AS description, e.status AS status,
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
                    "status": result["status"] or "OPEN",
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

@router.delete("/{event_id}")
def delete_event(event_id: str, current_user: str = Depends(get_current_user)):
    """Delete an event. Only the organizer who created it can delete."""
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    OPTIONAL MATCH (e)-[r]-() 
    OPTIONAL MATCH (n:Notification {event_id: e.id})
    DELETE r, n, e
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

@router.post("/{event_id}/apply")
async def apply_to_event(event_id: str, request: Request, user_id: str = Depends(get_current_user)):
    try:
        data = await request.json()
    except Exception:
        data = {}
    name = data.get("name", "Unknown Volunteer")

    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MERGE (u:User {id: $user_id})
    SET u.name = $name
    WITH u
    MATCH (e:Event {id: $event_id})
    MERGE (u)-[:APPLIED_FOR]->(e)
    """
    
    try:
        with driver.session() as session:
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

@router.delete("/{event_id}/apply")
def withdraw_application(event_id: str, current_user: str = Depends(get_current_user)):
    """Withdraw a volunteer's application."""
    driver = get_db()
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

@router.post("/{event_id}/applications/{volunteer_id}/status")
async def update_application_status(event_id: str, volunteer_id: str, request: Request, user_id: str = Depends(get_current_user)):
    try:
        data = await request.json()
    except Exception:
        data = {}
    
    new_status = data.get("status")
    if new_status not in ["ACCEPTED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be ACCEPTED or REJECTED.")

    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (o:User {id: $organizer_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    MATCH (v:User {id: $volunteer_id})-[r:APPLIED_FOR]->(e)
    SET r.status = $status
    WITH v, e, o, $status AS new_status
    CREATE (n:Notification {
        id: randomUUID(),
        event_id: e.id,
        type: 'APPLICATION_' + new_status,
        message: 'Your application for ' + e.title + ' was ' + toLower(new_status) + ' by ' + o.name + '. Contact: ' + o.email,
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

@router.post("/{event_id}/complete")
def complete_event(event_id: str, current_user: str = Depends(get_current_user)):
    """Mark an event as completed. Only the organizer can do this."""
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    SET e.status = 'COMPLETED'
    RETURN e.status AS new_status
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=current_user, event_id=event_id).data()
            if not result:
                raise HTTPException(status_code=404, detail="Event not found or unauthorized")
            return {"status": "success", "new_status": result[0]["new_status"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
