from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_db
from dependencies import get_current_user
from datetime import datetime
from typing import Optional

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
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(s:Skill)
    RETURN e.id AS event_id, e.title AS title, e.role as role, e.location as location, 
           e.date as date, e.status as event_status, o.name as organizer, o.id as organizer_id,
           r.status as status, r.created_at as applied_at, r.updated_at as status_updated_at,
           collect(DISTINCT s.name) as skills
    ORDER BY r.created_at DESC
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
                    "event_status": r["event_status"] or "OPEN",
                    "organizer": r["organizer"] or "Organizer",
                    "organizer_id": r["organizer_id"],
                    "status": r["status"] or "PENDING",
                    "applied_at": str(r["applied_at"]) if r["applied_at"] else None,
                    "status_updated_at": str(r["status_updated_at"]) if r["status_updated_at"] else None,
                    "skills": r["skills"] or []
                })
        return {"applications": apps}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/history")
def get_volunteer_history(
    user_id: str,
    current_user: str = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0)
):
    """
    Get volunteer's activity history with timestamps for timeline display.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    driver = get_db()
    if not driver:
        return {"history": [], "stats": {}}

    query = """
    MATCH (u:User {id: $user_id})-[r:APPLIED_FOR]->(e:Event)
    OPTIONAL MATCH (e)<-[:ORGANIZED]-(o:User)
    OPTIONAL MATCH (e)-[:REQUIRES_SKILL]->(s:Skill)
    WITH e, r, o, collect(DISTINCT s.name) as skills
    RETURN e.id AS event_id, e.title AS title, e.role AS role, e.location AS location,
           e.date AS date, e.status AS event_status, o.name AS organizer, o.id AS organizer_id,
           r.status AS status, r.created_at AS applied_at, r.updated_at AS status_updated_at,
           skills,
           CASE WHEN r.status = 'ACCEPTED' AND e.status = 'COMPLETED' THEN 4 ELSE 0 END AS hours
    ORDER BY r.created_at DESC
    SKIP $skip
    LIMIT $limit
    """

    stats_query = """
    MATCH (u:User {id: $user_id})-[r:APPLIED_FOR]->(e:Event)
    WITH u, r, e
    RETURN 
        count(DISTINCT e) AS total_applications,
        count(DISTINCT CASE WHEN r.status = 'ACCEPTED' THEN e END) AS accepted,
        count(DISTINCT CASE WHEN r.status = 'ACCEPTED' AND e.status = 'COMPLETED' THEN e END) AS completed,
        count(DISTINCT CASE WHEN r.status = 'ACCEPTED' AND e.status = 'COMPLETED' THEN e END) * 4 AS total_hours
    """

    try:
        with driver.session() as session:
            history_result = session.run(query, user_id=user_id, skip=skip, limit=limit)
            history = []
            for r in history_result:
                history.append({
                    "id": r["event_id"],
                    "title": r["title"] or "Untitled Event",
                    "role": r["role"],
                    "location": r["location"] or "Remote",
                    "date": r["date"] or "TBD",
                    "event_status": r["event_status"] or "OPEN",
                    "organizer": r["organizer"] or "Organizer",
                    "organizer_id": r["organizer_id"],
                    "status": r["status"] or "PENDING",
                    "applied_at": str(r["applied_at"]) if r["applied_at"] else None,
                    "status_updated_at": str(r["status_updated_at"]) if r["status_updated_at"] else None,
                    "skills": r["skills"] or [],
                    "hours": r["hours"]
                })

            stats_result = session.run(stats_query, user_id=user_id).single()
            stats = {
                "total_applications": stats_result["total_applications"] if stats_result else 0,
                "accepted": stats_result["accepted"] if stats_result else 0,
                "completed": stats_result["completed"] if stats_result else 0,
                "total_hours": stats_result["total_hours"] if stats_result else 0
            }

        return {"history": history, "stats": stats}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/analytics")
def get_volunteer_analytics(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get comprehensive analytics for a volunteer including activity trends,
    skill utilization, review stats, and community comparisons.
    """
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    driver = get_db()
    if not driver:
        return {"error": "Database unavailable"}

    # Main stats query
    stats_query = """
    MATCH (u:User {id: $user_id})
    OPTIONAL MATCH (u)-[r:APPLIED_FOR]->(e:Event)
    OPTIONAL MATCH (u)-[r_acc:APPLIED_FOR {status: 'ACCEPTED'}]->(e_acc:Event)
    OPTIONAL MATCH (u)-[r_comp:APPLIED_FOR {status: 'ACCEPTED'}]->(e_comp:Event {status: 'COMPLETED'})
    RETURN 
        count(DISTINCT e) AS total_applications,
        count(DISTINCT e_acc) AS accepted_events,
        count(DISTINCT e_comp) AS completed_events,
        count(DISTINCT e_comp) * 4 AS total_hours,
        u.average_rating AS average_rating,
        u.review_count AS review_count,
        count(DISTINCT e_acc) * 50 + count(DISTINCT e_comp) * 20 AS reputation
    """

    # Skill utilization query
    skills_query = """
    MATCH (u:User {id: $user_id})-[:APPLIED_FOR]->(e:Event)-[:REQUIRES_SKILL]->(s:Skill)
    WITH s.name AS skill, count(DISTINCT e) AS usage
    ORDER BY usage DESC
    LIMIT 10
    RETURN collect({skill: skill, count: usage}) AS skills
    """

    # Monthly activity query (last 6 months)
    monthly_query = """
    MATCH (u:User {id: $user_id})-[r:APPLIED_FOR]->(e:Event)
    WHERE r.created_at IS NOT NULL
    WITH u, r, e, 
         datetime({year: date(r.created_at).year, month: date(r.created_at).month, day: 1}) as month_start
    WITH month_start, count(DISTINCT e) as events,
         count(DISTINCT CASE WHEN r.status = 'ACCEPTED' AND e.status = 'COMPLETED' THEN e END) * 4 as hours
    ORDER BY month_start DESC
    LIMIT 6
    RETURN collect({month: toString(month_start), events: events, hours: hours}) AS monthly
    """

    # Community averages query
    community_query = """
    MATCH (u:User {role: 'volunteer'})
    OPTIONAL MATCH (u)-[r:APPLIED_FOR {status: 'ACCEPTED'}]->(e:Event {status: 'COMPLETED'})
    WITH u, count(DISTINCT e) AS completed, u.average_rating AS rating
    WHERE completed > 0
    RETURN 
        avg(completed) AS avg_events,
        avg(completed * 4) AS avg_hours,
        avg(rating) AS avg_rating
    """

    try:
        with driver.session() as session:
            # Fetch main stats
            stats_result = session.run(stats_query, user_id=user_id).single()
            
            # Fetch skill utilization
            skills_result = session.run(skills_query, user_id=user_id).single()
            skills_data = skills_result["skills"] if skills_result else []
            total_skill_usage = sum(s["count"] for s in skills_data) if skills_data else 1
            top_skills = [
                {
                    "skill": s["skill"],
                    "count": s["count"],
                    "percentage": round((s["count"] / total_skill_usage) * 100) if total_skill_usage > 0 else 0
                }
                for s in skills_data
            ]

            # Fetch monthly activity
            monthly_result = session.run(monthly_query, user_id=user_id).single()
            monthly_data = monthly_result["monthly"] if monthly_result else []
            
            # Convert month strings to readable format
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            monthly_activity = []
            for m in reversed(monthly_data):
                try:
                    month_dt = datetime.fromisoformat(m["month"].replace("Z", "+00:00"))
                    month_name = month_names[month_dt.month - 1]
                    monthly_activity.append({
                        "month": month_name,
                        "events": m["events"],
                        "hours": m["hours"]
                    })
                except (ValueError, TypeError):
                    monthly_activity.append({
                        "month": "Unknown",
                        "events": m["events"],
                        "hours": m["hours"]
                    })

            # Fetch community averages
            community_result = session.run(community_query).single()
            community_avg = {
                "events": round(community_result["avg_events"] or 5, 1),
                "hours": round(community_result["avg_hours"] or 20, 1),
                "rating": round(community_result["avg_rating"] or 4.0, 1)
            }

            return {
                "totalEvents": stats_result["total_applications"] if stats_result else 0,
                "acceptedEvents": stats_result["accepted_events"] if stats_result else 0,
                "completedEvents": stats_result["completed_events"] if stats_result else 0,
                "totalHours": stats_result["total_hours"] if stats_result else 0,
                "averageRating": round(stats_result["average_rating"] or 0, 1) if stats_result else 0,
                "reviewCount": stats_result["review_count"] if stats_result else 0,
                "reputation": stats_result["reputation"] if stats_result else 0,
                "topSkills": top_skills,
                "skillGrowth": len(top_skills),
                "monthlyActivity": monthly_activity,
                "communityAverage": community_avg
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
