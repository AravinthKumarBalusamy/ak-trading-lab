import { prisma } from "../config/prisma.js";
import { User } from "@trading-lab/shared";

export class UserRepository {
  public async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return user;
  }
}
