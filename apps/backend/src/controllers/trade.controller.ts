import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TradeRepository } from "../repositories/trade.repository.js";
import { UnauthorizedError, NotFoundError } from "../utils/errors.js";

const repo = new TradeRepository();

const CreateTradeSchema = z.object({
  symbol: z.string().toUpperCase().min(1),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive().nullable().optional(),
  quantity: z.number().int().positive(),
  pnl: z.number().nullable().optional(),
  status: z.enum(["OPEN", "CLOSED"]),
  entryTime: z.string().transform((val) => new Date(val)),
  exitTime: z
    .string()
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
  emotion: z.string().nullable().optional(),
  mistake: z.string().nullable().optional(),
  lesson: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  tags: z.array(z.string()),
  initialNote: z.string().optional(),
});

const UpdateTradeSchema = z.object({
  symbol: z.string().toUpperCase().min(1).optional(),
  direction: z.enum(["BUY", "SELL"]).optional(),
  entryPrice: z.number().positive().optional(),
  exitPrice: z.number().positive().nullable().optional(),
  quantity: z.number().int().positive().optional(),
  pnl: z.number().nullable().optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  entryTime: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  exitTime: z
    .string()
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
  emotion: z.string().nullable().optional(),
  mistake: z.string().nullable().optional(),
  lesson: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

const CreateNoteSchema = z.object({
  content: z.string().min(1),
});

export const getTrades = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  try {
    const trades = await repo.findByUserId(userId);

    let filtered = trades;
    const { status, symbol, tag } = req.query;

    if (status && typeof status === "string") {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (symbol && typeof symbol === "string") {
      const q = symbol.toUpperCase();
      filtered = filtered.filter((t) => t.symbol.includes(q));
    }
    if (tag && typeof tag === "string") {
      filtered = filtered.filter((t) => t.tags.includes(tag));
    }

    res.json(filtered);
  } catch (error) {
    next(error);
  }
};

export const createTrade = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  try {
    const parsed = CreateTradeSchema.parse(req.body);
    const trade = await repo.createTrade(userId, parsed);
    res.status(201).json(trade);
  } catch (error) {
    next(error);
  }
};

export const updateTrade = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id } = req.params;

  try {
    const existing = await repo.findById(id, userId);
    if (!existing) return next(new NotFoundError("Trade log entry not found"));

    const parsed = UpdateTradeSchema.parse(req.body);
    const updated = await repo.updateTrade(id, userId, parsed);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTrade = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id } = req.params;

  try {
    const existing = await repo.findById(id, userId);
    if (!existing) return next(new NotFoundError("Trade log entry not found"));

    await repo.deleteTrade(id, userId);
    res.json({ message: "Trade log deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const createTradeNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id: tradeJournalId } = req.params;

  try {
    const existing = await repo.findById(tradeJournalId, userId);
    if (!existing) return next(new NotFoundError("Trade log entry not found"));

    const { content } = CreateNoteSchema.parse(req.body);
    const note = await repo.createNote(tradeJournalId, content);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateTradeNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id: tradeJournalId, noteId } = req.params;

  try {
    const existing = await repo.findById(tradeJournalId, userId);
    if (!existing) return next(new NotFoundError("Trade log entry not found"));

    const { content } = CreateNoteSchema.parse(req.body);
    const note = await repo.updateNote(noteId, tradeJournalId, content);
    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteTradeNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new UnauthorizedError());

  const { id: tradeJournalId, noteId } = req.params;

  try {
    const existing = await repo.findById(tradeJournalId, userId);
    if (!existing) return next(new NotFoundError("Trade log entry not found"));

    await repo.deleteNote(noteId, tradeJournalId);
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    next(error);
  }
};
