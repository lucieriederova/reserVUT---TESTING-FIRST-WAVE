import { v4 as uuidv4 } from 'uuid';
 
export type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'PREEMPTED';
export type ReservationType = 'MEETING' | 'SESSION' | 'WORKSHOP' | 'PITCHDECK' | 'EVENT' | 'GLOBAL_EVENT' | 'OTHER';
 
export interface MemUser {
  id: string;
  supabaseId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  vutId?: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
}
 
export interface MemReservation {
  id: string;
  roomName: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: ReservationType;
  priorityLevel: number;
  status: ReservationStatus;
  userId: string;
  userName?: string;
  createdAt: string;
}
 
export interface MemAuditLog {
  id: string;
  action: string;
  reason?: string;
  performedById: string;
  reservationId?: string;
  createdAt: string;
}
 
// ── Constants ─────────────────────────────────────────────────────────────────
 
export const ALLOWED_EMAIL_DOMAINS = ['@vut.cz', '@vutbr.cz'];
 
export const PRIORITY_MAP: Record<Role, number> = {
  STUDENT: 1,
  CEO: 2,
  GUIDE: 3,
  HEAD_ADMIN: 4,
};
 
// ms constraints
export const MIN_DURATION_MS = 15 * 60 * 1000;
export const MAX_DURATION_MS_STUDENT = 2.5 * 60 * 60 * 1000;
export const MAX_DURATION_MS_DEFAULT = 3 * 60 * 60 * 1000;
 
// booking-ahead limits in ms
export const MAX_AHEAD_MS_STUDENT = 5 * 24 * 60 * 60 * 1000;
export const MAX_AHEAD_MS_CEO = 5 * 24 * 60 * 60 * 1000;
export const MIN_AHEAD_MS_CEO = 24 * 60 * 60 * 1000;       // CEO: min 24h ahead
export const MIN_AHEAD_MS_GUIDE_SESSION = 2 * 24 * 60 * 60 * 1000; // Guide session: min 2 days
 
export const MAX_WEEKLY_RESERVATIONS_STUDENT = 2;
 
