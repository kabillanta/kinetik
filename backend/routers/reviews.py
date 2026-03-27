from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
import uuid

from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

class ReviewCreate(BaseModel):
    event_id: str
    reviewee_id: str  # The person being reviewed
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)

class ReviewResponse(BaseModel):
    id: str
    reviewer_id: str
    reviewer_name: str
    reviewee_id: str
    event_id: str
    event_title: str
    rating: int
    comment: Optional[str]
    created_at: str

@router.post("")
def create_review(review: ReviewCreate, current_user: str = Depends(get_current_user)):
    """
    Create a review for a volunteer or organizer after an event.
    """
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    # Verify the event exists and the user participated
    verify_query = """
    MATCH (e:Event {id: $event_id})
    OPTIONAL MATCH (reviewer:User {id: $reviewer_id})
    OPTIONAL MATCH (reviewee:User {id: $reviewee_id})
    RETURN e, reviewer, reviewee
    """

    try:
        with driver.session() as session:
            result = session.run(
                verify_query,
                event_id=review.event_id,
                reviewer_id=current_user,
                reviewee_id=review.reviewee_id
            ).single()

            if not result or not result["e"]:
                raise HTTPException(status_code=404, detail="Event not found")
            if not result["reviewer"]:
                raise HTTPException(status_code=404, detail="Reviewer not found")
            if not result["reviewee"]:
                raise HTTPException(status_code=404, detail="Reviewee not found")

            # Check if review already exists
            existing_query = """
            MATCH (reviewer:User {id: $reviewer_id})-[r:REVIEWED]->(reviewee:User {id: $reviewee_id})
            WHERE r.event_id = $event_id
            RETURN r
            """
            existing = session.run(
                existing_query,
                reviewer_id=current_user,
                reviewee_id=review.reviewee_id,
                event_id=review.event_id
            ).single()

            if existing:
                raise HTTPException(status_code=400, detail="You have already reviewed this user for this event")

            # Create the review
            review_id = str(uuid.uuid4())
            create_query = """
            MATCH (reviewer:User {id: $reviewer_id})
            MATCH (reviewee:User {id: $reviewee_id})
            CREATE (reviewer)-[r:REVIEWED {
                id: $review_id,
                event_id: $event_id,
                rating: $rating,
                comment: $comment,
                created_at: datetime()
            }]->(reviewee)
            
            WITH reviewee
            OPTIONAL MATCH ()-[allReviews:REVIEWED]->(reviewee)
            WITH reviewee, avg(allReviews.rating) as avgRating, count(allReviews) as reviewCount
            SET reviewee.average_rating = avgRating, reviewee.review_count = reviewCount
            
            RETURN reviewee.average_rating as new_avg, reviewee.review_count as total_reviews
            """
            
            result = session.run(
                create_query,
                reviewer_id=current_user,
                reviewee_id=review.reviewee_id,
                review_id=review_id,
                event_id=review.event_id,
                rating=review.rating,
                comment=review.comment
            ).single()

            return {
                "status": "success",
                "review_id": review_id,
                "new_average_rating": result["new_avg"] if result else review.rating,
                "total_reviews": result["total_reviews"] if result else 1
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}")
def get_user_reviews(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: str = Depends(get_current_user)
):
    """
    Get reviews received by a user.
    """
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (reviewer:User)-[r:REVIEWED]->(reviewee:User {id: $user_id})
    OPTIONAL MATCH (e:Event {id: r.event_id})
    RETURN 
        r.id as id,
        reviewer.id as reviewer_id,
        reviewer.name as reviewer_name,
        reviewee.id as reviewee_id,
        r.event_id as event_id,
        e.title as event_title,
        r.rating as rating,
        r.comment as comment,
        r.created_at as created_at
    ORDER BY r.created_at DESC
    SKIP $skip
    LIMIT $limit
    """

    count_query = """
    MATCH ()-[r:REVIEWED]->(reviewee:User {id: $user_id})
    RETURN count(r) as total
    """

    try:
        with driver.session() as session:
            results = session.run(query, user_id=user_id, skip=skip, limit=limit).data()
            count_result = session.run(count_query, user_id=user_id).single()

            reviews = []
            for r in results:
                reviews.append({
                    "id": r["id"],
                    "reviewer_id": r["reviewer_id"],
                    "reviewer_name": r["reviewer_name"] or "Anonymous",
                    "reviewee_id": r["reviewee_id"],
                    "event_id": r["event_id"],
                    "event_title": r["event_title"] or "Unknown Event",
                    "rating": r["rating"],
                    "comment": r["comment"],
                    "created_at": str(r["created_at"]) if r["created_at"] else None
                })

            return {
                "reviews": reviews,
                "total": count_result["total"] if count_result else 0,
                "has_more": count_result["total"] > skip + limit if count_result else False
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/stats")
def get_user_review_stats(user_id: str, current_user: str = Depends(get_current_user)):
    """
    Get review statistics for a user.
    """
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (u:User {id: $user_id})
    OPTIONAL MATCH ()-[r:REVIEWED]->(u)
    RETURN 
        u.average_rating as average_rating,
        u.review_count as review_count,
        collect(r.rating) as ratings
    """

    try:
        with driver.session() as session:
            result = session.run(query, user_id=user_id).single()

            if not result:
                return {
                    "average_rating": 0,
                    "review_count": 0,
                    "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
                }

            ratings = result["ratings"] or []
            distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for r in ratings:
                if r and 1 <= r <= 5:
                    distribution[r] += 1

            return {
                "average_rating": result["average_rating"] or 0,
                "review_count": result["review_count"] or 0,
                "rating_distribution": distribution
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}/pending")
def get_pending_reviews(event_id: str, current_user: str = Depends(get_current_user)):
    """
    Get list of users the current user can review for a completed event.
    """
    driver = get_db()
    if not driver:
        raise HTTPException(status_code=503, detail="Database connection failed")

    query = """
    MATCH (e:Event {id: $event_id})
    WHERE e.status = 'COMPLETED'
    
    // Get participants the user hasn't reviewed yet
    MATCH (participant:User)-[:APPLIED_FOR|ORGANIZED]->(e)
    WHERE participant.id <> $user_id
    AND NOT EXISTS {
        MATCH (me:User {id: $user_id})-[r:REVIEWED {event_id: $event_id}]->(participant)
    }
    
    RETURN 
        participant.id as id,
        participant.name as name,
        participant.role as role,
        participant.average_rating as rating
    """

    try:
        with driver.session() as session:
            results = session.run(query, event_id=event_id, user_id=current_user).data()

            pending = []
            for r in results:
                pending.append({
                    "id": r["id"],
                    "name": r["name"] or "Unknown",
                    "role": r["role"],
                    "current_rating": r["rating"] or 0
                })

            return {"pending_reviews": pending}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
