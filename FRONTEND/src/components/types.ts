export type UserRole = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
export type ReservationType = 'MEETING' | 'SESSION' | 'WORKSHOP' | 'PITCHDECK' | 'EVENT' | 'GLOBAL_EVENT' | 'OTHER';
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
  id?: string;
  name: string;
  displayName?: string;
  capacity: number;
  allowedRoles: UserRole[];
}
 
export const ALL_ROOMS = [
  'Meeting Room', 'Panda Room', 'Session Room', 'P159', 'The Stage',
];
 
export const ROOMS_BY_ROLE: Record<UserRole, string[]> = {
  STUDENT:    ['Meeting Room', 'Panda Room', 'Session Room', 'P159'],
  CEO:        ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
  GUIDE:      ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
  HEAD_ADMIN: ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room', 'Event'],
};
 
export const MAX_DURATION_MINUTES: Record<UserRole, number> = {
  STUDENT: 150,
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
  HEAD_ADMIN: ['SESSION', 'MEETING', 'WORKSHOP', 'PITCHDECK', 'GLOBAL_EVENT', 'EVENT', 'OTHER'],
};