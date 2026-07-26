import { prisma } from "../config/prisma.js";

export interface CreateTradeInput {
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  pnl?: number | null;
  status: string;
  entryTime: Date;
  exitTime?: Date | null;
  emotion?: string | null;
  mistake?: string | null;
  lesson?: string | null;
  reason?: string | null;
  tags: string[];
  initialNote?: string;
}

export interface UpdateTradeInput {
  symbol?: string;
  direction?: string;
  entryPrice?: number;
  exitPrice?: number | null;
  quantity?: number;
  pnl?: number | null;
  status?: string;
  entryTime?: Date;
  exitTime?: Date | null;
  emotion?: string | null;
  mistake?: string | null;
  lesson?: string | null;
  reason?: string | null;
  tags?: string[];
}

export class TradeRepository {
  public async findByUserId(userId: string) {
    return prisma.tradeJournal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { entryTime: "desc" },
      include: {
        notes: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  public async findById(id: string, userId: string) {
    return prisma.tradeJournal.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        notes: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  public async createTrade(userId: string, data: CreateTradeInput) {
    const { initialNote, ...tradeData } = data;

    return prisma.tradeJournal.create({
      data: {
        userId,
        ...tradeData,
        notes: initialNote
          ? {
              create: {
                content: initialNote,
              },
            }
          : undefined,
      },
      include: {
        notes: {
          where: { deletedAt: null },
        },
      },
    });
  }

  public async updateTrade(id: string, userId: string, data: UpdateTradeInput) {
    return prisma.tradeJournal.update({
      where: { id, userId },
      data,
      include: {
        notes: {
          where: { deletedAt: null },
        },
      },
    });
  }

  public async deleteTrade(id: string, userId: string) {
    return prisma.tradeJournal.update({
      where: { id, userId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  public async createNote(tradeJournalId: string, content: string) {
    return prisma.tradeNote.create({
      data: {
        tradeJournalId,
        content,
      },
    });
  }

  public async updateNote(
    noteId: string,
    tradeJournalId: string,
    content: string,
  ) {
    return prisma.tradeNote.update({
      where: { id: noteId, tradeJournalId },
      data: {
        content,
      },
    });
  }

  public async deleteNote(noteId: string, tradeJournalId: string) {
    return prisma.tradeNote.update({
      where: { id: noteId, tradeJournalId },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
