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

export const placeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.kiteAccessToken;
  if (!token)
    return next(new UnauthorizedError("No active Kite Connect session found"));

  try {
    const {
      exchange,
      tradingsymbol,
      transactionType,
      quantity,
      price,
      orderType,
      product,
    } = req.body;
    const result = await kiteService.placeOrder(token, {
      exchange,
      tradingsymbol,
      transactionType,
      quantity: Number(quantity),
      price: price ? Number(price) : undefined,
      orderType,
      product,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.kiteAccessToken;
  if (!token)
    return next(new UnauthorizedError("No active Kite Connect session found"));

  try {
    const { id } = req.params;
    const result = await kiteService.cancelOrder(token, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
