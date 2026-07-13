from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from utils.auth import generate_token

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    username = request.username.strip()
    password = request.password.strip()

    if username == "tenant_a" and password == "password_a":
        tenant_id = "A"
    elif username == "tenant_b" and password == "password_b":
        tenant_id = "B"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = generate_token(tenant_id)
    return {
        "token": token,
        "tenant": tenant_id
    }
