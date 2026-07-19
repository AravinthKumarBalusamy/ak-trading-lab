import { prisma } from "../config/prisma.js";

export class WatchlistRepository {
  public async getWatchlistsByUserId(userId: string) {
    return prisma.watchlist.findMany({
      where: { userId, deletedAt: null },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  public async findById(id: string, userId: string) {
    return prisma.watchlist.findFirst({
      where: { id, userId, deletedAt: null },
      include: { items: true },
    });
  }

  public async createWatchlist(userId: string, name: string) {
    return prisma.watchlist.create({
      data: {
        userId,
        name,
      },
      include: { items: true },
    });
  }

  public async deleteWatchlist(id: string, userId: string) {
    return prisma.watchlist.update({
      where: { id, userId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  public async addSymbol(watchlistId: string, symbol: string) {
    const existing = await prisma.watchlistItem.findFirst({
      where: { watchlistId, symbol },
    });

    if (existing) return existing;

    return prisma.watchlistItem.create({
      data: {
        watchlistId,
        symbol,
      },
    });
  }

  public async removeSymbol(watchlistId: string, symbol: string) {
    return prisma.watchlistItem.deleteMany({
      where: {
        watchlistId,
        symbol,
      },
    });
  }
}
