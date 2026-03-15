import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as mem from '../services/memoryStore.js';
import { validateEmailDomain } from '../services/memoryStore.js';

type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';

let prisma: PrismaClient | null = null;
let dbAvailable = false;

async function getDb(): Promise<PrismaClient | null> {
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
    return null;
  }
}

const AUTO_VERIFIED: Role[] = ['STUDENT', 'HEAD_ADMIN'];

function mapRole(raw: string): Role | null {
  const map: Record<string, Role> = {
    student: 'STUDENT', STUDENT: 'STUDENT',
    ceo: 'CEO', CEO: 'CEO',
    guide: 'GUIDE', Guide: 'GUIDE', GUIDE: 'GUIDE',
    'head admin': 'HEAD_ADMIN', head_admin: 'HEAD_ADMIN', HEAD_ADMIN: 'HEAD_ADMIN',
  };
  return map[raw] ?? null;
}

// POST /api/auth/login
export async function loginUser(req: Request, res: Response): Promise<void> {
  const { supabaseUserId, email, role: rawRole, firstName, lastName } = req.body as {
    supabaseUserId: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };

  if (!supabaseUserId || !email || !rawRole) {
    res.status(400).json({ error: 'supabaseUserId, email and role are required' });
    return;
  }

  if (!validateEmailDomain(email)) {
    res.status(400).json({ error: 'Only @vut.cz and @vutbr.cz email addresses are allowed.' });
    return;
  }

  const role = mapRole(rawRole);
  if (!role) {
    res.status(400).json({ error: `Invalid role: ${rawRole}` });
    return;
  }

  const db = await getDb();

  if (db) {
    try {
      const existing = await db.user.findUnique({ where: { supabaseId: supabaseUserId } });
      if (existing) {
        const updated = await db.user.update({
          where: { supabaseId: supabaseUserId },
          data: {
            role,
            email,
            isVerified: AUTO_VERIFIED.includes(role),
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
        });
        res.json({ user: updated, created: false });
      } else {
        const created = await db.user.create({
          data: {
            supabaseId: supabaseUserId,
            email,
            firstName: firstName ?? '',
            lastName: lastName ?? '',
            vutId: `vut-${Date.now()}`,
            role,
            isVerified: AUTO_VERIFIED.includes(role),
          },
        });
        res.status(201).json({ user: created, created: true });
      }
      return;
    } catch (e) {
      console.error('DB auth error, falling back:', e);
    }
  }

  const user = mem.upsertUser({ supabaseId: supabaseUserId, email, role, firstName, lastName });
  res.json({ user, created: false });
}

// GET /api/auth/users
export async function getUsers(_req: Request, res: Response): Promise<void> {
  const db = await getDb();
  if (db) {
    try {
      const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } });
      res.json({ users });
      return;
    } catch {}
  }
  res.json({ users: mem.getAllUsers() });
}

// PATCH /api/auth/users/:id/role
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role: rawRole } = req.body as { role: string };
  const role = mapRole(rawRole);
  if (!role) {
    res.status(400).json({ error: `Invalid role: ${rawRole}` });
    return;
  }
  const db = await getDb();
  if (db) {
    try {
      const user = await db.user.update({
        where: { id },
        data: { role, isVerified: AUTO_VERIFIED.includes(role) },
      });
      res.json({ user });
      return;
    } catch {}
  }
  const user = mem.updateUserRole(id, role);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
}

// PATCH /api/auth/users/:id/verify
export async function verifyUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = await getDb();
  if (db) {
    try {
      const user = await db.user.update({ where: { id }, data: { isVerified: true } });
      res.json({ user });
      return;
    } catch {}
  }
  const user = mem.verifyUser(id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
}