// rooms per role
export const ROOMS_BY_ROLE: Record<Role, string[]> = {
  STUDENT: ['Meeting Room', 'Panda Room', 'Session Room', 'P159'],
  CEO: ['Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
  GUIDE: ['Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
  HEAD_ADMIN: ['Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room', 'Event'],
};
 
// simultaneous room limits
export const MAX_SIMULTANEOUS: Record<Role, number> = {
  STUDENT: 1,
  CEO: 3,
  GUIDE: Infinity,
  HEAD_ADMIN: Infinity,
};
 
// ── State ─────────────────────────────────────────────────────────────────────
 
const users: MemUser[] = [];
const reservations: MemReservation[] = [];
const auditLogs: MemAuditLog[] = [];
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
 
function addAudit(action: string, performedById: string, reservationId?: string, reason?: string) {
  auditLogs.push({ id: uuidv4(), action, reason, performedById, reservationId, createdAt: new Date().toISOString() });
}
 
// ── Validation ────────────────────────────────────────────────────────────────
 
export function validateEmailDomain(email: string): boolean {
  return true; // testing mode - all emails allowed
}
 
export interface ValidationError {
  code: string;
  message: string;
}
 
export function validateReservation(data: {
  roomName: string;
  startTime: string;
  endTime: string;
  type: ReservationType;
  userId: string;
  role: Role;
  isVerified: boolean;
}): ValidationError | null {
  const now = new Date();
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const durationMs = end.getTime() - start.getTime();
  const aheadMs = start.getTime() - now.getTime();
 
  // Block past reservations
  if (start <= now) {
    return { code: 'PAST_TIME', message: 'Cannot create a reservation in the past.' };
  }
 
  // Verification check for CEO and GUIDE
  if ((data.role === 'CEO' || data.role === 'GUIDE') && !data.isVerified) {
    return { code: 'NOT_VERIFIED', message: 'Your account must be verified before making reservations.' };
  }
 
  // Room access
  if (!ROOMS_BY_ROLE[data.role].includes(data.roomName)) {
    return { code: 'ROOM_ACCESS_DENIED', message: `Role ${data.role} cannot book room "${data.roomName}".` };
  }
 
  // Duration
  if (durationMs < MIN_DURATION_MS) {
    return { code: 'TOO_SHORT', message: 'Minimum reservation duration is 15 minutes.' };
  }
  const maxDuration = data.role === 'STUDENT' ? MAX_DURATION_MS_STUDENT : MAX_DURATION_MS_DEFAULT;
  if (durationMs > maxDuration) {
    return { code: 'TOO_LONG', message: `Maximum duration for ${data.role} is ${data.role === 'STUDENT' ? '2.5' : '3'} hours.` };
  }
 
  // Booking-ahead rules
  if (data.role === 'STUDENT' && aheadMs > MAX_AHEAD_MS_STUDENT) {
    return { code: 'TOO_FAR_AHEAD', message: 'Students can only book up to 5 days in advance.' };
  }
  if (data.role === 'CEO') {
    if (aheadMs > MAX_AHEAD_MS_CEO) {
      return { code: 'TOO_FAR_AHEAD', message: 'CEOs can only book up to 5 days in advance.' };
    }
    if (aheadMs < MIN_AHEAD_MS_CEO) {
      return { code: 'TOO_CLOSE', message: 'CEOs must book at least 24 hours in advance.' };
    }
  }
  if (data.role === 'GUIDE' && (data.type === 'SESSION') && aheadMs < MIN_AHEAD_MS_GUIDE_SESSION) {
    return { code: 'LEAD_TIME', message: 'Guide sessions must be booked at least 2 days in advance.' };
  }
 
  // Student: max 2 bookings per week
  if (data.role === 'STUDENT') {
    const weekStart = getWeekStart(start);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekCount = reservations.filter(
      (r) =>
        r.userId === data.userId &&
        r.status === 'ACTIVE' &&
        new Date(r.startTime) >= weekStart &&
        new Date(r.startTime) < weekEnd
    ).length;
    if (weekCount >= MAX_WEEKLY_RESERVATIONS_STUDENT) {
      return { code: 'WEEKLY_LIMIT', message: 'Students can only make 2 reservations per week.' };
    }
  }
 
  // Simultaneous rooms check
  const maxSimult = MAX_SIMULTANEOUS[data.role];
  if (maxSimult !== Infinity) {
    const overlappingByUser = reservations.filter(
      (r) =>
        r.userId === data.userId &&
        r.status === 'ACTIVE' &&
        new Date(r.startTime) < end &&
        new Date(r.endTime) > start
    );
    if (overlappingByUser.length >= maxSimult) {
      return {
        code: 'SIMULTANEOUS_LIMIT',
        message: `${data.role} can only hold ${maxSimult} room(s) at the same time.`,
      };
    }
  }
 
  return null;
}
 
// ── Users ─────────────────────────────────────────────────────────────────────
 
export function upsertUser(data: {
  supabaseId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
}): MemUser {
  const existing = users.find((u) => u.supabaseId === data.supabaseId);
  if (existing) {
    existing.role = data.role;
    existing.email = data.email;
    // Only auto-set isVerified for STUDENT/HEAD_ADMIN; preserve verified state for others
    if (['STUDENT', 'HEAD_ADMIN'].includes(data.role)) {
      existing.isVerified = true;
    }
    // Don't reset isVerified to false if already verified
    if (data.firstName) existing.firstName = data.firstName;
    if (data.lastName) existing.lastName = data.lastName;
    return existing;
  }
  const newUser: MemUser = {
    id: uuidv4(),
    supabaseId: data.supabaseId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    vutId: `vut-${Date.now()}`,
    role: data.role,
    isVerified: ['STUDENT', 'HEAD_ADMIN'].includes(data.role),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}
 
export function findUserById(id: string): MemUser | undefined {
  return users.find((u) => u.id === id);
}
 
export function findUserBySupabaseId(id: string): MemUser | undefined {
  return users.find((u) => u.supabaseId === id);
}
 
export function getAllUsers(): MemUser[] {
  return [...users];
}
 
export function updateUserRole(userId: string, role: Role): MemUser | null {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  u.role = role;
  // STUDENT and HEAD_ADMIN are auto-verified; CEO/GUIDE get verified on promotion
  u.isVerified = true;
  return u;
}
 
export function verifyUser(userId: string): MemUser | null {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  u.isVerified = true;
  return u;
}
 
// ── Reservations ──────────────────────────────────────────────────────────────
 
export function getReservations(roomName?: string): MemReservation[] {
  return reservations
    .filter((r) => !roomName || r.roomName === roomName)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
 
export function getReservationById(id: string): MemReservation | undefined {
  return reservations.find((r) => r.id === id);
}
 
export function createReservation(data: {
  roomName: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: ReservationType;
  priorityLevel: number;
  userId: string;
  userName?: string;
}): { reservation: MemReservation; preempted: MemReservation[] } {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
 
  // Find overlapping active reservations in same room
  const overlapping = reservations.filter(
    (r) =>
      r.roomName === data.roomName &&
      r.status === 'ACTIVE' &&
      new Date(r.startTime) < end &&
      new Date(r.endTime) > start
  );
 
  if (overlapping.length > 0) {
    const maxPriority = Math.max(...overlapping.map((r) => r.priorityLevel));
    if (data.priorityLevel <= maxPriority) {
      throw Object.assign(
        new Error('Conflict: time slot occupied by equal or higher priority reservation.'),
        { code: 'CONFLICT', conflicting: overlapping }
      );
    }
    // Preempt lower priority
    for (const c of overlapping) {
      c.status = 'PREEMPTED';
      addAudit('PREEMPTED', data.userId, c.id, `Preempted by ${data.type} with priority ${data.priorityLevel}`);
    }
  }
 
  const reservation: MemReservation = {
    id: uuidv4(),
    roomName: data.roomName,
    startTime: data.startTime,
    endTime: data.endTime,
    description: data.description,
    type: data.type,
    priorityLevel: data.priorityLevel,
    status: 'ACTIVE',
    userId: data.userId,
    userName: data.userName,
    createdAt: new Date().toISOString(),
  };
  reservations.push(reservation);
  addAudit('CREATED', data.userId, reservation.id);
  return { reservation, preempted: overlapping };
}
 
export function cancelReservation(id: string, requestingUserId: string, requestingRole: Role): MemReservation {
  const r = reservations.find((r) => r.id === id);
  if (!r) throw Object.assign(new Error('Reservation not found'), { code: 'NOT_FOUND' });
  if (r.userId !== requestingUserId && requestingRole !== 'HEAD_ADMIN') {
    throw Object.assign(new Error('Forbidden: you can only cancel your own reservations.'), { code: 'FORBIDDEN' });
  }
  r.status = 'CANCELLED';
  addAudit('CANCELLED', requestingUserId, id);
  return r;
}
 
export function getAuditLogs(): MemAuditLog[] {
  return [...auditLogs];
}