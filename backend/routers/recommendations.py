from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_db
from dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.get("/users/{user_id}")
def get_user_event_recommendations(
    user_id: str, 
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    search_query: str = Query(default=None, max_length=200),
    current_user: str = Depends(get_current_user)
):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: cannot access another user's recommendations")
    
    driver = get_db()
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
      
      RETURN e.id AS event_id, e.title AS title, e.role as role_needed, e.location as location, 
             current_volunteers, e.volunteers_needed AS volunteers_needed,
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
                recommendations.append({
                    "id": record.get("event_id", "unknown-id"),
                    "title": record.get("title", "Event Title"),
                    "role_needed": record.get("role_needed") or "Volunteer",
                    "match_score": record.get("match_score", 0.1),
                    "location": record.get("location") or "Remote",
                    "tech_stack": record.get("matched_tech_stack") or [],
                    "current_volunteers": record.get("current_volunteers", 0),
                    "volunteers_needed": record.get("volunteers_needed", 5)
                })
            
        return {"data": recommendations}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        return {"data": []}
