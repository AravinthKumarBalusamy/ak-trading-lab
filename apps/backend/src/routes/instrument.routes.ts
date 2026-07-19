import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { searchInstruments } from "../controllers/instrument.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/search", searchInstruments);

export default router;
