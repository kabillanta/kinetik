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
        return {"status": "degraded", "database": "disconnected", "origins": allow_origins}
    try:
        driver.verify_connectivity()
        return {"status": "healthy", "database": "connected", "origins": allow_origins}
    except Exception as e:
        return {"status": "degraded", "database": f"error: {str(e)}", "origins": allow_origins}
