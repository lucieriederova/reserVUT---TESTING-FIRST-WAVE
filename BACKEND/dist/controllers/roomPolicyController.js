import { getAllRooms, addRoom, updateRoomPolicy, getRoomPolicy } from '../services/roomPolicyStore.js';
import { toSingleParam } from '../utils/params.js';
// GET /api/rooms
export function listRooms(_req, res) {
    res.json(getAllRooms());
}
// POST /api/rooms  (HEAD_ADMIN only)
export function createRoom(req, res) {
    const { roomName, capacity, allowedRoles } = req.body;
    if (!roomName || !capacity || !allowedRoles?.length) {
        res.status(400).json({ error: 'roomName, capacity and allowedRoles are required' });
        return;
    }
    addRoom({ roomName, capacity, allowedRoles });
    res.status(201).json(getRoomPolicy(roomName));
}
// PATCH /api/rooms/:roomName  (HEAD_ADMIN only)
export function updateRoom(req, res) {
    const roomNameParam = toSingleParam(req.params.roomName);
    if (!roomNameParam) {
        res.status(400).json({ error: 'Room name is required' });
        return;
    }
    const updates = req.body;
    const updated = updateRoomPolicy(decodeURIComponent(roomNameParam), updates);
    if (!updated) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }
    res.json(updated);
}
