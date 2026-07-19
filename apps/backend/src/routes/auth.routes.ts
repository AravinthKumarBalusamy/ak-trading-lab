import { Router } from "express";
import {
  getKiteLoginUrl,
  loginCallback,
  logout,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/login-url", getKiteLoginUrl);
router.post("/callback", loginCallback);
router.post("/logout", logout);

export default router;
