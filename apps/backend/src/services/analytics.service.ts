import { TradeRepository } from "../repositories/trade.repository.js";

const repo = new TradeRepository();

export interface PerformanceAnalytics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgGain: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: Array<{
    date: string;
    equity: number;
    pnl: number;
    cumulativePnl: number;
  }>;
}

export class AnalyticsService {
  public async getPerformanceMetrics(
    userId: string,
  ): Promise<PerformanceAnalytics> {
    const trades = await repo.findByUserId(userId);

    // Filter closed trades only and sort chronologically by exitTime
    const closedTrades = trades
      .filter(
        (t) => t.status === "CLOSED" && t.exitTime !== null && t.pnl !== null,
      )
      .sort(
        (a, b) =>
          new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime(),
      );

    const totalTrades = closedTrades.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgGain: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        equityCurve: [
          { date: "Start", equity: 1000000, pnl: 0, cumulativePnl: 0 },
        ],
      };
    }

    let winsCount = 0;
    let lossesCount = 0;
    let grossProfits = 0;
    let grossLosses = 0;
    const pnlList: number[] = [];

    for (const trade of closedTrades) {
      const pnl = trade.pnl || 0;
      pnlList.push(pnl);

      if (pnl > 0) {
        winsCount++;
        grossProfits += pnl;
      } else if (pnl < 0) {
        lossesCount++;
        grossLosses += Math.abs(pnl);
      }
    }

    const winRate = (winsCount / totalTrades) * 100;
    const profitFactor =
      grossLosses === 0 ? grossProfits : grossProfits / grossLosses;
    const avgGain = winsCount === 0 ? 0 : grossProfits / winsCount;
    const avgLoss = lossesCount === 0 ? 0 : grossLosses / lossesCount;

    // Build Equity Curve (Starting balance 10,00,000 INR)
    const startBalance = 1000000;
    let cumulativePnl = 0;
    let peak = startBalance;
    let maxDrawdown = 0;

    const equityCurve = [
      {
        date: "Start",
        equity: startBalance,
        pnl: 0,
        cumulativePnl: 0,
      },
    ];

    for (const trade of closedTrades) {
      const pnl = trade.pnl || 0;
      cumulativePnl += pnl;
      const currentEquity = startBalance + cumulativePnl;

      // Drawdown check
      if (currentEquity > peak) {
        peak = currentEquity;
      }
      const drawdown = peak === 0 ? 0 : ((peak - currentEquity) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      equityCurve.push({
        date: new Date(trade.exitTime!).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        equity: currentEquity,
        pnl,
        cumulativePnl,
      });
    }

    // Sharpe Ratio calculation: mean / stdDev of PnLs
    let mean = 0;
    let variance = 0;
    let stdDev = 0;
    let sharpeRatio = 0;

    if (totalTrades > 0) {
      const sum = pnlList.reduce((acc, val) => acc + val, 0);
      mean = sum / totalTrades;

      const sqDists = pnlList.reduce(
        (acc, val) => acc + Math.pow(val - mean, 2),
        0,
      );
      variance = sqDists / totalTrades;
      stdDev = Math.sqrt(variance);

      sharpeRatio = stdDev === 0 ? 0 : mean / stdDev;
    }

    return {
      totalTrades,
      winRate,
      profitFactor,
      avgGain,
      avgLoss,
      maxDrawdown,
      sharpeRatio,
      equityCurve,
    };
  }
}

export const analyticsService = new AnalyticsService();
