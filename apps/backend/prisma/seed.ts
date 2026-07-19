import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding database...");

  // 1. Clean existing records in correct order to avoid foreign key violations
  await prisma.tradeNote.deleteMany();
  await prisma.tradeJournal.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create default user
  const user = await prisma.user.create({
    data: {
      email: "trader.joe@trading.lab",
      name: "Trader Joe",
    },
  });
  console.log(`Created mock user: ${user.email}`);

  // 3. Create settings
  await prisma.settings.create({
    data: {
      userId: user.id,
      theme: "dark",
      paperTrading: false,
      kiteApiKey: "mock_api_key_value",
      kiteApiSecret: "mock_api_secret_value",
    },
  });
  console.log(`Created default settings for user: ${user.email}`);

  // 4. Create watchlist
  const watchlist = await prisma.watchlist.create({
    data: {
      userId: user.id,
      name: "Default Watchlist",
    },
  });

  await prisma.watchlistItem.createMany({
    data: [
      { watchlistId: watchlist.id, symbol: "NSE:RELIANCE" },
      { watchlistId: watchlist.id, symbol: "NSE:TCS" },
      { watchlistId: watchlist.id, symbol: "NSE:INFY" },
    ],
  });
  console.log(`Created default watchlist and items for user: ${user.email}`);

  // 5. Create closed trade journal entry
  const closedTrade = await prisma.tradeJournal.create({
    data: {
      userId: user.id,
      symbol: "NSE:TATASTEEL",
      direction: "BUY",
      entryPrice: 120.0,
      exitPrice: 125.5,
      quantity: 500,
      pnl: 2750.0,
      status: "CLOSED",
      entryTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      exitTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      emotion: "CONFIDENT",
      mistake: "NONE",
      lesson: "Stuck to trading plan and resistance target",
      reason: "Bounce from daily support zone",
      tags: ["swing", "support"],
    },
  });

  // Create note for closed trade
  await prisma.tradeNote.create({
    data: {
      tradeJournalId: closedTrade.id,
      content: `# Swing trade on TATASTEEL\n\n- **Setup**: Daily support test\n- **Execution**: Clear bounce with volume validation\n- **Exit**: Target hit at daily resistance\n\nNo emotion impact, disciplined trade.`,
    },
  });

  // 6. Create open trade journal entry
  await prisma.tradeJournal.create({
    data: {
      userId: user.id,
      symbol: "NSE:SBIN",
      direction: "BUY",
      entryPrice: 650.5,
      quantity: 100,
      status: "OPEN",
      entryTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      reason: "Breakout of 15m consolidation pattern",
      tags: ["intraday", "breakout"],
    },
  });
  console.log(
    `Created sample trade journal entries (1 open, 1 closed) for user: ${user.email}`,
  );

  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seed execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
