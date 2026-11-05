import { PrismaClient } from "@prisma/client";

// Vercel's database integrations name the connection string differently (Prisma Postgres: POSTGRES_URL).
export const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_POOLED;

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
