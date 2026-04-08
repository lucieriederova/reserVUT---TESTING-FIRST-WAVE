import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { syncLogin, getReservations, createReservation, cancelReservation, getAllUsers, updateUserRole, verifyUser } from './lib/api';
import { MOCK_RESERVATIONS, MOCK_USERS } from './lib/mockData';
import { User, Reservation, UserRole, ReservationType, PRIORITY_MAP } from './components/types';
import LoginView from './components/LoginView';
import SignUpView from './components/SignUpView';
import StudentView from './components/StudentView';
import HeadAdminView from './components/HeadAdminView';

const USER_STORAGE_KEY = 'inprofo_user';
type AppScreen = 'login' | 'signup' | 'app';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const cancelledIds = useRef<Set<string>>(new Set());

  const getMockUser = (email: string, role: UserRole, firstName?: string, lastName?: string): User => {
    const match = MOCK_USERS.find((user) => user.email === email && user.role === role);
    if (match) {
      return {
        ...match,
        firstName: firstName ?? match.firstName,
        lastName: lastName ?? match.lastName,
      };
    }
    const fallbackName = email.split('@')[0].replace(/[.-]/g, ' ');
    return {
      id: `mock-${role.toLowerCase()}-${email}`,
      email,
      firstName: firstName || fallbackName,
      lastName: lastName || '',
      role,
      isVerified: ['STUDENT', 'HEAD_ADMIN'].includes(role),
      avatarIndex: 0,
    };
  };

  const syncMockUsersList = (role: UserRole) => {
    if (role === 'HEAD_ADMIN') {
      setAllUsers(MOCK_USERS);
    } else {
      setAllUsers([]);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setCurrentUser(user);
        setScreen('app');
        fetchReservations(cancelledIds.current);
        if (user.role === 'HEAD_ADMIN') fetchAllUsers();
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const fetchReservations = async (cancelledIds?: Set<string>) => {
    if (USE_MOCK_API) {
      setReservations(MOCK_RESERVATIONS);
      return;
    }
    try {
      const data = await getReservations();
      const list = Array.isArray(data) ? data : data.reservations ?? [];
      setReservations(
        list.map((r: Reservation) => {
          const normalized = {
            ...r,
            status: (r.status as string).toLowerCase() as Reservation['status'],
          };
          // Keep local cancelled state — don't let server overwrite it
          if (cancelledIds?.has(r.id)) {
            normalized.status = 'cancelled';
          }
          return normalized;
        })
      );
    } catch {
      /* backend offline */
    }
  };

  const fetchAllUsers = async () => {
    if (USE_MOCK_API) {
      setAllUsers(MOCK_USERS);
      return;
    }
    try {
      const data = await getAllUsers();
      setAllUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch { /* ignore */ }
  };

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    setLoginError('');
    if (USE_MOCK_API) {
      const mockUser = getMockUser(email, role);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      setScreen('app');
      setReservations(MOCK_RESERVATIONS);
      syncMockUsersList(role);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setLoginError(error?.message ?? 'Login failed'); return; }

    let backendUser: User;
    try {
      const res = await syncLogin(
        { id: data.user.id, email: data.user.email! },
        role,
        {
          firstName: data.user.user_metadata?.first_name,
          lastName: data.user.user_metadata?.last_name,
        }
      );
      backendUser = {
        id: res.user?.id ?? data.user.id,
        email: data.user.email!,
        firstName: res.user?.firstName ?? data.user.user_metadata?.first_name ?? '',
        lastName: res.user?.lastName ?? data.user.user_metadata?.last_name ?? '',
        role: res.user?.role ?? role,
        isVerified: res.user?.isVerified ?? ['STUDENT', 'HEAD_ADMIN'].includes(role),
        avatarIndex: 0,
        vutId: res.user?.vutId,
      };
    } catch {
      backendUser = {
        id: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata?.first_name ?? '',
        lastName: data.user.user_metadata?.last_name ?? '',
        role,
        isVerified: ['STUDENT', 'HEAD_ADMIN'].includes(role),
        avatarIndex: 0,
      };
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(backendUser));
    setCurrentUser(backendUser);
    setScreen('app');
    fetchReservations();
    if (role === 'HEAD_ADMIN') fetchAllUsers();
  };

  const handleSignUp = async (formData: { firstName: string; lastName: string; email: string; password: string }) => {
    if (USE_MOCK_API) {
      setScreen('login');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { first_name: formData.firstName, last_name: formData.lastName } },
    });
    if (error || !data.user) throw new Error(error?.message ?? 'Sign up failed');
    try {
      await syncLogin({ id: data.user.id, email: formData.email }, 'STUDENT', {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    } catch { /* ignore */ }
    setScreen('login');
  };

  const handleLogout = async () => {
    if (!USE_MOCK_API) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
    setReservations([]);
    setAllUsers([]);
    setScreen('login');
  };

    const handleCreateReservation = async (data: {
      roomName: string;
      startTime: string;
      endTime: string;
      description: string;
      type?: ReservationType;
    }) => {
    if (!currentUser) return;
    if (USE_MOCK_API) {
      const newReservation: Reservation = {
        id: `mock-${Date.now()}`,
        roomName: data.roomName,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        type: data.type ?? 'MEETING',
        userId: currentUser.id,
        userName: `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim(),
        priorityLevel: PRIORITY_MAP[currentUser.role],
        status: 'active',
      };
      setReservations((prev) => [...prev, newReservation]);
      return;
    }
    // Let errors propagate up to BookingModal so it can display them
    const newRes = await createReservation({
      ...data,
      userId: currentUser.id,
      priorityLevel: PRIORITY_MAP[currentUser.role],
    });
    const created = newRes.reservation ?? newRes;
    setReservations((prev) => [
      ...prev,
      { ...created, status: 'active' as const },
    ]);
    if (newRes.preempted?.length) {
      setReservations((prev) =>
        prev.map((r) =>
          newRes.preempted.some((p: Reservation) => p.id === r.id)
            ? { ...r, status: 'preempted' as const }
            : r
        )
      );
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!currentUser) return;
    if (USE_MOCK_API) {
      cancelledIds.current.add(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r))
      );
      return;
    }
    try {
      await cancelReservation(id, currentUser.id, currentUser.role);
    } catch { /* ignore */ }
    cancelledIds.current.add(id);
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r))
    );
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleChangeUserRole = async (userId: string, newRole: UserRole) => {
    if (!USE_MOCK_API) {
      await updateUserRole(userId, newRole);
    }
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handleVerifyUser = async (userId: string) => {
    if (!USE_MOCK_API) {
      await verifyUser(userId);
    }
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isVerified: true } : u)));
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>;
  }

  if (screen === 'signup') {
    return <SignUpView onSignUp={handleSignUp} onBackToLogin={() => setScreen('login')} />;
  }

  if (screen === 'login' || !currentUser) {
    return <LoginView onLogin={handleLogin} onShowSignUp={() => setScreen('signup')} error={loginError} />;
  }

  if (currentUser.role === 'HEAD_ADMIN') {
    return (
      <HeadAdminView
        user={currentUser}
        reservations={reservations}
        rooms={[]}
        allUsers={allUsers}
        onLogout={handleLogout}
        onCreateReservation={handleCreateReservation}
        onCancelReservation={handleCancelReservation}
        onUpdateUser={handleUpdateUser}
        onChangeUserRole={handleChangeUserRole}
        onVerifyUser={handleVerifyUser}
        onAddRoom={async () => {}}
      />
    );
  }

  return (
    <StudentView
      user={currentUser}
      reservations={reservations}
      onLogout={handleLogout}
      onCreateReservation={handleCreateReservation}
      onCancelReservation={handleCancelReservation}
      onUpdateUser={handleUpdateUser}
    />
  );
}
