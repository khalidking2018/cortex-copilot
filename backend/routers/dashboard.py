from fastapi import APIRouter, Header, HTTPException, status
from services.dashboard_service import dashboard
from utils.auth import verify_token

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(authorization: str = Header(None)):
    tenant_id = verify_token(authorization)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized or invalid token"
        )
    return dashboard(tenant_id)