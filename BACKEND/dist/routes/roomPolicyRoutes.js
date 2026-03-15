import { Router } from 'express';
import { listRooms, createRoom, updateRoom } from '../controllers/roomPolicyController.js';
const router = Router();
router.get('/', listRooms);
router.post('/', createRoom);
router.patch('/:roomName', updateRoom);
export default router;
