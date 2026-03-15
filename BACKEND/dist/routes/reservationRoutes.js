import { Router } from 'express';
import { listReservations, createReservation, deleteReservation, getReservation, } from '../controllers/reservationController.js';
const router = Router();
router.get('/', listReservations);
router.post('/', createReservation);
router.get('/:id', getReservation);
router.delete('/:id', deleteReservation);
export default router;
