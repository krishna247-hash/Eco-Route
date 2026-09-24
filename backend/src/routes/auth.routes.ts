import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL = "7d";

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: TOKEN_TTL });
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body ?? {};

    if (typeof email !== "string" || !email.includes("@")) {
      throw new AppError(400, "A valid email is required");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: typeof name === "string" ? name : undefined },
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      throw new AppError(400, "Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }

    const token = signToken(user.id);
    res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});
