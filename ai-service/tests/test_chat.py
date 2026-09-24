from types import SimpleNamespace
from unittest.mock import patch

import pytest
from google.genai import errors
from google.genai.types import FinishReason

from app.core import llm_client

TRIP_CONTEXT = {
    "origin": "London",
    "destination": "Paris",
    "nights": 3,
    "preference": "eco",
    "recommended_transport_mode": "train",
    "recommended_accommodation_tier": "eco",
    "recommended_carbon_kg": 86.5,
    "recommended_cost_usd": 344.0,
}


def _fake_response(text: str, finish_reason: FinishReason = FinishReason.STOP):
    return SimpleNamespace(text=text, candidates=[SimpleNamespace(finish_reason=finish_reason)])


def test_chat_reply_requires_non_empty_messages(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    with pytest.raises(ValueError, match="non-empty"):
        llm_client.chat_reply([], None)


def test_chat_reply_requires_last_message_from_user(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    with pytest.raises(ValueError, match="user message"):
        llm_client.chat_reply([{"role": "assistant", "content": "hi"}], None)


def test_chat_reply_sends_history_and_latest_message_separately(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    messages = [
        {"role": "user", "content": "How eco-friendly is my trip?"},
        {"role": "assistant", "content": "Your trip uses a low-carbon train route."},
        {"role": "user", "content": "What about the hotel?"},
    ]

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_chat = mock_client_cls.return_value.chats.create.return_value
        mock_chat.send_message.return_value = _fake_response("It's an eco-certified hotel.")

        result = llm_client.chat_reply(messages, TRIP_CONTEXT)

    assert result == "It's an eco-certified hotel."
    _, create_kwargs = mock_client_cls.return_value.chats.create.call_args
    history = create_kwargs["history"]
    assert len(history) == 2  # everything except the latest user message
    assert history[0].role == "user"
    assert history[1].role == "model"
    mock_chat.send_message.assert_called_once_with("What about the hotel?")


def test_chat_reply_includes_trip_context_in_system_instruction(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    messages = [{"role": "user", "content": "Summarize my trip"}]

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_chat = mock_client_cls.return_value.chats.create.return_value
        mock_chat.send_message.return_value = _fake_response("Your trip is London to Paris.")

        llm_client.chat_reply(messages, TRIP_CONTEXT)

    _, kwargs = mock_client_cls.return_value.chats.create.call_args
    system_instruction = kwargs["config"].system_instruction
    assert "London" in system_instruction
    assert "Paris" in system_instruction
    assert "86.5" in system_instruction
    assert "never invent" in system_instruction.lower()


def test_chat_reply_without_trip_context_says_so(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    messages = [{"role": "user", "content": "What's a low-carbon way to travel?"}]

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_chat = mock_client_cls.return_value.chats.create.return_value
        mock_chat.send_message.return_value = _fake_response("Trains generally beat flights.")

        llm_client.chat_reply(messages, None)

    _, kwargs = mock_client_cls.return_value.chats.create.call_args
    assert "No trip context is available" in kwargs["config"].system_instruction


def test_chat_reply_bounds_history_length(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    # 20 turns plus a final user message -- well over the cap.
    messages = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": f"message {i}"} for i in range(20)
    ]
    messages.append({"role": "user", "content": "final question"})

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_chat = mock_client_cls.return_value.chats.create.return_value
        mock_chat.send_message.return_value = _fake_response("ok")

        llm_client.chat_reply(messages, None)

    _, kwargs = mock_client_cls.return_value.chats.create.call_args
    assert len(kwargs["history"]) == llm_client._CHAT_MAX_HISTORY_MESSAGES - 1


def test_chat_reply_raises_on_safety_block(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    messages = [{"role": "user", "content": "test"}]

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_chat = mock_client_cls.return_value.chats.create.return_value
        mock_chat.send_message.return_value = _fake_response("", finish_reason=FinishReason.SAFETY)

        with pytest.raises(RuntimeError, match="declined"):
            llm_client.chat_reply(messages, None)


def test_chat_reply_retries_on_transient_server_error(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(llm_client.time, "sleep", lambda _seconds: None)
    messages = [{"role": "user", "content": "test"}]

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_chat = mock_client_cls.return_value.chats.create.return_value
        mock_chat.send_message.side_effect = [
            errors.ServerError(503, {"error": {"message": "overloaded"}}),
            _fake_response("ok now"),
        ]

        result = llm_client.chat_reply(messages, None)

    assert result == "ok now"
    assert mock_chat.send_message.call_count == 2
