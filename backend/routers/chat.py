from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from services.chatbot import chat_with_ai
from utils.auth import verify_token

router = APIRouter()


class ChatRequest(BaseModel):
    tenant: str = None
    question: str


@router.post("/chat")
def chat(request: ChatRequest, authorization: str = Header(None)):
    tenant_id = verify_token(authorization)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized or invalid token"
        )

    answer = chat_with_ai(
        request.question,
        tenant_id
    )

    return {
        "question": request.question,
        "answer": answer
    }