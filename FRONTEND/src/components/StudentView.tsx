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

const TYPE_FILTER_OPTIONS: Array<{ value: ReservationType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'SESSION', label: 'Session' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PITCHDECK', label: 'Pitchdeck' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

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
  const [typeFilter, setTypeFilter] = useState<ReservationType | 'ALL'>('ALL');
  const [dark, setDark] = useState(() => localStorage.getItem('reservut_dark') === 'true');

  const toggleDark = () => {
    setDark(prev => {
      const n = !prev;
      localStorage.setItem('reservut_dark', String(n));
      return n;
    });
  };

  // Theme
  const bg = dark ? 'bg-gray-900' : 'bg-white';
  const navBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingText = dark ? 'text-gray-100' : 'text-gray-900';
  const subText = dark ? 'text-gray-400' : 'text-gray-500';
  const btnBorder = dark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50';
  const dropdownBg = dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const dropdownItem = dark ? 'text-gray-200 hover:bg-gray-600 border-gray-600' : 'text-gray-700 hover:bg-gray-50 border-gray-100';

  const watermarkInfo = (() => {
    if (user.role === 'CEO') return { text: 'LEADER', color: 'text-orange-200' };
    if (user.role === 'GUIDE') return { text: 'GUIDE', color: 'text-purple-200' };
    return { text: 'STUDENT', color: 'text-pink-200' };
  })();

  const bookingBtnClass = (() => {
    if (user.role === 'CEO')        return 'bg-orange-500 hover:bg-orange-600';
    if (user.role === 'GUIDE')      return 'bg-purple-600 hover:bg-purple-700';
    if (user.role === 'HEAD_ADMIN') return 'bg-blue-600 hover:bg-blue-700';
    return 'bg-pink-500 hover:bg-pink-600';
  })();


  const rulesContent = (() => {
    if (user.role === 'CEO') return {
      label: 'Leader',
      color: 'text-orange-400',
      text: 'Max 5 days ahead, min 24h before booking. Max 3 simultaneous rooms. Requires Head Admin verification.',
    };
    if (user.role === 'GUIDE') return {
      label: 'Guide',
      color: 'text-purple-500',
      text: 'Sessions must be booked min 2 days ahead. Can override lower roles. Multiple rooms. Requires verification.',
    };
    if (user.role === 'HEAD_ADMIN') return {
      label: 'Head Admin',
      color: 'text-blue-500',
      text: 'No limits. Can override any booking. Priority: Events > Session > Others. Multiple rooms allowed.',
    };
    return {
      label: 'Student',
      color: 'text-pink-500',
      text: 'Max 5 days ahead. Max 2 bookings per week. Max 2h 30min per booking, min 15 min. No simultaneous bookings.',
    };
  })();

  const myReservations = reservations.filter((r) => r.userId === user.id && r.status === 'active');
  const upcomingReservations = myReservations.filter((r) => new Date(r.startTime) >= new Date());
  const cancelledReservations = reservations.filter((r) => r.userId === user.id && r.status !== 'active');

  const filteredReservations = reservations.filter(
    (r) => (!selectedRoom || r.roomName === selectedRoom) && (typeFilter === 'ALL' || r.type === typeFilter)
  );

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
    <div className={`min-h-screen ${bg} flex flex-col`}>

      {/* TOP NAVBAR */}
      <div className={`${navBg} border-b px-5 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-black text-base px-2 py-1 rounded">T</span>
          <span className="bg-purple-600 text-white font-black text-base px-2 py-1 rounded">FP</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button onClick={toggleDark} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`transition-colors ${dark ? 'text-yellow-400' : 'text-gray-500'}`}>
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`transition-colors ${notificationsEnabled ? 'text-gray-700' : 'text-gray-400'}`}
            title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}>
            {notificationsEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
          <div className="text-right">
            <p className={`text-sm font-semibold leading-tight ${headingText}`}>{user.firstName} {user.lastName}</p>
            <p className={`text-xs leading-tight ${subText}`} style={{ WebkitUserSelect: 'none', pointerEvents: 'none' }}>{user.email}</p>
          </div>
          <button onClick={() => setShowProfile(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-400 transition ${dark ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Watermark + RULES */}
          <div className="relative px-5 pt-2 pb-0 flex items-center overflow-hidden">
            <div className="select-none pointer-events-none flex-shrink-0">
              <span className={`block font-black uppercase leading-none ${watermarkInfo.color}`}
                style={{ fontSize: 'clamp(70px, 13vw, 140px)', opacity: 0.35, letterSpacing: '0.02em' }}>
                {watermarkInfo.text}
              </span>
            </div>
            <div className="ml-6 flex-1 max-w-sm">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">RULES</p>
              <p className={`text-base font-black uppercase mb-1 ${rulesContent.color}`}>{rulesContent.label}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{rulesContent.text}</p>
            </div>
          </div>

          {/* ROOM SELECT + TYPE FILTER */}
          <div className="px-5 mt-2 flex items-center gap-3 flex-wrap relative z-10">
            <div className="relative inline-block">
              <button onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                className={`flex items-center gap-2 border rounded-lg px-4 py-2 text-sm font-medium shadow-sm min-w-[180px] justify-between ${btnBorder}`}>
                <span>{selectedRoom || 'SELECT ROOM'}</span>
                <span className={`text-xs ${subText}`}>{roomDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {roomDropdownOpen && (
                <div className={`absolute top-full left-0 mt-2 border rounded-xl shadow-xl z-50 w-full overflow-hidden ${dropdownBg}`} style={{ minWidth: '180px' }}>
                  <button onClick={() => { setSelectedRoom(''); setRoomDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b ${dropdownItem}`}>
                    All rooms
                  </button>
                  {ALL_ROOMS.map((room) => (
                    <button key={room} onClick={() => { setSelectedRoom(room); setRoomDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-0 ${dropdownItem} ${selectedRoom === room ? 'font-semibold' : ''}`}>
                      {room}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type filter */}
            <div className="flex gap-1 flex-wrap">
              {TYPE_FILTER_OPTIONS.map(({ value, label }) => (
                <button key={value} onClick={() => setTypeFilter(value)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${
                    typeFilter === value
                      ? 'bg-purple-600 text-white'
                      : dark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="px-5 pt-3 pb-5 flex-1 flex flex-col">
            <div className={`${cardBg} border rounded-2xl shadow-md flex-1 flex flex-col overflow-hidden`}>
              <div className={`flex items-center justify-between px-5 py-3 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-base font-black uppercase tracking-widest ${headingText}`}>CALENDAR</span>
                <div className="flex items-center gap-3">
                  <WeekNavigator offset={currentWeekOffset} onChange={setCurrentWeekOffset} />
                  <button onClick={() => setShowBooking(true)}
                    className={`flex items-center gap-1.5 ${bookingBtnClass} text-white font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-full shadow transition-colors`}>
                    <span className="text-base leading-none">+</span> NEW BOOKING
                  </button>
                </div>
              </div>
              <div className={`flex-1 overflow-auto rounded-b-2xl ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <CalendarGrid
                  reservations={filteredReservations}
                  weekOffset={currentWeekOffset}
                  onReservationClick={handleCalendarClick}
                  currentUserId={user.id}
                  userRole={user.role}
                  startHour={7}
                  endHour={21}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-64 flex flex-col gap-3 p-4 shrink-0">

          {/* UPCOMING */}
          <div className={`${cardBg} border rounded-2xl shadow-sm px-5 py-4 flex-1`}>
            <p className={`text-sm font-black uppercase tracking-widest text-center mb-3 ${headingText}`}>UPCOMING</p>
            <div className="space-y-2">
              {upcomingReservations.length === 0 && <p className={`text-xs text-center italic ${subText}`}>No upcoming</p>}
              {upcomingReservations.map((r) => (
                <button key={r.id} onClick={() => { setSelectedReservation(r); setShowMyReservation(true); }}
                  className={`w-full flex items-center gap-2 text-left py-1 rounded-lg px-1 transition ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className={`text-xs ${subText}`}>{formatReservationLabel(r)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CANCELLED */}
          <div className={`${cardBg} border rounded-2xl shadow-sm px-5 py-4 flex-1`}>
            <p className={`text-sm font-black uppercase tracking-widest text-center mb-3 ${headingText}`}>CANCELED</p>
            <div className="space-y-2">
              {cancelledReservations.length === 0 && <p className={`text-xs text-center italic ${subText}`}>None</p>}
              {cancelledReservations.map((r) => (
                <div key={r.id} className="flex items-center gap-2 py-1 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className={`text-xs ${subText}`}>{formatReservationLabel(r)}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onLogout}
            className={`${cardBg} border rounded-2xl shadow-sm px-5 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${dark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}>
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
