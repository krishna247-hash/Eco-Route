"""Wraps the LLM API call for natural-language explanations only. Carbon,
cost, and time numbers are computed exclusively by carbon_engine.py and
optimizer.py — this module never calculates them, only formats them into a
prompt that forbids the model from inventing or recalculating anything.

Uses Google's Gemini API (free tier via Google AI Studio) rather than a
paid API — see README.md for how to get a free GEMINI_API_KEY."""

import json
import os
import time

from google import genai
from google.genai import errors
from google.genai.types import Content, FinishReason, GenerateContentConfig, Part, ThinkingConfig

_MAX_RETRIES = 2
_RETRY_DELAY_SECONDS = 3

# Pinned to a specific "-lite" model: "gemini-3.6-flash" hit its free-tier
# *daily* quota (20 requests/day) after light testing; "-lite" models carry
# a much more generous free-tier allowance and worked reliably in testing.
_MODEL = "gemini-3.1-flash-lite"
_MAX_OUTPUT_TOKENS_PER_OPTION = 250

_CHAT_MAX_OUTPUT_TOKENS = 300
# Bounds free-tier token/request usage per chat turn -- older turns beyond
# this are dropped rather than sent, since the model doesn't need the full
# history to have a coherent conversation over a short session.
_CHAT_MAX_HISTORY_MESSAGES = 12

_CHAT_SYSTEM_INSTRUCTION = (
    "You are the EcoRoute travel assistant, embedded in a carbon-aware trip "
    "planning app. Help travelers with sustainable travel questions and "
    "questions about their EcoRoute trip.\n\n"
    "STRICT RULES:\n"
    "- If trip context is provided below, use ONLY those numbers when "
    "discussing that trip. Never invent, estimate, or recalculate a carbon, "
    "cost, or duration figure.\n"
    "- If no trip context is provided, or the traveler asks about something "
    "outside it, answer generally but never invent trip-specific numbers.\n"
    "- Hotel listings and prices shown in this app are demo data, not a "
    "live inventory -- if asked, say so plainly rather than implying a "
    "hotel can actually be booked at that price.\n"
    "- No live payment provider is connected in this app -- if asked about "
    "paying or booking, say so rather than implying it will work.\n"
    "- Stay focused on travel, sustainability, and this app; for unrelated "
    "requests, briefly say that's outside what you can help with here.\n"
    "- Keep replies concise: 2-4 sentences unless the traveler asks for more detail."
)


def _client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is required")
    return genai.Client(api_key=api_key)


def _describe_option(option: dict, baseline: dict) -> str:
    carbon_delta = option["carbon"]["total_co2e"] - baseline["carbon"]["total_co2e"]
    cost_delta = option["cost_usd"] - baseline["cost_usd"]
    duration_delta = option["duration_hrs"] - baseline["duration_hrs"]
    return (
        f"- key=\"{option['label']}\": total carbon {option['carbon']['total_co2e']:.1f} kg CO2e "
        f"(Δ{carbon_delta:+.1f} vs. baseline), total cost ${option['cost_usd']:.2f} "
        f"(Δ{cost_delta:+.2f} vs. baseline), total duration {option['duration_hrs']:.1f} hours "
        f"(Δ{duration_delta:+.1f} vs. baseline)"
    )


def _build_batch_prompt(options: list[dict], baseline: dict) -> str:
    option_lines = "\n".join(_describe_option(option, baseline) for option in options)
    keys = ", ".join(f'"{o["label"]}"' for o in options)

    return (
        "You are writing short, plain-language explanations of sustainable travel "
        "recommendations, one per option, for a traveler comparing them.\n\n"
        "STRICT RULE: for each option, use ONLY the numbers given for that option below. "
        "Do not invent, estimate, round differently, or recalculate any figure, and do not "
        "mix up numbers between options. Write exactly 2-3 sentences per option.\n\n"
        f"Conventional baseline (highest-carbon candidate, strategy: {baseline['label']}):\n"
        f"- Total carbon: {baseline['carbon']['total_co2e']:.1f} kg CO2e\n"
        f"- Total cost: ${baseline['cost_usd']:.2f}\n"
        f"- Total duration: {baseline['duration_hrs']:.1f} hours\n\n"
        f"Options (explain why a traveler might choose each one):\n{option_lines}\n\n"
        f"Respond with ONLY a JSON object, no markdown fences, mapping each option's key "
        f"to its explanation string. Include exactly these keys: {keys}."
    )


