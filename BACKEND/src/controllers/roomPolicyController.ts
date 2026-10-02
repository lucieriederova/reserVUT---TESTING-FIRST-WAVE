import type { Request, Response } from 'express';
import { getAllRooms, getRoomsForRole, upsertRoom, getRoomPolicy, deleteRoom } from '../services/roomPolicyStore.js';

type Role = 'STUDENT' | 'CEO' | 'GUIDE' | 'HEAD_ADMIN';

/** GET /api/rooms — optionally filtered by `?role=` to only the rooms that role can book. */
export function listRooms(req: Request, res: Response): void {
  const role = req.query.role as Role | undefined;
  const rooms = role ? getRoomsForRole(role) : getAllRooms();
  res.json(rooms);
}
 
/** POST /api/rooms — creates or replaces a room policy (Head Admin only, enforced on the frontend). */
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
 
/** PATCH /api/rooms/:roomName — partially updates a room's fields (e.g. `allowedRoles`). */
export function updateRoom(req: Request, res: Response): void {
  const roomName = decodeURIComponent(req.params.roomName as string);
  const existing = getRoomPolicy(roomName);
  if (!existing) { res.status(404).json({ error: 'Room not found' }); return; }
  const updated = { ...existing, ...req.body };
  upsertRoom(updated);
  res.json(updated);
}

/** DELETE /api/rooms/:roomName — removes a room from the policy registry. */
export function deleteRoomHandler(req: Request, res: Response): void {
  const roomName = decodeURIComponent(req.params.roomName as string);
  const deleted = deleteRoom(roomName);
  if (!deleted) { res.status(404).json({ error: 'Room not found' }); return; }
  res.json({ success: true });
}