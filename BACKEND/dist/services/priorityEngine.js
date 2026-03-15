export const PRIORITY_MAP = {
    STUDENT: 1,
    GUIDE: 2,
    CEO: 3,
    HEAD_ADMIN: 4,
};
export function getPriorityLevel(role) {
    return PRIORITY_MAP[role] ?? 1;
}
export function canPreempt(attackerPriority, defenderPriority) {
    return attackerPriority > defenderPriority;
}