def explain_recommendations(options: list[dict], comparison_baseline: dict) -> dict[str, str]:
    """Explains every option in a single LLM call.

    Gemini's free tier caps requests per minute per model (5/min at time of
    writing) — one call per option would burn the entire quota on a single
    trip plan. Batching keeps a full /v1/recommend response to one call.
    """
    if not options:
        return {}

    prompt = _build_batch_prompt(options, comparison_baseline)
    config = GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=_MAX_OUTPUT_TOKENS_PER_OPTION * len(options),
        # This model reasons by default, spending part of the output budget
        # on hidden "thinking" tokens before any visible text. Not needed to
        # rephrase numbers into a couple of sentences.
        thinking_config=ThinkingConfig(thinking_budget=0),
        response_mime_type="application/json",
    )

    response = None
    last_exc: errors.APIError | None = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            response = _client().models.generate_content(model=_MODEL, contents=prompt, config=config)
            break
        except errors.ServerError as exc:
            # Free-tier shared capacity is occasionally briefly overloaded
            # (503) -- that's transient, unlike a 4xx, so it's worth a retry.
            last_exc = exc
            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY_SECONDS)
        except errors.APIError as exc:
            raise RuntimeError(f"LLM explanation request failed: {exc}") from exc

    if response is None:
        raise RuntimeError(f"LLM explanation request failed after {_MAX_RETRIES + 1} attempts: {last_exc}")

    candidates = response.candidates or []
    finish_reason = candidates[0].finish_reason if candidates else None
    acceptable = (FinishReason.STOP, FinishReason.MAX_TOKENS, None)
    if finish_reason not in acceptable:
        raise RuntimeError(f"LLM declined to generate explanations (finish_reason={finish_reason})")

    try:
        explanations = json.loads(response.text or "{}")
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"LLM returned invalid JSON: {exc}") from exc

    return {str(key): str(value).strip() for key, value in explanations.items()}


def _format_trip_context(trip_context: dict | None) -> str:
    if not trip_context:
        return "No trip context is available for this conversation."

    lines = [
        f"- Origin: {trip_context['origin']}",
        f"- Destination: {trip_context['destination']}",
        f"- Nights: {trip_context['nights']}",
        f"- Sustainability preference: {trip_context['preference']}",
    ]
    if trip_context.get("recommended_transport_mode"):
        lines.append(f"- Recommended transport: {trip_context['recommended_transport_mode']}")
    if trip_context.get("recommended_accommodation_tier"):
        lines.append(f"- Recommended accommodation tier: {trip_context['recommended_accommodation_tier']}")
    if trip_context.get("recommended_carbon_kg") is not None:
        lines.append(f"- Recommended option's total carbon: {trip_context['recommended_carbon_kg']:.1f} kg CO2e")
    if trip_context.get("recommended_cost_usd") is not None:
        lines.append(f"- Recommended option's total cost: ${trip_context['recommended_cost_usd']:.2f}")
    return "Current trip context:\n" + "\n".join(lines)


_CHAT_LANGUAGE_INSTRUCTION = {
    "en": "Reply in English.",
    "hi": "Reply in Hindi (Devanagari script), regardless of what script the traveler wrote in.",
}


def chat_reply(messages: list[dict], trip_context: dict | None, locale: str = "en") -> str:
    """Multi-turn chat reply. `messages` is the full conversation so far,
    each `{"role": "user"|"assistant", "content": str}`, ending with the
    newest user message. Stateless by design (the caller holds history,
    same as explain_recommendations doesn't hold state) -- there is no
    server-side session to leak between users.

    `locale` ("en"|"hi") mirrors the UI language the traveler has selected,
    so the assistant replies in the same language as the rest of the app
    rather than defaulting to English regardless of it -- a real language
    switch, not just translated button labels around an English-only bot.
    """
    if not messages or messages[-1]["role"] != "user":
        raise ValueError("messages must be non-empty and end with a user message")

    bounded = messages[-_CHAT_MAX_HISTORY_MESSAGES:]
    history = [
        Content(role="model" if m["role"] == "assistant" else "user", parts=[Part(text=m["content"])])
        for m in bounded[:-1]
    ]
    latest = bounded[-1]["content"]

    language_instruction = _CHAT_LANGUAGE_INSTRUCTION.get(locale, _CHAT_LANGUAGE_INSTRUCTION["en"])
    system_instruction = f"{_CHAT_SYSTEM_INSTRUCTION}\n\n{language_instruction}\n\n{_format_trip_context(trip_context)}"
    config = GenerateContentConfig(
        temperature=0.4,
        max_output_tokens=_CHAT_MAX_OUTPUT_TOKENS,
        thinking_config=ThinkingConfig(thinking_budget=0),
        system_instruction=system_instruction,
    )

    response = None
    last_exc: errors.APIError | None = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            chat = _client().chats.create(model=_MODEL, config=config, history=history)
            response = chat.send_message(latest)
            break
        except errors.ServerError as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY_SECONDS)
        except errors.APIError as exc:
            raise RuntimeError(f"Chat request failed: {exc}") from exc

    if response is None:
        raise RuntimeError(f"Chat request failed after {_MAX_RETRIES + 1} attempts: {last_exc}")

    candidates = response.candidates or []
    finish_reason = candidates[0].finish_reason if candidates else None
    acceptable = (FinishReason.STOP, FinishReason.MAX_TOKENS, None)
    if finish_reason not in acceptable:
        raise RuntimeError(f"LLM declined to reply (finish_reason={finish_reason})")

    return (response.text or "").strip()
