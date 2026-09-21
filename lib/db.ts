import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient;
try {
  prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
} catch (e) {
  console.warn("Failed to initialize Prisma Client during build:", e);
  prismaClient = {} as PrismaClient;
}

export const db = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
