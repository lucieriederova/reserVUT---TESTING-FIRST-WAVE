export type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
export type ReservationType = 'MEETING' | 'SESSION' | 'WORKSHOP' | 'PITCHDECK' | 'EVENT' | 'OTHER';

export const ROLE_PRIORITY: Record<Role, number> = {
  STUDENT: 1,
  CEO: 2,
  GUIDE: 3,
  HEAD_ADMIN: 4,
};

// Type-level priority override within a role's booking
// EVENT always wins regardless of role
export const TYPE_PRIORITY_BONUS: Record<ReservationType, number> = {
  EVENT: 10,
  SESSION: 2,
  WORKSHOP: 1,
  PITCHDECK: 1,
  MEETING: 0,
  OTHER: 0,
};

export function getEffectivePriority(role: Role, type: ReservationType): number {
  return ROLE_PRIORITY[role] + TYPE_PRIORITY_BONUS[type];
}

export function canPreempt(attackerPriority: number, defenderPriority: number): boolean {
  return attackerPriority > defenderPriority;
}
