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
    allowedRooms: ['Meeting Room', 'Aquarium', 'Panda Room'],
    maxDaysAhead: 5,
  },
  CEO: {
    displayName: 'Leader',
    allowedRooms: ['Panda Room', 'Session', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 5,
  },
  GUIDE: {
    displayName: 'Guide',
    allowedRooms: ['Panda Room', 'Session', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 365,
    minLeadDays: 2,
  },
  HEAD_ADMIN: {
    displayName: 'Head Admin',
    allowedRooms: ['Events', 'Panda Room', 'Session Room', 'Aquarium', 'The Stage', 'P159', 'Meeting Room'],
    maxDaysAhead: 365,
  },
};
