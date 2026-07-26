import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getPerformanceAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/performance", getPerformanceAnalytics);

export default router;
