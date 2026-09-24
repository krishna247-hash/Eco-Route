from fastapi import APIRouter

from app.core.llm_client import chat_reply
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/v1/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    messages = [m.model_dump() for m in payload.messages]
    trip_context = payload.trip_context.model_dump() if payload.trip_context else None
    reply = chat_reply(messages, trip_context)
    return ChatResponse(reply=reply)
