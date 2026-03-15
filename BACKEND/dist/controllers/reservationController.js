import { PrismaClient } from '@prisma/client';
import * as mem from '../services/memoryStore.js';
import { canRoleBookRoom } from '../services/roomPolicyStore.js';
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
        return prisma;
    }
    catch {
        dbAvailable = false;
        return null;
    }
}
const MAX_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours per APPLICATION_MODEL
const MIN_DURATION_MS = 15 * 60 * 1000; // 15 minutes
// GET /api/reservations
export async function listReservations(req, res) {
    const { roomName } = req.query;
    const db = await getDb();
    if (db) {
        try {
            const reservations = await db.reservation.findMany({
                where: roomName ? { roomName } : undefined,
                include: { user: { select: { firstName: true, lastName: true, email: true } } },
                orderBy: { startTime: 'asc' },
            });
            const mapped = reservations.map((r) => ({
                ...r,
                status: r.status.toLowerCase(),
                userName: r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : undefined,
            }));
            res.json(mapped);
            return;
        }
        catch { }
    }
    res.json(mem.getReservations(roomName));
}
// POST /api/reservations
export async function createReservation(req, res) {
    const { roomName, startTime, endTime, description, userId, priorityLevel } = req.body;
    // Validation
    if (!roomName || !startTime || !endTime || !userId) {
        res.status(400).json({ error: 'roomName, startTime, endTime, userId are required' });
        return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Invalid startTime or endTime' });
        return;
    }
    if (end <= start) {
        res.status(400).json({ error: 'endTime must be after startTime' });
        return;
    }
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < MIN_DURATION_MS) {
        res.status(400).json({ error: 'Minimum reservation duration is 15 minutes' });
        return;
    }
    if (durationMs > MAX_DURATION_MS) {
        res.status(400).json({ error: 'Maximum reservation duration is 3 hours' });
        return;
    }
    const db = await getDb();
    if (db) {
        try {
            // Find user to check role
            const user = await db.user.findUnique({ where: { id: userId } });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // Room access check
            if (!canRoleBookRoom(user.role, roomName)) {
                res.status(403).json({ error: `Role ${user.role} cannot book room "${roomName}"` });
                return;
            }
            const priority = priorityLevel ?? 1;
            // Find overlapping ACTIVE reservations in this room
            const overlapping = await db.reservation.findMany({
                where: {
                    roomName,
                    status: 'ACTIVE',
                    startTime: { lt: end },
                    endTime: { gt: start },
                },
            });
            if (overlapping.length > 0) {
                const maxPriority = Math.max(...overlapping.map((r) => r.priorityLevel));
                if (priority <= maxPriority) {
                    res.status(409).json({
                        error: 'Conflict: time slot occupied by equal or higher priority reservation',
                        conflicting: overlapping,
                    });
                    return;
                }
                // Preempt lower-priority reservations
                await db.reservation.updateMany({
                    where: { id: { in: overlapping.map((r) => r.id) } },
                    data: { status: 'PREEMPTED' },
                });
                // Audit log each preemption
                await db.auditLog.createMany({
                    data: overlapping.map((r) => ({
                        action: 'PREEMPTED',
                        userId,
                        reservationId: r.id,
                        details: `Preempted by priority ${priority} reservation`,
                    })),
                });
            }
            const reservation = await db.reservation.create({
                data: {
                    roomName,
                    startTime: start,
                    endTime: end,
                    description,
                    priorityLevel: priority,
                    userId,
                    status: 'ACTIVE',
                },
            });
            res.status(201).json({ reservation, preempted: overlapping });
            return;
        }
        catch (err) {
            console.error('DB reservation create failed:', err);
        }
    }
    // In-memory fallback
    try {
        const memUser = mem.findUserById(userId);
        const result = mem.createReservation({
            roomName,
            startTime,
            endTime,
            description,
            priorityLevel: priorityLevel ?? 1,
            userId,
            userName: memUser ? `${memUser.firstName ?? ''} ${memUser.lastName ?? ''}`.trim() : undefined,
        });
        res.status(201).json(result);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Conflict';
        res.status(409).json({ error: msg });
    }
}
// DELETE /api/reservations/:id
export async function deleteReservation(req, res) {
    const id = toSingleParam(req.params.id);
    if (!id) {
        res.status(400).json({ error: 'Reservation id is required' });
        return;
    }
    const { userId, userRole } = req.body;
    if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
    }
    const db = await getDb();
    if (db) {
        try {
            const reservation = await db.reservation.findUnique({ where: { id } });
            if (!reservation) {
                res.status(404).json({ error: 'Reservation not found' });
                return;
            }
            if (reservation.userId !== userId && userRole !== 'HEAD_ADMIN') {
                res.status(403).json({ error: 'You can only cancel your own reservations' });
                return;
            }
            const updated = await db.reservation.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            await db.auditLog.create({
                data: { action: 'CANCELLED', userId, reservationId: id },
            });
            res.json({ reservation: updated });
            return;
        }
        catch { }
    }
    // In-memory fallback
    try {
        const cancelled = mem.cancelReservation(id, userId, userRole ?? 'STUDENT');
        if (!cancelled) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }
        res.json({ reservation: cancelled });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Forbidden';
        res.status(403).json({ error: msg });
    }
}
// GET /api/reservations/:id
export async function getReservation(req, res) {
    const id = toSingleParam(req.params.id);
    if (!id) {
        res.status(400).json({ error: 'Reservation id is required' });
        return;
    }
    const db = await getDb();
    if (db) {
        try {
            const reservation = await db.reservation.findUnique({
                where: { id },
                include: { user: { select: { firstName: true, lastName: true, email: true } } },
            });
            if (!reservation) {
                res.status(404).json({ error: 'Not found' });
                return;
            }
            res.json(reservation);
            return;
        }
        catch { }
    }
    const r = mem.getReservationById(id);
    if (!r) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    res.json(r);
}
