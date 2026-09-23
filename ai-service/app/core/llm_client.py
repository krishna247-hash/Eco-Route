"""Wraps the LLM API call for natural-language explanations only. Carbon,
cost, and time numbers are computed exclusively by carbon_engine.py and
optimizer.py — this module never calculates them, only formats them into a
prompt that forbids the model from inventing or recalculating anything.

Uses Google's Gemini API (free tier via Google AI Studio) rather than a
paid API — see README.md for how to get a free GEMINI_API_KEY."""

import os

from google import genai
from google.genai import errors
from google.genai.types import FinishReason, GenerateContentConfig, ThinkingConfig

# Pinned to a specific model rather than the "-latest" alias: that alias
# was empirically overloaded (503) during testing while this one wasn't.
_MODEL = "gemini-3.6-flash"
_MAX_OUTPUT_TOKENS = 400


def _client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is required")
    return genai.Client(api_key=api_key)


def _build_prompt(itinerary: dict, comparison_baseline: dict) -> str:
    carbon_delta = itinerary["carbon"]["total_co2e"] - comparison_baseline["carbon"]["total_co2e"]
    cost_delta = itinerary["cost_usd"] - comparison_baseline["cost_usd"]
    duration_delta = itinerary["duration_hrs"] - comparison_baseline["duration_hrs"]

    return (
        "You are writing a short, plain-language explanation of a sustainable "
        "travel recommendation for a traveler comparing two trip options.\n\n"
        "STRICT RULE: use ONLY the numbers given below. Do not invent, estimate, "
        "round differently, or recalculate any figure. Write exactly 2-3 sentences.\n\n"
        f"Recommended option (strategy: {itinerary['label']}):\n"
        f"- Total carbon: {itinerary['carbon']['total_co2e']:.1f} kg CO2e\n"
        f"- Total cost: ${itinerary['cost_usd']:.2f}\n"
        f"- Total duration: {itinerary['duration_hrs']:.1f} hours\n\n"
        f"Compared against the conventional baseline option "
        f"(highest-carbon candidate, strategy: {comparison_baseline['label']}):\n"
        f"- Carbon difference vs. baseline: {carbon_delta:+.1f} kg CO2e\n"
        f"- Cost difference vs. baseline: {cost_delta:+.2f} USD\n"
        f"- Duration difference vs. baseline: {duration_delta:+.1f} hours\n\n"
        "Explain why a traveler might choose the recommended option, referencing "
        "these exact numbers where relevant."
    )


def explain_recommendation(itinerary: dict, comparison_baseline: dict) -> str:
    prompt = _build_prompt(itinerary, comparison_baseline)

    try:
        response = _client().models.generate_content(
            model=_MODEL,
            contents=prompt,
            config=GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=_MAX_OUTPUT_TOKENS,
                # This model reasons by default, spending part of the output
                # budget on hidden "thinking" tokens before any visible text.
                # Not needed to rephrase numbers into 2-3 sentences.
                thinking_config=ThinkingConfig(thinking_budget=0),
            ),
        )
    except errors.APIError as exc:
        raise RuntimeError(f"LLM explanation request failed: {exc}") from exc

    candidates = response.candidates or []
    finish_reason = candidates[0].finish_reason if candidates else None
    acceptable = (FinishReason.STOP, FinishReason.MAX_TOKENS, None)
    if finish_reason not in acceptable:
        raise RuntimeError(f"LLM declined to generate an explanation (finish_reason={finish_reason})")

    return (response.text or "").strip()
