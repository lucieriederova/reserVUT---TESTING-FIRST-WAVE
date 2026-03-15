import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as mem from '../services/memoryStore.js';
import { validateReservation, PRIORITY_MAP } from '../services/memoryStore.js';
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

// GET /api/reservations
export async function listReservations(req: Request, res: Response): Promise<void> {
  const { roomName } = req.query as { roomName?: string };
  const db = await getDb();

  if (db) {
    try {
      const where = roomName ? { roomName } : {};
      const rows = await db.reservation.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { startTime: 'asc' },
      });
      const mapped = rows.map((r) => ({
        ...r,
        status: r.status.toLowerCase(),
        type: r.type,
        userName: r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || r.user.email : undefined,
      }));
      res.json(mapped);
      return;
    } catch (e) {
      console.error('listReservations DB error:', e);
    }
  }

  res.json(mem.getReservations(roomName));
}

// POST /api/reservations
export async function createReservation(req: Request, res: Response): Promise<void> {
  const {
    roomName: rawRoom,
    roomId,
    startTime,
    endTime,
    description,
    type: rawType,
    title,
    userId,
    priorityLevel,
  } = req.body as {
    roomName?: string;
    roomId?: string;
    startTime: string;
    endTime: string;
    description?: string;
    type?: string;
    title?: string;
    userId: string;
    priorityLevel?: number;
  };

  const roomName = rawRoom ?? roomId;
  const type = resolveType(rawType ?? title);

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

  // Fetch user (DB or memory) to get role
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

  // Run all business rule validations
  const validationError = validateReservation({
    roomName,
    startTime,
    endTime,
    type,
    userId,
    role: userRole,
    isVerified,
  });
  if (validationError) {
    res.status(422).json({ error: validationError.message, code: validationError.code });
    return;
  }

  // Room access check
  if (!canRoleBookRoom(userRole, roomName)) {
    res.status(403).json({ error: `Role ${userRole} cannot book room "${roomName}"`, code: 'ROOM_ACCESS_DENIED' });
    return;
  }

  const priority = priorityLevel ?? getEffectivePriority(userRole, type);

  if (db) {
    try {
      // Find overlapping ACTIVE reservations
      const overlapping = await db.reservation.findMany({
        where: { roomName, status: 'ACTIVE', startTime: { lt: end }, endTime: { gt: start } },
      });

      if (overlapping.length > 0) {
        const maxPriority = Math.max(...overlapping.map((r) => r.priorityLevel));
        if (priority <= maxPriority) {
          res.status(409).json({
            error: 'Conflict: time slot occupied by equal or higher priority reservation.',
            code: 'CONFLICT',
            conflicting: overlapping,
          });
          return;
        }
        // Preempt
        await db.reservation.updateMany({
          where: { id: { in: overlapping.map((r) => r.id) } },
          data: { status: 'PREEMPTED' },
        });
        await db.auditLog.createMany({
          data: overlapping.map((r) => ({
            action: 'PREEMPTED',
            reason: `Preempted by ${type} (priority ${priority})`,
            performedById: userId,
            reservationId: r.id,
          })),
        });
      }

      const reservation = await db.reservation.create({
        data: {
          roomName,
          startTime: start,
          endTime: end,
          description,
          type: type as never,
          priorityLevel: priority,
          status: 'ACTIVE',
          userId,
        },
      });
      await db.auditLog.create({
        data: { action: 'CREATED', performedById: userId, reservationId: reservation.id },
      });

      res.status(201).json({ reservation, preempted: overlapping });
      return;
    } catch (e) {
      console.error('createReservation DB error:', e);
    }
  }

  // Memory fallback
  try {
    const memUser = mem.findUserById(userId);
    const result = mem.createReservation({
      roomName,
      startTime,
      endTime,
      description,
      type,
      priorityLevel: priority,
      userId,
      userName: memUser
        ? `${memUser.firstName ?? ''} ${memUser.lastName ?? ''}`.trim() || memUser.email
        : undefined,
    });
    res.status(201).json(result);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; conflicting?: unknown[] };
    if (err.code === 'CONFLICT') {
      res.status(409).json({ error: err.message, code: 'CONFLICT', conflicting: err.conflicting });
    } else {
      res.status(422).json({ error: err.message ?? 'Reservation failed' });
    }
  }
}

// DELETE /api/reservations/:id
export async function deleteReservation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, userRole } = req.body as { userId: string; userRole?: Role };

  if (!userId) { res.status(400).json({ error: 'userId is required' }); return; }

  const db = await getDb();

  if (db) {
    try {
      const r = await db.reservation.findUnique({ where: { id } });
      if (!r) { res.status(404).json({ error: 'Reservation not found' }); return; }
      if (r.userId !== userId && userRole !== 'HEAD_ADMIN') {
        res.status(403).json({ error: 'You can only cancel your own reservations', code: 'FORBIDDEN' });
        return;
      }
      const updated = await db.reservation.update({ where: { id }, data: { status: 'CANCELLED' } });
      await db.auditLog.create({ data: { action: 'CANCELLED', performedById: userId, reservationId: id } });
      res.json({ reservation: updated });
      return;
    } catch {}
  }

  try {
    const cancelled = mem.cancelReservation(id, userId, userRole ?? 'STUDENT');
    res.json({ reservation: cancelled });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
}

// GET /api/reservations/:id
export async function getReservation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = await getDb();
  if (db) {
    try {
      const r = await db.reservation.findUnique({
        where: { id },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });
      if (!r) { res.status(404).json({ error: 'Not found' }); return; }
      res.json(r);
      return;
    } catch {}
  }
  const r = mem.getReservationById(id);
  if (!r) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(r);
}
