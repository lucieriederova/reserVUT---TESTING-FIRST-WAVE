export type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';

export interface RoleRule {
  displayName: string;
  allowedRooms: string[];
  maxDaysAhead: number;
  minLeadDays?: number;
}

export const ROLE_RULES: Record<Role, RoleRule> = {
  STUDENT: {
    displayName: 'Student',
    allowedRooms: ['Meeting Room', 'Panda Room', 'Session Room', 'P159'],
    maxDaysAhead: 5,
  },
  CEO: {
    displayName: 'Leader',
    allowedRooms: ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 5,
  },
  GUIDE: {
    displayName: 'Guide',
    allowedRooms: ['Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 365,
    minLeadDays: 2,
  },
  HEAD_ADMIN: {
    displayName: 'Head Admin',
    allowedRooms: ['Event', 'Panda Room', 'Session Room', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 365,
  },
};
