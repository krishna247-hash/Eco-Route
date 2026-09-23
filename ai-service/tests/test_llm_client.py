import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from google.genai import errors
from google.genai.types import FinishReason

from app.core import llm_client

OPTIONS = [
    {
        "id": "train-budget",
        "label": "LOW_CARBON",
        "carbon": {"total_co2e": 86.5},
        "cost_usd": 344.0,
        "duration_hrs": 6.92,
    },
    {
        "id": "flight-budget",
        "label": "TIME_EFFICIENT",
        "carbon": {"total_co2e": 240.5},
        "cost_usd": 386.0,
        "duration_hrs": 4.5,
    },
]
BASELINE = {
    "label": "CONVENTIONAL_BASELINE",
    "carbon": {"total_co2e": 240.5},
    "cost_usd": 386.0,
    "duration_hrs": 4.5,
}


def _fake_response(payload: dict, finish_reason: FinishReason = FinishReason.STOP):
    return SimpleNamespace(text=json.dumps(payload), candidates=[SimpleNamespace(finish_reason=finish_reason)])


def test_explain_recommendations_requires_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        llm_client.explain_recommendations(OPTIONS, BASELINE)


def test_explain_recommendations_makes_a_single_call_for_all_options(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.return_value = _fake_response(
            {
                "LOW_CARBON": "Cuts emissions significantly compared to the baseline.",
                "TIME_EFFICIENT": "Matches the baseline since it IS the baseline here.",
            }
        )

        result = llm_client.explain_recommendations(OPTIONS, BASELINE)

    assert mock_client.models.generate_content.call_count == 1
    assert result["LOW_CARBON"] == "Cuts emissions significantly compared to the baseline."
    assert result["TIME_EFFICIENT"] == "Matches the baseline since it IS the baseline here."

    _, kwargs = mock_client.models.generate_content.call_args
    prompt = kwargs["contents"]
    # Every figure in the prompt must be one of the given numbers, not invented.
    assert "86.5" in prompt
    assert "240.5" in prompt
    assert "do not invent" in prompt.lower()
    assert kwargs["config"].response_mime_type == "application/json"


def test_explain_recommendations_raises_on_safety_block(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.return_value = _fake_response({}, finish_reason=FinishReason.SAFETY)

        with pytest.raises(RuntimeError, match="declined"):
            llm_client.explain_recommendations(OPTIONS, BASELINE)


def test_explain_recommendations_retries_on_transient_server_error(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(llm_client.time, "sleep", lambda _seconds: None)

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.side_effect = [
            errors.ServerError(503, {"error": {"message": "overloaded"}}),
            _fake_response({"LOW_CARBON": "ok", "TIME_EFFICIENT": "ok"}),
        ]

        result = llm_client.explain_recommendations(OPTIONS, BASELINE)

    assert mock_client.models.generate_content.call_count == 2
    assert result["LOW_CARBON"] == "ok"


def test_explain_recommendations_gives_up_after_max_retries(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(llm_client.time, "sleep", lambda _seconds: None)

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        mock_client = mock_client_cls.return_value
        mock_client.models.generate_content.side_effect = errors.ServerError(
            503, {"error": {"message": "overloaded"}}
        )

        with pytest.raises(RuntimeError, match="after 3 attempts"):
            llm_client.explain_recommendations(OPTIONS, BASELINE)

    assert mock_client.models.generate_content.call_count == 3


def test_explain_recommendations_empty_options_makes_no_call(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with patch("app.core.llm_client.genai.Client") as mock_client_cls:
        result = llm_client.explain_recommendations([], BASELINE)

    assert result == {}
    mock_client_cls.assert_not_called()
