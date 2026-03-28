"""
Standardized API response models for consistent error handling and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, Any, List


class ErrorResponse(BaseModel):
    """Standard error response format."""
    success: bool = False
    error: str
    code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Standard success response format."""
    success: bool = True
    message: str
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    """Standard paginated response format."""
    success: bool = True
    data: List[Any]
    total: int
    page: int
    limit: int
    has_more: bool


# --- User Response Models ---
class UserProfileResponse(BaseModel):
    """User profile data response."""
    id: str
    name: str
    email: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    photo_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    average_rating: Optional[float] = None
    onboarding_completed: bool = False


class UserSyncResponse(BaseModel):
    """Response after user sync/create."""
    status: str
    user_id: str
    message: str


# --- Event Response Models ---
class EventResponse(BaseModel):
    """Single event detail response."""
    id: str
    title: str
    description: str = ""
    role: str = ""
    location: str = "Remote"
    date: str = "TBD"
    status: str = "OPEN"
    volunteers_needed: int = 5
    organizer_name: str = "Unknown"
    organizer_id: str = ""
    skills: List[str] = Field(default_factory=list)
    applicant_count: int = 0
    user_has_applied: bool = False


class EventCreateResponse(BaseModel):
    """Response after creating an event."""
    status: str
    event_id: str
    message: str


class EventListResponse(BaseModel):
    """List of events response."""
    data: List[EventResponse]


# --- Application Response Models ---
class ApplicationResponse(BaseModel):
    """Application status response."""
    status: str
    message: str


class ApplicationStatusResponse(BaseModel):
    """Response after updating application status."""
    status: str
    new_status: str


# --- Review Response Models ---
class ReviewResponse(BaseModel):
    """Single review response."""
    id: str
    reviewer_name: str
    rating: int
    comment: Optional[str] = None
    created_at: Optional[str] = None


class ReviewStatsResponse(BaseModel):
    """Review statistics response."""
    average_rating: float
    total_reviews: int
    distribution: dict


# --- Dashboard Response Models ---
class VolunteerStatsResponse(BaseModel):
    """Volunteer dashboard stats."""
    reputation_score: int = 0
    events_joined: int = 0
    impact_hours: int = 0


class OrganizerStatsResponse(BaseModel):
    """Organizer dashboard stats."""
    total_events: int = 0
    active_events: int = 0
    total_applicants: int = 0


# --- Recommendation Response Models ---
class RecommendationItem(BaseModel):
    """Single recommendation item."""
    id: str
    title: str
    role_needed: str = "Volunteer"
    match_score: float = 0.1
    location: str = "Remote"
    tech_stack: List[str] = Field(default_factory=list)
    current_volunteers: int = 0
    volunteers_needed: int = 5


class RecommendationsResponse(BaseModel):
    """List of recommendations."""
    data: List[RecommendationItem]


# --- Health Response ---
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    database: str

