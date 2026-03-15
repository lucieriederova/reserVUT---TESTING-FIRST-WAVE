import { Router } from 'express';
import { loginUser, getUsers, updateUserRole } from '../controllers/authController.js';
const router = Router();
// Sync Supabase user into app DB + set role
router.post('/login', loginUser);
// Get all users (HEAD_ADMIN)
router.get('/users', getUsers);
// Update a user's role (HEAD_ADMIN)
router.patch('/users/:id/role', updateUserRole);
export default router;
