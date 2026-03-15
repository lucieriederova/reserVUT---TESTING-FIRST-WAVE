import type { Request, Response } from 'express';
import { getAllRooms, getRoomsForRole, upsertRoom, getRoomPolicy } from '../services/roomPolicyStore.js';
 
type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';
 
export function listRooms(req: Request, res: Response): void {
  const role = req.query.role as Role | undefined;
  const rooms = role ? getRoomsForRole(role) : getAllRooms();
  res.json(rooms);
}
 
export function createRoom(req: Request, res: Response): void {
  const { name, displayName, capacity, allowedRoles } = req.body as {
    name: string;
    displayName?: string;
    capacity: number;
    allowedRoles: Role[];
  };
  if (!name || !capacity || !allowedRoles?.length) {
    res.status(400).json({ error: 'name, capacity and allowedRoles are required' });
    return;
  }
  upsertRoom({ name, displayName: displayName ?? name, capacity, allowedRoles });
  res.status(201).json(getRoomPolicy(name));
}
 
export function updateRoom(req: Request, res: Response): void {
  const roomName = decodeURIComponent(req.params.roomName as string);
  const existing = getRoomPolicy(roomName);
  if (!existing) { res.status(404).json({ error: 'Room not found' }); return; }
  const updated = { ...existing, ...req.body };
  upsertRoom(updated);
  res.json(updated);
}