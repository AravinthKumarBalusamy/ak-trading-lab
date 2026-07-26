import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getTrades,
  createTrade,
  updateTrade,
  deleteTrade,
  createTradeNote,
  updateTradeNote,
  deleteTradeNote,
} from "../controllers/trade.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getTrades);
router.post("/", createTrade);
router.patch("/:id", updateTrade);
router.delete("/:id", deleteTrade);
router.post("/:id/notes", createTradeNote);
router.patch("/:id/notes/:noteId", updateTradeNote);
router.delete("/:id/notes/:noteId", deleteTradeNote);

export default router;
