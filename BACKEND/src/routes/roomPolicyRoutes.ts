import { Router } from 'express';
import { listRooms, createRoom, updateRoom, deleteRoomHandler } from '../controllers/roomPolicyController.js';

const router = Router();

router.get('/', listRooms);
router.post('/', createRoom);
router.patch('/:roomName', updateRoom);
router.delete('/:roomName', deleteRoomHandler);

export default router;
