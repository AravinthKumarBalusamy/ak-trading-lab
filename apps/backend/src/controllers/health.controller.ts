import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { HealthCheckResponse } from "@trading-lab/shared";

export const getHealth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const health: HealthCheckResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    res.json(health);
  } catch (error) {
    next(error);
  }
};
