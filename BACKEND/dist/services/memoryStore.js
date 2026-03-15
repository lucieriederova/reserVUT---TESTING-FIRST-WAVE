import { v4 as uuidv4 } from 'uuid';
const users = [];
const reservations = [];
const auditLogs = [];
// ── Users ────────────────────────────────────────────────────────────────────
export function upsertUser(data) {
    const existing = users.find((u) => u.supabaseId === data.supabaseId);
    if (existing) {
        existing.role = data.role;
        existing.email = data.email;
        if (data.firstName)
            existing.firstName = data.firstName;
        if (data.lastName)
            existing.lastName = data.lastName;
        return existing;
    }
    const autoVerified = ['STUDENT', 'HEAD_ADMIN'];
    const newUser = {
        id: uuidv4(),
        supabaseId: data.supabaseId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isVerified: autoVerified.includes(data.role),
        createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
}
export function findUserBySupabaseId(supabaseId) {
    return users.find((u) => u.supabaseId === supabaseId);
}
export function findUserById(id) {
    return users.find((u) => u.id === id);
}
export function getAllUsers() {
    return [...users];
}
export function updateUserRole(userId, role) {
    const user = users.find((u) => u.id === userId);
    if (!user)
        return null;
    user.role = role;
    const autoVerified = ['STUDENT', 'HEAD_ADMIN'];
    user.isVerified = autoVerified.includes(role);
    return user;
}
// ── Reservations ─────────────────────────────────────────────────────────────
export function getReservations(roomName) {
    return reservations.filter((r) => (!roomName || r.roomName === roomName));
}
export function getReservationById(id) {
    return reservations.find((r) => r.id === id);
}
export function getReservationsByUser(userId) {
    return reservations.filter((r) => r.userId === userId);
}
export function checkConflicts(data) {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    const overlapping = reservations.filter((r) => {
        if (r.id === data.excludeId)
            return false;
        if (r.roomName !== data.roomName)
            return false;
        if (r.status !== 'ACTIVE')
            return false;
        const rStart = new Date(r.startTime).getTime();
        const rEnd = new Date(r.endTime).getTime();
        return start < rEnd && end > rStart;
    });
    if (overlapping.length === 0) {
        return { canBook: true, conflicting: [] };
    }
    const maxConflictPriority = Math.max(...overlapping.map((r) => r.priorityLevel));
    if (data.priorityLevel > maxConflictPriority) {
        return { canBook: true, conflicting: overlapping };
    }
    return {
        canBook: false,
        conflicting: overlapping,
        reason: 'Time slot is occupied by a reservation with equal or higher priority.',
    };
}
export function createReservation(data) {
    const { canBook, conflicting } = checkConflicts(data);
    if (!canBook) {
        throw new Error('Conflict: time slot occupied by equal or higher priority reservation.');
    }
    // Preempt lower-priority conflicts
    const preempted = [];
    for (const c of conflicting) {
        c.status = 'PREEMPTED';
        preempted.push(c);
        auditLogs.push({
            id: uuidv4(),
            action: 'PREEMPTED',
            userId: data.userId,
            reservationId: c.id,
            details: `Preempted by higher priority reservation from user ${data.userId}`,
            createdAt: new Date().toISOString(),
        });
    }
    const reservation = {
        id: uuidv4(),
        roomName: data.roomName,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        priorityLevel: data.priorityLevel,
        status: 'ACTIVE',
        userId: data.userId,
        userName: data.userName,
        createdAt: new Date().toISOString(),
    };
    reservations.push(reservation);
    return { reservation, preempted };
}
export function cancelReservation(id, requestingUserId, requestingUserRole) {
    const res = reservations.find((r) => r.id === id);
    if (!res)
        return null;
    if (res.userId !== requestingUserId && requestingUserRole !== 'HEAD_ADMIN') {
        throw new Error('Forbidden: you can only cancel your own reservations.');
    }
    res.status = 'CANCELLED';
    auditLogs.push({
        id: uuidv4(),
        action: 'CANCELLED',
        userId: requestingUserId,
        reservationId: id,
        createdAt: new Date().toISOString(),
    });
    return res;
}
// ── Audit Logs ───────────────────────────────────────────────────────────────
export function getAuditLogs() {
    return [...auditLogs];
}
