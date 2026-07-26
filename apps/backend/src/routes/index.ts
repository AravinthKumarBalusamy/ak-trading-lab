import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import portfolioRouter from "./portfolio.routes.js";
import watchlistRouter from "./watchlist.routes.js";
import instrumentRouter from "./instrument.routes.js";
import tradeRouter from "./trade.routes.js";
import analyticsRouter from "./analytics.routes.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/portfolio", portfolioRouter);
router.use("/watchlists", watchlistRouter);
router.use("/instruments", instrumentRouter);
router.use("/trades", tradeRouter);
router.use("/analytics", analyticsRouter);

router.get("/kite/callback", (req, res) => {
  const { request_token } = req.query;
  res.redirect(
    `http://localhost:8080/auth/callback?request_token=${request_token}`,
  );
});

export default router;
