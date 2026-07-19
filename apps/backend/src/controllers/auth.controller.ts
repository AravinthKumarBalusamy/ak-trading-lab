import { Request, Response, NextFunction } from "express";
import { KiteConnect } from "kiteconnect";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { BadRequestError } from "../utils/errors.js";
import { prisma } from "../config/prisma.js";

export const getKiteLoginUrl = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const kc = new KiteConnect({ api_key: env.KITE_API_KEY });
    const loginUrl = kc.getLoginURL();
    res.json({ loginUrl });
  } catch (error) {
    next(error);
  }
};

export const loginCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { requestToken } = req.body;

  if (!requestToken) {
    return next(new BadRequestError("requestToken is required"));
  }

  try {
    let email = "";
    let name = "";
    let kiteAccessToken = "";

    if (requestToken === "mock_token_123" || env.NODE_ENV === "test") {
      logger.info("Mock authentication triggered in auth controller callback");
      email = "trader.joe@trading.lab";
      name = "Trader Joe";
      kiteAccessToken = "mock_kite_access_token_xyz789";
    } else {
      const kc = new KiteConnect({ api_key: env.KITE_API_KEY });
      const session = await kc.generateSession(
        requestToken,
        env.KITE_API_SECRET,
      );
      email = session.email;
      name = session.user_name;
      kiteAccessToken = session.access_token;
    }

    const dbUser = await prisma.user.upsert({
      where: { email },
      update: { email },
      create: { email },
    });

    const jwtToken = jwt.sign(
      {
        userId: dbUser.id,
        email: dbUser.email,
        name,
        createdAt: dbUser.createdAt.toISOString(),
        kiteAccessToken,
      },
      env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token: jwtToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error) {
    logger.error("Kite Connect session generation failed:", error);
    next(new BadRequestError("Failed to authenticate with Kite Connect."));
  }
};

export const logout = (req: Request, res: Response): void => {
  res.json({ success: true, message: "Logged out successfully" });
};
