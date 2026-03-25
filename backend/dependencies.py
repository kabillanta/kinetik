import os
from fastapi import Header, HTTPException
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from dotenv import load_dotenv

load_dotenv()

# --- Firebase Admin Setup ---
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    override_project_id = os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "kinetik-1234")
    
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(f"Firebase Admin initialized with credentials from {cred_path}")
    else:
        try:
            firebase_admin.initialize_app(options={"projectId": override_project_id})
            print(f"Firebase Admin initialized with forced projectId: {override_project_id}")
        except Exception as e:
            print(f"Warning: Firebase Admin could not be initialized. Auth verification may fail. Error: {e}")
except ValueError:
    # App already initialized
    pass

DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"

async def get_current_user(authorization: str = Header(None), x_user_id: str = Header(None)):
    """
    Verifies the Firebase ID token from the Authorization header.
    X-User-ID fallback is ONLY allowed in DEBUG_MODE (local dev).
    """
    user_id = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            user_id = decoded_token.get("uid")
        except Exception as e:
            print(f"Token verification failed: {e}")
            pass
            
    if not user_id and DEBUG_MODE and x_user_id:
        user_id = x_user_id

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
        
    return user_id
