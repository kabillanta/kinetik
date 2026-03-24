from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/organizers", tags=["organizers"])

@router.get("/{user_id}/dashboard")
def get_organizer_dashboard(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get stats and recent applications for an organizer's events.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    driver = get_db()
    if not driver:
        return {"stats": {"active_events": 0, "pending_applications": 0, "total_volunteers": 0}, "applications": []}
    
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
    except HTTPException:
        raise
    except Exception as e:
        print("db error:", str(e))
        return {"stats": {"active_events": 0, "pending_applications": 0, "total_volunteers": 0}, "applications": []}

@router.get("/{user_id}/events")
def get_organizer_events(user_id: str, current_user: str = Depends(get_current_user)):
    """Get all events organized by a user."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    driver = get_db()
    if not driver:
        return {"events": []}
        
    query = """
    MATCH (o:User {id: $user_id})-[:ORGANIZED]->(e:Event)
    OPTIONAL MATCH (v:User)-[:APPLIED_FOR]->(e)
    RETURN e.id AS id, e.title AS title, e.role AS role, e.location AS location, e.status AS status,
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
                    "status": r.get("status") or "OPEN",
                    "volunteers_filled": r["volunteers_filled"]
                })
            return {"events": events}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/analytics")
def get_organizer_analytics(user_id: str, current_user: str = Depends(get_current_user)):
    """Get analytics for an organizer."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    driver = get_db()
    if not driver:
        return {"stats": {"total_volunteers": 0, "volunteer_hours": 0, "completed_events": 0, "satisfaction": 0}}
    
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
