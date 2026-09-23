from types import SimpleNamespace
from unittest.mock import patch

import pytest
from google.genai.types import FinishReason

from app.core import llm_client

ITINERARY = {
    "label": "LOW_CARBON",
    "carbon": {"total_co2e": 86.5},
    "cost_usd": 344.0,
    "duration_hrs": 6.92,
}
BASELINE = {
    "label": "TIME_EFFICIENT",
    "carbon": {"total_co2e": 240.5},
    "cost_usd": 386.0,
    "duration_hrs": 4.5,
}


def _fake_response(text: str, finish_reason: FinishReason = FinishReason.STOP):
    return SimpleNamespace(
        text=text,
        candidates=[SimpleNamespace(finish_reason=finish_reason)],
    )


def test_explain_recommendation_requires_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        llm_client.explain_recommendation(ITINERARY, BASELINE)


def test_explain_recommendation_returns_model_text_and_uses_given_numbers_only(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.return_value = _fake_response(
            "This option cuts emissions significantly."
        )

        result = llm_client.explain_recommendation(ITINERARY, BASELINE)

    assert result == "This option cuts emissions significantly."

    _, kwargs = mock_client.models.generate_content.call_args
    prompt = kwargs["contents"]
    # Every figure in the prompt must be one of the given numbers, not invented.
    assert "86.5" in prompt  # itinerary carbon
    assert "344.00" in prompt  # itinerary cost
    assert "-154.0" in prompt  # carbon delta: 86.5 - 240.5
    assert "do not invent" in prompt.lower()


def test_explain_recommendation_raises_on_safety_block(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.return_value = _fake_response("", finish_reason=FinishReason.SAFETY)

        with pytest.raises(RuntimeError, match="declined"):
            llm_client.explain_recommendation(ITINERARY, BASELINE)


def test_explain_recommendation_accepts_max_tokens_finish(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.return_value = _fake_response(
            "This option cuts emissions", finish_reason=FinishReason.MAX_TOKENS
        )

        result = llm_client.explain_recommendation(ITINERARY, BASELINE)

    assert result == "This option cuts emissions"
