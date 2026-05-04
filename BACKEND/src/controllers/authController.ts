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
  const supabaseUserId = (req.body.supabaseUserId || req.body.id) as string;
  const email = req.body.email as string;
  const firstName = req.body.firstName as string | undefined;
  const lastName = req.body.lastName as string | undefined;

  if (!supabaseUserId || !email) {
    res.status(400).json({ error: 'supabaseUserId and email are required' });
    return;
  }

  // Role is assigned once at creation — HEAD_ADMIN email is always HEAD_ADMIN, everyone else starts as STUDENT
  const defaultRole: Role = email === HEAD_ADMIN_EMAIL ? 'HEAD_ADMIN' : 'STUDENT';

  const db = await getDb();

  if (db) {
    try {
      const existing = await db.user.findUnique({ where: { supabaseId: supabaseUserId } });
      if (existing) {
        // Preserve stored role — only HEAD_ADMIN can change roles via the admin panel
        const updated = await db.user.update({
          where: { supabaseId: supabaseUserId },
          data: {
            email,
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
            role: defaultRole as any,
            isVerified: AUTO_VERIFIED.includes(defaultRole),
          },
        });
        res.status(201).json({ user: created, created: true });
        sendWelcomeEmail(email, firstName ?? email.split('@')[0]).catch(console.error);
      }
      return;
    } catch (e) {
      console.error('🔴 DB auth error, falling back to IN-MEMORY STORE:', e);
    }
  }

  console.warn('⚠️  [loginUser] USING IN-MEMORY STORE — DB not connected or failed');
  const isNew = !mem.findUserBySupabaseId(supabaseUserId);
  // For existing in-memory users, preserve their role
  const existingMem = mem.findUserBySupabaseId(supabaseUserId);
  const role = existingMem ? existingMem.role : defaultRole;
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
  console.warn('⚠️  [getUsers] USING IN-MEMORY STORE — DB not connected or failed');
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
  console.warn('⚠️  [updateUserRole] USING IN-MEMORY STORE — DB not connected or failed');
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
  console.warn('⚠️  [verifyUser] USING IN-MEMORY STORE — DB not connected or failed');
  const user = mem.verifyUser(id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
}