export type UserRole = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
export type ReservationType = 'MEETING' | 'SESSION' | 'WORKSHOP' | 'PITCHDECK' | 'EVENT' | 'OTHER';
export type ReservationStatus = 'active' | 'cancelled' | 'preempted';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isVerified: boolean;
  avatarIndex?: number;
  vutId?: string;
}

export interface Reservation {
  id: string;
  roomName: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: ReservationType;
  userId: string;
  userName?: string;
  priorityLevel: number;
  status: ReservationStatus;
}

export interface Room {
  name: string;
  displayName: string;
  capacity: number;
  allowedRoles: UserRole[];
}

// ── Business rule constants (mirrored from backend) ───────────────────────────

export const ALL_ROOMS: string[] = [
  'Meeting Room',
  'Aquarium',
  'Panda Room',
  'Session Room',
  'P159',
  'The Stage',
  'Event',
];

export const ROOMS_BY_ROLE: Record<UserRole, string[]> = {
  STUDENT: ['Meeting Room', 'Aquarium', 'Panda Room'],
  CEO: ['Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
  GUIDE: ['Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
  HEAD_ADMIN: ['Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room', 'Event'],
};

export const MAX_DURATION_MINUTES: Record<UserRole, number> = {
  STUDENT: 150,    // 2.5h
  CEO: 180,
  GUIDE: 180,
  HEAD_ADMIN: 180,
};

export const PRIORITY_MAP: Record<UserRole, number> = {
  STUDENT: 1,
  CEO: 2,
  GUIDE: 3,
  HEAD_ADMIN: 4,
};

export const TYPES_BY_ROLE: Record<UserRole, ReservationType[]> = {
  STUDENT:    ['MEETING', 'OTHER'],
  CEO:        ['MEETING', 'WORKSHOP', 'PITCHDECK', 'OTHER'],
  GUIDE:      ['SESSION', 'MEETING', 'OTHER'],
  HEAD_ADMIN: ['SESSION', 'MEETING', 'WORKSHOP', 'PITCHDECK', 'EVENT', 'OTHER'],
};
