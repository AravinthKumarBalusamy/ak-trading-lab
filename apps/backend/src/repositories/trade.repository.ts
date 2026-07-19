import { prisma } from "../config/prisma.js";

export class TradeRepository {
  public async findByUserId(userId: string) {
    return prisma.tradeJournal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { entryTime: "desc" },
      include: { notes: true },
    });
  }
}
