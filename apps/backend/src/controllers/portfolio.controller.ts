import { Request, Response, NextFunction } from "express";
import { kiteService } from "../services/kite.service.js";
import { UnauthorizedError } from "../utils/errors.js";

export const getMargins = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.kiteAccessToken;
  if (!token)
    return next(new UnauthorizedError("No active Kite Connect session found"));

  try {
    const margins = await kiteService.getMargins(token);
    res.json(margins);
  } catch (error) {
    next(error);
  }
};

export const getHoldings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.kiteAccessToken;
  if (!token)
    return next(new UnauthorizedError("No active Kite Connect session found"));

  try {
    const holdings = await kiteService.getHoldings(token);
    res.json(holdings);
  } catch (error) {
    next(error);
  }
};

export const getPositions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.kiteAccessToken;
  if (!token)
    return next(new UnauthorizedError("No active Kite Connect session found"));

  try {
    const positions = await kiteService.getPositions(token);
    res.json(positions);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.kiteAccessToken;
  if (!token)
    return next(new UnauthorizedError("No active Kite Connect session found"));

  try {
    const orders = await kiteService.getOrders(token);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};
