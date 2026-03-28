"""
Standardized API response models for consistent error handling and responses.
"""
from pydantic import BaseModel
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
