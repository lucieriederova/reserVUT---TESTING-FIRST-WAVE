import axios from 'axios';
import { UserRole, ReservationType } from '../components/types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_URL });

export async function syncLogin(
  supabaseUser: { id: string; email: string },
  role: UserRole,
  meta?: { firstName?: string; lastName?: string }
) {
  const res = await api.post('/auth/login', {
    supabaseUserId: supabaseUser.id,
    email: supabaseUser.email,
    role,
    firstName: meta?.firstName,
    lastName: meta?.lastName,
  });
  return res.data;
}

export async function getReservations(roomName?: string) {
  const res = await api.get('/reservations', { params: roomName ? { roomName } : {} });
  return res.data;
}

export async function createReservation(data: {
  roomName: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: ReservationType;
  userId: string;
  priorityLevel: number;
}) {
  const res = await api.post('/reservations', data);
  return res.data;
}

export async function cancelReservation(id: string, userId: string, userRole: UserRole) {
  const res = await api.delete(`/reservations/${id}`, { data: { userId, userRole } });
  return res.data;
}

export async function getAllUsers() {
  const res = await api.get('/auth/users');
  return res.data;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const res = await api.patch(`/auth/users/${userId}/role`, { role });
  return res.data;
}

export async function verifyUser(userId: string) {
  const res = await api.patch(`/auth/users/${userId}/verify`, {});
  return res.data;
}

export async function getRooms(role?: UserRole) {
  const res = await api.get('/rooms', { params: role ? { role } : {} });
  return res.data;
}
