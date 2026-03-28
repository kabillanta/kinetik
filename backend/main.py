from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from dotenv import load_dotenv

from database import driver
from routers import users, events, organizers, volunteers, recommendations, reviews
from models.responses import ErrorResponse, HealthResponse

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Kinetik API", description="Backend for the Kinetik Volunteering Platform")

# CORS Configuration
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
# Normalize: strip spaces and trailing slashes
CORS_ORIGINS = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]

# Support '*' for development/testing if explicitly set
if "*" in CORS_ORIGINS:
    allow_origins = ["*"]
else:
    # Proactively add both variants just in case, though standard Origin header has no slash
    allow_origins = []
    for o in CORS_ORIGINS:
        allow_origins.append(o)
        # Even though browser sends no slash, some clients might. Let's be robust.
        # allow_origins.append(o + "/") # Actually, standard CORS middleware matches EXACTLY. 
        # Standard says NO SLASH. Let's stick to no slash.
    
    # Let's also ensure localhost:3000 is always allowed for dev if raw_origins is default
    if not any("localhost:3000" in o for o in allow_origins) and "localhost:3000" in raw_origins:
        allow_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-User-ID"],
)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Standard error response handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error=exc.detail, code=str(exc.status_code)).model_dump()
    )

@app.on_event("shutdown")
def close_driver():
    if driver is not None:
        driver.close()

# Include Routers
app.include_router(users.router)
app.include_router(events.router)
app.include_router(organizers.router)
app.include_router(volunteers.router)
app.include_router(recommendations.router)
app.include_router(reviews.router)

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    if not driver:
        return HealthResponse(status="degraded", database="disconnected")
    try:
        driver.verify_connectivity()
        return HealthResponse(status="healthy", database="connected")
    except Exception as e:
        return HealthResponse(status="degraded", database=f"error: {str(e)}")
