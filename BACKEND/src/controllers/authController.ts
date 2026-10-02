import type { Request, Response } from 'express';
import * as mem from '../services/memoryStore.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { getDb } from '../services/db.js';

type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';

/**
 * Email of the single hard-wired Head Admin account. Configurable via
 * `HEAD_ADMIN_EMAIL` so this doesn't have to be a code change per
 * deployment/environment (e.g. staging vs. production). Falls back to the
 * original faculty account used during development.
 */
const HEAD_ADMIN_EMAIL = process.env.HEAD_ADMIN_EMAIL ?? '269387@vutbr.cz';

/** Roles that don't require manual verification by a Head Admin. */
const AUTO_VERIFIED: Role[] = ['STUDENT', 'HEAD_ADMIN'];

/**
 * Normalizes a free-form role string (from the client) into a canonical
 * `Role`. HEAD_ADMIN is only ever granted to `HEAD_ADMIN_EMAIL` — anyone
 * else requesting it is silently downgraded to STUDENT.
 *
 * Exported (in addition to being used internally) so it can be unit tested
 * directly — see `controllers/__tests__/authController.test.ts`.
 */
export function mapRole(raw: string, email: string): Role | null {
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

/**
 * POST /api/auth/login
 *
 * Syncs a Supabase-authenticated user into the application's own user store
 * (Postgres via Prisma, or the in-memory store when the DB is unavailable).
 * Creates the user on first login; on subsequent logins it updates the
 * profile fields but preserves the previously assigned role, since only a
 * Head Admin can change roles afterwards (see `updateUserRole`).
 */
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
 
/** GET /api/auth/users — lists all users (used by the Head Admin dashboard). */
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
 
/**
 * PATCH /api/auth/users/:id/role
 *
 * Admin-only action (enforced on the frontend) to change a user's role.
 * Roles in `AUTO_VERIFIED` are marked verified immediately; others require
 * a separate `verifyUser` call before they can book rooms that need it.
 */
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
 
/**
 * PATCH /api/auth/users/:id/verify
 *
 * Marks a CEO/GUIDE account as verified, which is a prerequisite for
 * booking rooms under `validateReservation` (see `memoryStore.ts`).
 */
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