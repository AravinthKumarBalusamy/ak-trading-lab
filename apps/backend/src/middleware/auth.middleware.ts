import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";
import { logger } from "../config/logger.js";
import { User } from "@trading-lab/shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      kiteAccessToken?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  kiteAccessToken: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is missing"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      createdAt: new Date(decoded.createdAt),
    };

    req.kiteAccessToken = decoded.kiteAccessToken;

    next();
  } catch (error) {
    logger.warn(
      `JWT Verification failed: ${error instanceof Error ? error.message : "Invalid token"}`,
    );
    next(new UnauthorizedError("Invalid or expired session"));
  }
};
