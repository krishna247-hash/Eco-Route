from types import SimpleNamespace
from unittest.mock import patch

import pytest

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


def _fake_response(text: str, stop_reason: str = "end_turn"):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)], stop_reason=stop_reason)


def test_explain_recommendation_requires_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        llm_client.explain_recommendation(ITINERARY, BASELINE)


def test_explain_recommendation_returns_model_text_and_uses_given_numbers_only(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    with patch("app.core.llm_client.anthropic.Anthropic") as mock_anthropic_cls:
        mock_client = mock_anthropic_cls.return_value
        mock_client.messages.create.return_value = _fake_response("This option cuts emissions significantly.")

        result = llm_client.explain_recommendation(ITINERARY, BASELINE)

    assert result == "This option cuts emissions significantly."

    _, kwargs = mock_client.messages.create.call_args
    prompt = kwargs["messages"][0]["content"]
    # Every figure in the prompt must be one of the given numbers, not invented.
    assert "86.5" in prompt  # itinerary carbon
    assert "344.00" in prompt  # itinerary cost
    assert "-154.0" in prompt  # carbon delta: 86.5 - 240.5
    assert "do not invent" in prompt.lower()


def test_explain_recommendation_raises_on_refusal(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    with patch("app.core.llm_client.anthropic.Anthropic") as mock_anthropic_cls:
        mock_client = mock_anthropic_cls.return_value
        mock_client.messages.create.return_value = _fake_response("", stop_reason="refusal")

        with pytest.raises(RuntimeError, match="declined"):
            llm_client.explain_recommendation(ITINERARY, BASELINE)
