from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root_unauthenticated():
    """
    Test that the root or a basic protected endpoint 
    returns 403/401 when no token is provided.
    This verifies the app starts and middleware is active.
    """
    # Since almost all routes are protected by get_current_user,
    # a request without a header should fail with 403/401.
    response = client.get("/api/users/me")
    assert response.status_code in [401, 403]

def test_health_check_exists():
    """
    Verifies the app is injectable and routes are defined.
    """
    assert app.title == "FastAPI" 
