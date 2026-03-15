import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as mem from '../services/memoryStore.js';
import { validateReservation } from '../services/memoryStore.js';
import { getEffectivePriority } from '../services/priorityEngine.js';
import { canRoleBookRoom } from '../services/roomPolicyStore.js';
 
type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
type ReservationType = 'MEETING' | 'SESSION' | 'WORKSHOP' | 'PITCHDECK' | 'EVENT' | 'OTHER';
 
let prisma: PrismaClient | null = null;
let dbAvailable = false;
 
async function getDb(): Promise<PrismaClient | null> {
  if (!process.env.DATABASE_URL) return null;
  if (prisma) return dbAvailable ? prisma : null;
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    dbAvailable = true;
    return prisma;
  } catch {
    dbAvailable = false;
    return null;
  }
}
 
const VALID_TYPES: ReservationType[] = ['MEETING', 'SESSION', 'WORKSHOP', 'PITCHDECK', 'EVENT', 'OTHER'];
 
function resolveType(raw?: string): ReservationType {
  if (!raw) return 'MEETING';
  const up = raw.toUpperCase() as ReservationType;
  return VALID_TYPES.includes(up) ? up : 'OTHER';
}
 
export async function listReservations(req: Request, res: Response): Promise<void> {
  const roomName = req.query.roomName as string | undefined;
  const db = await getDb();
  if (db) {
    try {
      const where = roomName ? { roomName } : {};
      const rows = await db.reservation.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { startTime: 'asc' },
      });
      const mapped = rows.map((r: any) => ({
        ...r,
        status: r.status.toLowerCase(),
        userName: r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || r.user.email : undefined,
      }));
      res.json(mapped);
      return;
    } catch (e) { console.error(e); }
  }
  res.json(mem.getReservations(roomName));
}
 
export async function createReservation(req: Request, res: Response): Promise<void> {
  const body = req.body as any;
  const roomName = (body.roomName ?? body.roomId) as string;
  const type = resolveType(body.type ?? body.title);
  const startTime = body.startTime as string;
  const endTime = body.endTime as string;
  const description = body.description as string | undefined;
  const userId = body.userId as string;
 
  if (!roomName || !startTime || !endTime || !userId) {
    res.status(400).json({ error: 'roomName, startTime, endTime and userId are required' });
    return;
  }
 
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    res.status(400).json({ error: 'Invalid or reversed startTime/endTime' });
    return;
  }
 
  const db = await getDb();
  let userRole: Role = 'STUDENT';
  let isVerified = true;
 
  if (db) {
    try {
      const u = await db.user.findUnique({ where: { id: userId } });
      if (!u) { res.status(404).json({ error: 'User not found' }); return; }
      userRole = u.role as Role;
      isVerified = u.isVerified;
    } catch {}
  } else {
    const u = mem.findUserById(userId);
    if (!u) { res.status(404).json({ error: 'User not found' }); return; }
    userRole = u.role;
    isVerified = u.isVerified;
  }
 
  const validationError = validateReservation({ roomName, startTime, endTime, type, userId, role: userRole, isVerified });
  if (validationError) {
    res.status(422).json({ error: validationError.message, code: validationError.code });
    return;
  }
 
  if (!canRoleBookRoom(userRole, roomName)) {
    res.status(403).json({ error: `Role ${userRole} cannot book room "${roomName}"` });
    return;
  }
 
  const priority = (body.priorityLevel as number) ?? getEffectivePriority(userRole, type);
 
  if (db) {
    try {
      const overlapping = await db.reservation.findMany({
        where: { roomName, status: 'ACTIVE', startTime: { lt: end }, endTime: { gt: start } },
      });
      if (overlapping.length > 0) {
        const maxPriority = Math.max(...overlapping.map((r: any) => r.priorityLevel as number));
        if (priority <= maxPriority) {
          res.status(409).json({ error: 'Conflict', code: 'CONFLICT', conflicting: overlapping });
          return;
        }
        await db.reservation.updateMany({
          where: { id: { in: overlapping.map((r: any) => r.id as string) } },
          data: { status: 'PREEMPTED' },
        });
      }
      const reservation = await db.reservation.create({
        data: {
          roomName,
          startTime: start,
          endTime: end,
          description,
          type: type as any,
          priorityLevel: priority,
          status: 'ACTIVE',
          userId,
        },
      });
      await db.auditLog.create({
        data: {
          action: 'CREATED',
          performedById: userId,
          reservationId: reservation.id,
        } as any,
      });
      res.status(201).json({ reservation, preempted: overlapping });
      return;
    } catch (e) { console.error('createReservation DB error:', e); }
  }
 
  try {
    const memUser = mem.findUserById(userId);
    const result = mem.createReservation({
      roomName, startTime, endTime, description, type, priorityLevel: priority, userId,
      userName: memUser ? `${memUser.firstName ?? ''} ${memUser.lastName ?? ''}`.trim() || memUser.email : undefined,
    });
    res.status(201).json(result);
  } catch (e: any) {
    if (e.code === 'CONFLICT') res.status(409).json({ error: e.message, code: 'CONFLICT' });
    else res.status(422).json({ error: e.message ?? 'Reservation failed' });
  }
}
 
export async function deleteReservation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, userRole } = req.body as { userId: string; userRole?: Role };
  const reservationId = id as string;
  if (!userId) { res.status(400).json({ error: 'userId is required' }); return; }
  const db = await getDb();
  if (db) {
    try {
      const r = await db.reservation.findUnique({ where: { id: reservationId } });
      if (!r) { res.status(404).json({ error: 'Not found' }); return; }
      if (r.userId !== userId && userRole !== 'HEAD_ADMIN') {
        res.status(403).json({ error: 'Forbidden' }); return;
      }
      const updated = await db.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } });
      await db.auditLog.create({
        data: { action: 'CANCELLED', performedById: userId, reservationId: reservationId } as any,
      });
      res.json({ reservation: updated });
      return;
    } catch {}
  }
  try {
    const cancelled = mem.cancelReservation(reservationId, userId, userRole ?? 'STUDENT');
    res.json({ reservation: cancelled });
  } catch (e: any) {
    const status = e.code === 'NOT_FOUND' ? 404 : e.code === 'FORBIDDEN' ? 403 : 500;
    res.status(status).json({ error: e.message });
  }
}
 
export async function getReservation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const reservationId = id as string;
  const db = await getDb();
  if (db) {
    try {
      const r = await db.reservation.findUnique({
        where: { id: reservationId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });
      if (!r) { res.status(404).json({ error: 'Not found' }); return; }
      res.json(r); return;
    } catch {}
  }
  const r = mem.getReservationById(reservationId);
  if (!r) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(r);
}