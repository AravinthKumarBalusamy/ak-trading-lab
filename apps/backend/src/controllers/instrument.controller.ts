import { Request, Response, NextFunction } from "express";
import { instrumentService } from "../services/instrument.service.js";

export const searchInstruments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const query = req.query.q;
  if (!query || typeof query !== "string") {
    res.json([]);
    return;
  }

  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const matches = await instrumentService.search(query, limit);
    res.json(matches);
  } catch (error) {
    next(error);
  }
};
