import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getWatchlists,
  createWatchlist,
  deleteWatchlist,
  addSymbol,
  removeSymbol,
} from "../controllers/watchlist.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getWatchlists);
router.post("/", createWatchlist);
router.delete("/:id", deleteWatchlist);
router.post("/:id/symbol", addSymbol);
router.post("/:id/symbol/remove", removeSymbol);

export default router;
