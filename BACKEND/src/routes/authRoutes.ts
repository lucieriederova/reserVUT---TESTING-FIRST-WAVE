import { Router } from 'express';
import { loginUser, getUsers, updateUserRole, verifyUser } from '../controllers/authController.js';

const router = Router();

router.post('/login', loginUser);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/verify', verifyUser);

export default router;
