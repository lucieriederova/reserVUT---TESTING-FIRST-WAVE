import { PrismaClient } from '@prisma/client';
import * as mem from '../services/memoryStore.js';
import { toSingleParam } from '../utils/params.js';
let prisma = null;
let dbAvailable = false;
async function getDb() {
    if (!process.env.DATABASE_URL)
        return null;
    if (prisma)
        return dbAvailable ? prisma : null;
    try {
        prisma = new PrismaClient();
        await prisma.$connect();
        dbAvailable = true;
        console.log('✅ Database connected');
        return prisma;
    }
    catch {
        console.warn('⚠️  Database unavailable — using in-memory store');
        dbAvailable = false;
        return null;
    }
}
const AUTO_VERIFIED_ROLES = ['STUDENT', 'HEAD_ADMIN'];
// POST /api/auth/login
export async function loginUser(req, res) {
    const { supabaseUserId, email, role, firstName, lastName } = req.body;
    if (!supabaseUserId || !email || !role) {
        res.status(400).json({ error: 'supabaseUserId, email and role are required' });
        return;
    }
    const validRoles = ['STUDENT', 'CEO', 'GUIDE', 'HEAD_ADMIN'];
    if (!validRoles.includes(role)) {
        res.status(400).json({ error: `Invalid role: ${role}` });
        return;
    }
    const db = await getDb();
    if (db) {
        try {
            const user = await db.user.upsert({
                where: { supabaseId: supabaseUserId },
                update: { role, email },
                create: {
                    supabaseId: supabaseUserId,
                    email,
                    firstName: firstName ?? '',
                    lastName: lastName ?? '',
                    role,
                    isVerified: AUTO_VERIFIED_ROLES.includes(role),
                },
            });
            res.json({ user });
            return;
        }
        catch (err) {
            console.error('DB upsert failed, falling back to memory:', err);
        }
    }
    // In-memory fallback
    const user = mem.upsertUser({ supabaseId: supabaseUserId, email, role, firstName, lastName });
    res.json({ user });
}
// GET /api/auth/users  (HEAD_ADMIN only)
export async function getUsers(_req, res) {
    const db = await getDb();
    if (db) {
        try {
            const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } });
            res.json({ users });
            return;
        }
        catch { }
    }
    res.json({ users: mem.getAllUsers() });
}
// PATCH /api/auth/users/:id/role  (HEAD_ADMIN only)
export async function updateUserRole(req, res) {
    const id = toSingleParam(req.params.id);
    if (!id) {
        res.status(400).json({ error: 'User id is required' });
        return;
    }
    const { role } = req.body;
    const validRoles = ['STUDENT', 'CEO', 'GUIDE', 'HEAD_ADMIN'];
    if (!role || !validRoles.includes(role)) {
        res.status(400).json({ error: 'Valid role is required' });
        return;
    }
    const db = await getDb();
    if (db) {
        try {
            const user = await db.user.update({
                where: { id },
                data: {
                    role,
                    isVerified: AUTO_VERIFIED_ROLES.includes(role),
                },
            });
            res.json({ user });
            return;
        }
        catch { }
    }
    const user = mem.updateUserRole(id, role);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json({ user });
}
