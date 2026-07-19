import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const HealthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
