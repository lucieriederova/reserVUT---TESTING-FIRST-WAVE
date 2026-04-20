export type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';

export interface RoleRule {
  displayName: string;
  allowedRooms: string[];
  maxDaysAhead: number;
  minLeadHours?: number;
  bookingLimit?: { count: number; windowDays: number };
  allowConcurrent?: boolean;
  priority: number;
  verifyNeeded?: boolean;
}

export const ROLE_RULES: Record<Role, RoleRule> = {
  STUDENT: {
    displayName: 'Student',
    allowedRooms: ['Meeting Room', 'Panda Room', 'Session Room', 'P159'],
    maxDaysAhead: 5,
    bookingLimit: { count: 2, windowDays: 7 },
    allowConcurrent: false,
    priority: 1,
  },
  CEO: {
    displayName: 'Leader',
    allowedRooms: ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 5,
    minLeadHours: 24,
    bookingLimit: { count: 2, windowDays: 1 },
    allowConcurrent: true,
    priority: 2,
    verifyNeeded: true,
  },
  GUIDE: {
    displayName: 'Guide',
    allowedRooms: ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 365,
    minLeadHours: 24,
    bookingLimit: { count: 99, windowDays: 365 },
    allowConcurrent: true,
    priority: 3,
    verifyNeeded: true,
  },
  HEAD_ADMIN: {
    displayName: 'Head Admin',
    allowedRooms: ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room', 'Event'],
    maxDaysAhead: 365,
    minLeadHours: 0,
    allowConcurrent: true,
    bookingLimit: undefined,
    priority: 4,
  },
};
