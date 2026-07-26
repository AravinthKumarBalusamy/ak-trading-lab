import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getMargins,
  getHoldings,
  getPositions,
  getOrders,
  placeOrder,
  cancelOrder,
} from "../controllers/portfolio.controller.js";

const router = Router();

// Apply auth middleware to all portfolio endpoints
router.use(authMiddleware);

router.get("/margins", getMargins);
router.get("/holdings", getHoldings);
router.get("/positions", getPositions);
router.get("/orders", getOrders);
router.post("/orders", placeOrder);
router.delete("/orders/:id", cancelOrder);

export default router;
