import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma connection singleton.
 *
 * Both `authController` and `reservationController` previously created and
 * connected their own `PrismaClient` instance, which meant two separate
 * connection pools and duplicated fallback logic. Centralising it here means
 * a future swap of ORM/DB provider only touches one file.
 *
 * The app is designed to run without a database (see `memoryStore.ts`), so
 * `getDb()` returns `null` instead of throwing when `DATABASE_URL` is unset
 * or the connection attempt fails — callers fall back to the in-memory store.
 */
let prisma: PrismaClient | null = null;
let dbAvailable = false;

export async function getDb(): Promise<PrismaClient | null> {
  if (!process.env.DATABASE_URL) return null;
  if (prisma) return dbAvailable ? prisma : null;
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    dbAvailable = true;
    console.log('✅ DB connected');
    return prisma;
  } catch {
    console.warn('⚠️  DB unavailable — using in-memory store');
    dbAvailable = false;
    return null;
  }
}
