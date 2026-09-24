import { Router } from "express";
import { AppError } from "../utils/AppError";
import { getUsdToInrRate } from "../services/currency.service";

export const currencyRouter = Router();

currencyRouter.get("/rate", async (_req, res, next) => {
  try {
    const rate = await getUsdToInrRate();
    res.status(200).json(rate);
  } catch (err) {
    next(err instanceof Error ? new AppError(502, err.message) : err);
  }
});
