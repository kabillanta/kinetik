import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List
from database import get_db
from dependencies import get_current_user
from services.email import (
    send_application_received,
    send_application_status_update,
    send_new_application_to_organizer,
    send_review_request
)

router = APIRouter(prefix="/api/events", tags=["events"])

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., max_length=5000)
    role_needed: str = Field(..., max_length=100)
    location: str = Field(..., max_length=150)
    date: str = Field(..., max_length=100)
    skills: List[str] = Field(default_factory=list, max_length=20)
    volunteers_needed: int = Field(default=5, ge=1, le=500)


class ApplyRequest(BaseModel):
    name: str = Field(default="Unknown Volunteer", max_length=100)


class StatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(ACCEPTED|REJECTED)$")

@router.post("")
def create_event(event: EventCreate, user_id: str = Depends(get_current_user)):
    """Create a new event in Neo4j and link it to the organizer and required skills."""
    title = event.title
    description = event.description
    role_needed = event.role_needed
    location = event.location
    date = event.date
    skills = event.skills
    volunteers_needed = event.volunteers_needed
    
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
        volunteers_needed: $volunteers_needed,
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
                        volunteers_needed=volunteers_needed,
                        skills=[s.strip().title() for s in skills if s.strip()])
        return {"status": "success", "event_id": event_id, "message": "Event created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{event_id}")
def get_event_detail(event_id: str, current_user: str = Depends(get_current_user)):
    """Get full details for a single event."""
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    # First verify user has access to this event
    visibility_query = """
    MATCH (e:Event {id: $event_id})
    WHERE e.status = 'OPEN'
       OR EXISTS { MATCH (u:User {id: $user_id})-[:ORGANIZED]->(e) }
       OR EXISTS { MATCH (u:User {id: $user_id})-[:APPLIED_FOR]->(e) }
    RETURN e.id AS id
    """

    query = """
    MATCH (e:Event {id: $event_id})
    OPTIONAL MATCH (o:User)-[:ORGANIZED]->(e)
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(s:Skill)
    OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
    OPTIONAL MATCH (current:User {id: $user_id})-[applied:APPLIED_FOR]->(e)
    RETURN e.id AS id, e.title AS title, e.description AS description, e.status AS status,
           e.role AS role, e.location AS location, e.date AS date, e.volunteers_needed AS volunteers_needed,
           o.name AS organizer_name, o.id AS organizer_id,
           collect(DISTINCT s.name) AS skills,
           count(DISTINCT v) AS applicant_count,
           applied IS NOT NULL AS user_has_applied
    """
    try:
        with driver.session() as session:
            # Check visibility first
            visible = session.run(visibility_query, event_id=event_id, user_id=current_user).single()
            if not visible:
                raise HTTPException(status_code=404, detail="Event not found")
            
            result = session.run(query, event_id=event_id, user_id=current_user).single()
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
                    "volunteers_needed": result.get("volunteers_needed", 5),
                    "organizer_name": result["organizer_name"] or "Unknown",
                    "organizer_id": result["organizer_id"] or "",
                    "skills": result["skills"],
                    "applicant_count": result["applicant_count"],
                    "user_has_applied": result["user_has_applied"],
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
def apply_to_event(event_id: str, body: ApplyRequest, user_id: str = Depends(get_current_user)):
    name = body.name

    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MERGE (u:User {id: $user_id})
    SET u.name = $name
    WITH u
    MATCH (e:Event {id: $event_id})
    MERGE (u)-[r:APPLIED_FOR]->(e)
    ON CREATE SET r.created_at = datetime()
    WITH u, e
    OPTIONAL MATCH (e)<-[:ORGANIZED]-(o:User)
    RETURN e.title AS event_title, e.date AS event_date, u.email AS volunteer_email,
           u.name AS volunteer_name, o.email AS organizer_email, o.name AS organizer_name
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

            result = session.run(query, user_id=user_id, event_id=event_id, name=name).single()
            
            # Send confirmation email to volunteer
            if result and result.get("volunteer_email"):
                send_application_received(
                    to=result["volunteer_email"],
                    volunteer_name=result["volunteer_name"] or name,
                    event_title=result["event_title"] or "Event",
                    event_date=result["event_date"] or "TBD"
                )
            
            # Notify organizer of new application
            if result and result.get("organizer_email"):
                # Get volunteer skills for organizer notification
                skills_query = """
                MATCH (u:User {id: $user_id})-[:HAS_SKILL]->(s:Skill)
                RETURN collect(s.name) AS skills
                """
                skills_result = session.run(skills_query, user_id=user_id).single()
                volunteer_skills = skills_result["skills"] if skills_result else []
                
                send_new_application_to_organizer(
                    to=result["organizer_email"],
                    organizer_name=result["organizer_name"] or "Organizer",
                    volunteer_name=result["volunteer_name"] or name,
                    event_title=result["event_title"] or "Event",
                    volunteer_skills=volunteer_skills
                )
            
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
def update_application_status(event_id: str, volunteer_id: str, body: StatusUpdateRequest, user_id: str = Depends(get_current_user)):
    new_status = body.status

    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (o:User {id: $organizer_id})-[:ORGANIZED]->(e:Event {id: $event_id})
    MATCH (v:User {id: $volunteer_id})-[r:APPLIED_FOR]->(e)
    SET r.status = $status, r.updated_at = datetime()
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
    RETURN new_status, v.email AS volunteer_email, v.name AS volunteer_name, e.title AS event_title
    """
    try:
        with driver.session() as session:
            result = session.run(query, organizer_id=user_id, event_id=event_id, volunteer_id=volunteer_id, status=new_status).single()
            if not result:
                raise HTTPException(status_code=404, detail="Application not found or unauthorized")
            
            # Send email notification to volunteer
            if result.get("volunteer_email"):
                send_application_status_update(
                    to=result["volunteer_email"],
                    volunteer_name=result["volunteer_name"] or "Volunteer",
                    event_title=result["event_title"] or "Event",
                    status=new_status.lower()
                )
            
            return {"status": "success", "new_status": result["new_status"]}
    except HTTPException:
        raise
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
    SET e.status = 'COMPLETED', e.completed_at = datetime()
    WITH e, o
    OPTIONAL MATCH (v:User)-[r:APPLIED_FOR {status: 'ACCEPTED'}]->(e)
    RETURN e.status AS new_status, e.title AS event_title, o.name AS organizer_name,
           collect({email: v.email, name: v.name}) AS volunteers
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=current_user, event_id=event_id).single()
            if not result:
                raise HTTPException(status_code=404, detail="Event not found or unauthorized")
            
            # Send review request emails to all accepted volunteers
            volunteers = result.get("volunteers") or []
            for volunteer in volunteers:
                if volunteer.get("email"):
                    send_review_request(
                        to=volunteer["email"],
                        volunteer_name=volunteer["name"] or "Volunteer",
                        event_title=result["event_title"] or "Event",
                        organizer_name=result["organizer_name"] or "Organizer"
                    )
            
            return {"status": "success", "new_status": result["new_status"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
