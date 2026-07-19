import { Request, Response, NextFunction } from "express";
import { WatchlistRepository } from "../repositories/watchlist.repository.js";
import { UnauthorizedError, NotFoundError } from "../utils/errors.js";

const repo = new WatchlistRepository();

export const getWatchlists = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  try {
    const watchlists = await repo.getWatchlistsByUserId(userId);
    res.json(watchlists);
  } catch (error) {
    next(error);
  }
};

export const createWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { name } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Watchlist name is required" });
    return;
  }

  try {
    const watchlist = await repo.createWatchlist(userId, name);
    res.status(201).json(watchlist);
  } catch (error) {
    next(error);
  }
};

export const deleteWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id } = req.params;

  try {
    const watchlist = await repo.findById(id, userId);
    if (!watchlist) return next(new NotFoundError("Watchlist not found"));

    await repo.deleteWatchlist(id, userId);
    res.json({ message: "Watchlist soft deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const addSymbol = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id: watchlistId } = req.params;
  const { symbol } = req.body;

  if (!symbol || typeof symbol !== "string") {
    res.status(400).json({ error: "Symbol is required" });
    return;
  }

  try {
    const watchlist = await repo.findById(watchlistId, userId);
    if (!watchlist) return next(new NotFoundError("Watchlist not found"));

    const item = await repo.addSymbol(watchlistId, symbol);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const removeSymbol = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id: watchlistId } = req.params;
  const { symbol } = req.body;

  if (!symbol || typeof symbol !== "string") {
    res.status(400).json({ error: "Symbol is required" });
    return;
  }

  try {
    const watchlist = await repo.findById(watchlistId, userId);
    if (!watchlist) return next(new NotFoundError("Watchlist not found"));

    await repo.removeSymbol(watchlistId, symbol);
    res.json({ message: "Symbol removed successfully" });
  } catch (error) {
    next(error);
  }
};
