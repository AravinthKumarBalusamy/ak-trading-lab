import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import portfolioRouter from "./portfolio.routes.js";
import watchlistRouter from "./watchlist.routes.js";
import instrumentRouter from "./instrument.routes.js";
import tradeRouter from "./trade.routes.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/portfolio", portfolioRouter);
router.use("/watchlists", watchlistRouter);
router.use("/instruments", instrumentRouter);
router.use("/trades", tradeRouter);

export default router;
