import { useState } from 'react';
import { User, Reservation, ALL_ROOMS, ReservationType } from './types';
import BookingModal from './BookingModal';
import MyReservationModal from './MyReservationModal';
import ReservationModal from './ReservationModal';
import ProfileModal from './ProfileModal';
import CalendarGrid from './CalendarGrid';
import WeekNavigator from './WeekNavigator';

interface StudentViewProps {
  user: User;
  reservations: Reservation[];
  onLogout: () => void;
  onCreateReservation: (data: {
    roomName: string;
    startTime: string;
    endTime: string;
    description: string;
    type?: ReservationType;
  }) => Promise<void>;
  onCancelReservation: (id: string) => Promise<void>;
  onUpdateUser: (updates: Partial<User>) => void;
}

export default function StudentView({
  user, reservations, onLogout, onCreateReservation, onCancelReservation, onUpdateUser,
}: StudentViewProps) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showMyReservation, setShowMyReservation] = useState(false);
  const [showReservationInfo, setShowReservationInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const watermarkInfo = (() => {
    if (user.role === 'CEO') return { text: 'LEADER', color: 'text-orange-200' };
    if (user.role === 'GUIDE') return { text: 'GUIDE', color: 'text-purple-200' };
    return { text: 'STUDENT', color: 'text-pink-200' };
  })();

  const bookingGradient = (() => {
    if (user.role === 'CEO') return 'from-orange-400 to-yellow-300';
    if (user.role === 'GUIDE') return 'from-purple-600 to-purple-400';
    return 'from-pink-500 to-pink-300';
  })();

  const myReservations = reservations.filter((r) => r.userId === user.id && r.status === 'active');
  const upcomingReservations = myReservations.filter((r) => new Date(r.startTime) >= new Date());
  const cancelledReservations = reservations.filter((r) => r.userId === user.id && r.status !== 'active');

  const handleCalendarClick = (reservation: Reservation) => {
    if (reservation.userId === user.id) {
      setSelectedReservation(reservation);
      setShowMyReservation(true);
    } else {
      setSelectedReservation(reservation);
      setShowReservationInfo(true);
    }
  };

  const formatReservationLabel = (r: Reservation) => {
    const start = new Date(r.startTime);
    return `${start.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${r.roomName}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* TOP NAVBAR */}
      <div className="bg-gray-100 border-b border-gray-200 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-black text-base px-2 py-1 rounded">T</span>
          <span className="bg-purple-600 text-white font-black text-base px-2 py-1 rounded">FP</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`transition-colors ${notificationsEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
          </div>
          <button onClick={() => setShowProfile(true)}
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-400 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative px-5 pt-2 pb-0 overflow-hidden select-none pointer-events-none">
            <span className={`block font-black uppercase leading-none ${watermarkInfo.color}`}
              style={{ fontSize: 'clamp(90px, 17vw, 180px)', opacity: 0.35, letterSpacing: '0.02em' }}>
              {watermarkInfo.text}
            </span>
          </div>

          <div className="px-5 -mt-4 relative z-10">
            <div className="relative inline-block">
              <button onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 min-w-[180px] justify-between">
                <span>{selectedRoom || 'SELECT ROOM'}</span>
                <span className="text-gray-400 text-xs">{roomDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {roomDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 w-full overflow-hidden">
                  {ALL_ROOMS.map((room) => (
                    <button key={room} onClick={() => { setSelectedRoom(room); setRoomDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      {room}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pt-3 pb-5 flex-1 flex flex-col">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-base font-black uppercase tracking-widest text-gray-900">CALENDAR</span>
                <div className="flex items-center gap-3">
                  <WeekNavigator offset={currentWeekOffset} onChange={setCurrentWeekOffset} />
                  <button onClick={() => setShowBooking(true)}
                    className={`flex items-center gap-1.5 bg-gradient-to-r ${bookingGradient} text-white font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-full shadow transition-colors`}>
                    <span className="text-base leading-none">+</span> NEW BOOKING
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100 rounded-b-2xl">
                <CalendarGrid
                  reservations={reservations.filter((r) => !selectedRoom || r.roomName === selectedRoom)}
                  weekOffset={currentWeekOffset}
                  onReservationClick={handleCalendarClick}
                  currentUserId={user.id}
                  startHour={7}
                  endHour={21}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-64 flex flex-col gap-3 p-4 shrink-0">

          {/* RULES */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-sm font-black uppercase tracking-widest text-gray-900 text-center mb-3">RULES</p>
            {user.role === 'STUDENT' && (
              <div>
                <p className="text-[10px] font-black uppercase text-pink-500 mb-0.5">Student</p>
                <p className="text-[9px] text-gray-500 leading-tight">Max 5 days ahead, 2 bookings/week, max 2h/booking, min 15min. No simultaneous bookings.</p>
              </div>
            )}
            {user.role === 'CEO' && (
              <div>
                <p className="text-[10px] font-black uppercase text-orange-400 mb-0.5">Leader</p>
                <p className="text-[9px] text-gray-500 leading-tight">Max 5 days ahead, min 24h before. Multiple rooms allowed. Requires verification.</p>
              </div>
            )}
            {user.role === 'GUIDE' && (
              <div>
                <p className="text-[10px] font-black uppercase text-purple-500 mb-0.5">Guide</p>
                <p className="text-[9px] text-gray-500 leading-tight">Sessions min 2 days ahead. Can override lower roles. Multiple rooms. Requires verification.</p>
              </div>
            )}
            {user.role === 'HEAD_ADMIN' && (
              <div>
                <p className="text-[10px] font-black uppercase text-blue-500 mb-0.5">Head Admin</p>
                <p className="text-[9px] text-gray-500 leading-tight">No limits. Can override any booking. Events &gt; Session &gt; Others.</p>
              </div>
            )}
          </div>

          {/* UPCOMING */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex-1">
            <p className="text-sm font-black uppercase tracking-widest text-gray-900 text-center mb-3">UPCOMING</p>
            <div className="space-y-2">
              {upcomingReservations.length === 0 && <p className="text-xs text-gray-400 text-center italic">No upcoming</p>}
              {upcomingReservations.map((r) => (
                <button key={r.id} onClick={() => { setSelectedReservation(r); setShowMyReservation(true); }}
                  className="w-full flex items-center gap-2 text-left py-1 hover:bg-gray-50 rounded-lg px-1 transition">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700">{formatReservationLabel(r)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CANCELLED */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex-1">
            <p className="text-sm font-black uppercase tracking-widest text-gray-900 text-center mb-3">CANCLED</p>
            <div className="space-y-2">
              {cancelledReservations.length === 0 && <p className="text-xs text-gray-400 text-center italic">None</p>}
              {cancelledReservations.map((r) => (
                <div key={r.id} className="flex items-center gap-2 py-1 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700">{formatReservationLabel(r)}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onLogout}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            LOG OUT
          </button>
        </div>
      </div>

      {showBooking && (
        <BookingModal user={user} onClose={() => setShowBooking(false)}
          onConfirm={async (data) => { await onCreateReservation(data); setShowBooking(false); }} />
      )}
      {showMyReservation && selectedReservation && (
        <MyReservationModal reservation={selectedReservation}
          onClose={() => { setShowMyReservation(false); setSelectedReservation(null); }}
          onCancel={async () => { await onCancelReservation(selectedReservation.id); setShowMyReservation(false); setSelectedReservation(null); }} />
      )}
      {showReservationInfo && selectedReservation && (
        <ReservationModal reservation={selectedReservation}
          onClose={() => { setShowReservationInfo(false); setSelectedReservation(null); }} />
      )}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={onUpdateUser} />
      )}
    </div>
  );
}
