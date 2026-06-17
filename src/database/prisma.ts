import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaClient ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClient = prisma;
}

export async function checkDatabaseReadiness(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn({ error }, 'Database readiness check failed');
    return false;
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
