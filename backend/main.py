from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from dotenv import load_dotenv

from database import driver
from routers import users, events, organizers, volunteers, recommendations

load_dotenv()

app = FastAPI(title="Kinetik API", description="Backend for the Kinetik Volunteering Platform")

# CORS Configuration
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]

# Support '*' for development/testing if explicitly set
if "*" in CORS_ORIGINS:
    allow_origins = ["*"]
else:
    allow_origins = CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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

@app.get("/api/health")
def health_check():
    if not driver:
        return {"status": "degraded", "database": "disconnected"}
    try:
        driver.verify_connectivity()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": f"error: {str(e)}"}
