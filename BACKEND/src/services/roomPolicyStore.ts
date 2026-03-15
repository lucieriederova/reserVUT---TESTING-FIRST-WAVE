export type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';

export interface RoomPolicy {
  name: string;
  displayName: string;
  capacity: number;
  allowedRoles: Role[];
}

const rooms: RoomPolicy[] = [
  { name: 'Meeting Room',  displayName: 'Meeting Room',  capacity: 10, allowedRoles: ['STUDENT', 'CEO', 'GUIDE', 'HEAD_ADMIN'] },
  { name: 'Panda Room',    displayName: 'Panda Room',    capacity: 8,  allowedRoles: ['STUDENT', 'CEO', 'GUIDE', 'HEAD_ADMIN'] },
  { name: 'Session Room',  displayName: 'Session Room',  capacity: 20, allowedRoles: ['STUDENT', 'CEO', 'GUIDE', 'HEAD_ADMIN'] },
  { name: 'P159',          displayName: 'P159',          capacity: 30, allowedRoles: ['STUDENT', 'CEO', 'GUIDE', 'HEAD_ADMIN'] },
  { name: 'Aquarium',      displayName: 'Aquarium',      capacity: 15, allowedRoles: ['CEO', 'GUIDE', 'HEAD_ADMIN'] },
  { name: 'The Stage',     displayName: 'The Stage',     capacity: 50, allowedRoles: ['CEO', 'GUIDE', 'HEAD_ADMIN'] },
  { name: 'Event',         displayName: 'Event (Global)',capacity: 999,allowedRoles: ['HEAD_ADMIN'] },
];

export function getAllRooms(): RoomPolicy[] {
  return [...rooms];
}

export function getRoomsForRole(role: Role): RoomPolicy[] {
  return rooms.filter((r) => r.allowedRoles.includes(role));
}

export function getRoomPolicy(name: string): RoomPolicy | undefined {
  return rooms.find((r) => r.name === name);
}

export function canRoleBookRoom(role: Role, roomName: string): boolean {
  const policy = getRoomPolicy(roomName);
  return policy?.allowedRoles.includes(role) ?? false;
}

export function upsertRoom(policy: RoomPolicy): void {
  const i = rooms.findIndex((r) => r.name === policy.name);
  if (i >= 0) rooms[i] = policy;
  else rooms.push(policy);
}
