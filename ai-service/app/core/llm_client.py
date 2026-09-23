"""Wraps the LLM API call for natural-language explanations only. Carbon,
cost, and time numbers are computed exclusively by carbon_engine.py and
optimizer.py — this module never calculates them, only formats them into a
prompt that forbids the model from inventing or recalculating anything."""

import os

import anthropic

_MODEL = "claude-opus-5"
_MAX_TOKENS = 400


def _client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY environment variable is required")
    return anthropic.Anthropic(api_key=api_key)


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
        response = _client().messages.create(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            output_config={"effort": "low"},
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIStatusError as exc:
        raise RuntimeError(f"LLM explanation request failed: {exc}") from exc

    if response.stop_reason == "refusal":
        raise RuntimeError("LLM declined to generate an explanation")

    return next((block.text for block in response.content if block.type == "text"), "").strip()
