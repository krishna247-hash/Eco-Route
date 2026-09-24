import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.middleware";
import { AppError } from "../utils/AppError";
import * as aiService from "../services/aiService.client";
import type { ChatMessage, ChatTripContext } from "../services/aiService.client";

export const chatRouter = Router();

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "";
}

function isTripContext(value: unknown): value is ChatTripContext {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return typeof c.origin === "string" && typeof c.destination === "string" && typeof c.nights === "number";
}

chatRouter.post("/", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const body = req.body ?? {};
    const { messages, tripContext } = body;

    if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
      throw new AppError(400, "messages must be a non-empty array of { role: 'user'|'assistant', content: string }");
    }
    if (messages[messages.length - 1].role !== "user") {
      throw new AppError(400, "the last message must be from the user");
    }
    if (tripContext !== undefined && tripContext !== null && !isTripContext(tripContext)) {
      throw new AppError(400, "tripContext, if provided, must include origin, destination, and nights");
    }

    const result = await aiService.chat({ messages, trip_context: tripContext ?? null });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
