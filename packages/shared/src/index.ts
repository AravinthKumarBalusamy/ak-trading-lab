import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).nullable(),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const HealthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

export interface MarginInfo {
  available: number;
  utilized: number;
}

export interface HoldingInfo {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
}

export interface PositionInfo {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  realized: number;
  unrealized: number;
}

export interface OrderInfo {
  orderId: string;
  tradingsymbol: string;
  transactionType: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: string;
  timestamp: string;
}
