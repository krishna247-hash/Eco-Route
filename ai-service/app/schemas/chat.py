from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class TripContext(BaseModel):
    origin: str
    destination: str
    nights: int
    preference: str
    recommended_transport_mode: str | None = None
    recommended_accommodation_tier: str | None = None
    recommended_carbon_kg: float | None = None
    recommended_cost_usd: float | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    trip_context: TripContext | None = None

    @model_validator(mode="after")
    def _last_message_is_from_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("the last message must be from the user")
        return self


class ChatResponse(BaseModel):
    reply: str
