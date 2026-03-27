import os
import logging
from fastapi import Header, HTTPException
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# --- Firebase Admin Setup ---
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    override_project_id = os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") or os.getenv("FIREBASE_PROJECT_ID") or "kinetik-1234"
    
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info(f"Firebase Admin initialized with credentials from {cred_path}")
    else:
        try:
            firebase_admin.initialize_app(options={"projectId": override_project_id})
            logger.info(f"Firebase Admin initialized with forced projectId: {override_project_id}")
        except Exception as e:
            logger.warning(f"Firebase Admin could not be initialized. Auth verification may fail. Error: {e}")
except ValueError:
    # App already initialized
    pass

async def get_current_user(authorization: str = Header(None)):
    """
    Verifies the Firebase ID token from the Authorization header.
    Returns the user's UID if token is valid.
    
    Raises:
        HTTPException 401: If no token provided or token is invalid
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid Authorization header. Expected: Bearer <token>"
        )
    
    token = authorization.split("Bearer ")[1]
    
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")
        return user_id
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired. Please re-authenticate.")
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
