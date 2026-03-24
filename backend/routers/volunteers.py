from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/volunteers", tags=["volunteers"])

@router.get("/{user_id}/dashboard")
def get_volunteer_dashboard(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get stats for a volunteer dashboard.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    driver = get_db()
    if not driver:
        return {"stats": {"reputation_score": 850, "events_joined": 0, "impact_hours": 0}}
        
    query = """
    MATCH (v:User {id: $user_id})
    OPTIONAL MATCH (v)-[r_acc:APPLIED_FOR {status: 'ACCEPTED'}]->(e_acc:Event)
    OPTIONAL MATCH (v)-[r_done:APPLIED_FOR {status: 'ACCEPTED'}]->(e_done:Event {status: 'COMPLETED'})
    RETURN 
        count(DISTINCT e_acc) * 50 + count(DISTINCT e_done) * 20 AS reputation_score,
        count(DISTINCT e_acc) AS events_joined,
        count(DISTINCT e_done) * 4 AS impact_hours
    """
    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).data()
            if result:
                return {"stats": result[0]}
            return {"stats": {"reputation_score": 850, "events_joined": 0, "impact_hours": 0}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/applications")
def get_user_applications(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get all applications for a volunteer.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to applications")

    driver = get_db()
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
