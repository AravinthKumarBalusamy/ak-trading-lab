import { Request, Response, NextFunction } from "express";
import {
  analyticsService,
  PerformanceAnalytics,
} from "../services/analytics.service.js";
import { cacheService } from "../services/cache.service.js";
import { UnauthorizedError } from "../utils/errors.js";

export const getPerformanceAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const cacheKey = `analytics:${userId}`;

  try {
    const cached = await cacheService.get<PerformanceAnalytics>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const metrics = await analyticsService.getPerformanceMetrics(userId);
    await cacheService.set(cacheKey, metrics, 10); // 10 seconds cache

    res.json(metrics);
  } catch (error) {
    next(error);
  }
};
