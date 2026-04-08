import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as mem from '../services/memoryStore.js';
import { sendWelcomeEmail } from '../services/emailService.js';
 
type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
 
const HEAD_ADMIN_EMAIL = '269387@vutbr.cz';
 
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
 
function mapRole(raw: string, email: string): Role | null {
  const map: Record<string, Role> = {
    student: 'STUDENT', STUDENT: 'STUDENT',
    ceo: 'CEO', CEO: 'CEO',
    guide: 'GUIDE', Guide: 'GUIDE', GUIDE: 'GUIDE',
    'head admin': 'HEAD_ADMIN', head_admin: 'HEAD_ADMIN', HEAD_ADMIN: 'HEAD_ADMIN',
  };
  const role = map[raw] ?? null;
  // Only allow HEAD_ADMIN for the designated email
  if (role === 'HEAD_ADMIN' && email !== HEAD_ADMIN_EMAIL) {
    return 'STUDENT';
  }
  return role;
}
 
export async function loginUser(req: Request, res: Response): Promise<void> {
  const supabaseUserId = req.body.supabaseUserId as string;
  const email = req.body.email as string;
  const rawRole = req.body.role as string;
  const firstName = req.body.firstName as string | undefined;
  const lastName = req.body.lastName as string | undefined;
 
  if (!supabaseUserId || !email || !rawRole) {
    res.status(400).json({ error: 'supabaseUserId, email and role are required' });
    return;
  }
 
  const role = mapRole(rawRole, email);
  if (!role) {
    res.status(400).json({ error: `Invalid role: ${rawRole}` });
    return;
  }
 
  const db = await getDb();
 
  if (db) {
    try {
      const existing = await db.user.findUnique({ where: { supabaseId: supabaseUserId } });
      if (existing) {
        // Only force-set isVerified for STUDENT/HEAD_ADMIN; don't reset verified CEO/GUIDE
        const verifiedUpdate = AUTO_VERIFIED.includes(role) ? { isVerified: true } : {};
        const updated = await db.user.update({
          where: { supabaseId: supabaseUserId },
          data: {
            role: role as any,
            email,
            ...verifiedUpdate,
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
            role: role as any,
            isVerified: AUTO_VERIFIED.includes(role),
          },
        });
        res.status(201).json({ user: created, created: true });
        // Send welcome email asynchronously — don't block response
        sendWelcomeEmail(email, firstName ?? email.split('@')[0]).catch(console.error);
      }
      return;
    } catch (e) {
      console.error('DB auth error, falling back:', e);
    }
  }
 
  const isNew = !mem.findUserBySupabaseId(supabaseUserId);
  const user = mem.upsertUser({ supabaseId: supabaseUserId, email, role, firstName, lastName });
  if (isNew) {
    sendWelcomeEmail(email, firstName ?? email.split('@')[0]).catch(console.error);
  }
  res.json({ user, created: isNew });
}
 
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
 
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const rawRole = req.body.role as string;
  const role = mapRole(rawRole, '');
  if (!role) {
    res.status(400).json({ error: `Invalid role: ${rawRole}` });
    return;
  }
  const db = await getDb();
  if (db) {
    try {
      const user = await db.user.update({
        where: { id },
        data: { role: role as any, isVerified: AUTO_VERIFIED.includes(role) },
      });
      res.json({ user });
      return;
    } catch {}
  }
  const user = mem.updateUserRole(id, role);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
}
 
export async function verifyUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
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