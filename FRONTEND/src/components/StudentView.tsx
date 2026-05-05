import { useState, useEffect, useMemo } from 'react';
import esbdLogo from '../assets/esbdlogo.png';
import { User, Reservation, Room, ALL_ROOMS, ReservationType } from './types';
import BookingModal from './BookingModal';
import MyReservationModal from './MyReservationModal';
import ReservationModal from './ReservationModal';
import ProfileModal from './ProfileModal';
import CalendarGrid from './CalendarGrid';
import WeekNavigator from './WeekNavigator';

interface StudentViewProps {
  user: User;
  reservations: Reservation[];
  rooms?: Room[];
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
  user, reservations, rooms: roomsProp, onLogout, onCreateReservation, onCancelReservation, onUpdateUser,
}: StudentViewProps) {
  const dynamicRooms = roomsProp && roomsProp.length > 0
    ? roomsProp.filter(r => r.allowedRoles.includes(user.role)).map(r => r.name)
    : undefined;
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [mobileDayOffset, setMobileDayOffset] = useState(0); // days from today
  const [mobileTab, setMobileTab] = useState<'home' | 'calendar' | 'events'>('home');

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const mobileDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + mobileDayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [mobileDayOffset]);

  const mobileDateLabel = mobileDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'numeric',
  });

  const MOBILE_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mobileDateCompact = `${MOBILE_DAY_NAMES[mobileDate.getDay()]} ${mobileDate.getDate()}.${mobileDate.getMonth() + 1}.`;

  const bgFontSize = useMemo(() => {
    const roleText = user.role === 'CEO' ? 'LEADER' : user.role === 'GUIDE' ? 'GUIDE' : 'STUDENT';
    const text = mobileTab === 'events' ? 'EVENTS' : roleText;
    const targetWidth = (typeof window !== 'undefined' ? window.innerWidth : 390) * 0.92;
    return Math.min(Math.floor(targetWidth / (text.length * 0.62)), 160);
  }, [mobileTab, user.role]);

  const roleAccent = {
    STUDENT: { bg: 'bg-pink-500', text: 'text-pink-500', light: 'text-pink-200' },
    CEO: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'text-orange-200' },
    GUIDE: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'text-purple-200' },
    HEAD_ADMIN: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'text-blue-200' },
  }[user.role];

  const toggleDark = () => {
    setDark(prev => {
      const n = !prev;
      localStorage.setItem('reservut_dark', String(n));
      return n;
    });
  };

  // Theme
  const bg = dark ? 'bg-[#141720]' : 'bg-white';
  const navBg = dark ? 'bg-[#1a1f2e] border-[#252d42]' : 'bg-gray-100 border-gray-200';
  const cardBg = dark ? 'bg-[#1a1f2e] border-[#252d42]' : 'bg-white border-gray-200';
  const headingText = dark ? 'text-gray-300' : 'text-gray-900';
  const subText = dark ? 'text-gray-500' : 'text-gray-500';
  const dropdownBg = dark ? 'bg-[#1e2438] border-[#2d3650]' : 'bg-white border-gray-200';
  const dropdownItem = dark ? 'text-gray-400 hover:bg-[#252d45] border-[#2d3650]' : 'text-gray-700 hover:bg-gray-50 border-gray-100';

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

  if (isMobile) {
    return (
      <div className="h-[100dvh] bg-white flex flex-col overflow-hidden font-sans">
        {/* Header — fixed, never scrolls */}
        <div className="flex items-center justify-between px-4 py-2 bg-white flex-shrink-0">
          <img src={esbdLogo} alt="ESBD" className="h-10 object-contain" />
          <div className="flex flex-col items-center">
            <span className="bg-[#9333ea] text-white text-sm px-5 py-2 rounded-2xl shadow-sm tracking-tight">
              reser<span className="font-extrabold">VUT</span>
            </span>
            <span className="text-[#9333ea] text-[9px] font-bold tracking-widest mt-0.5">BY LSSL</span>
          </div>
        </div>

        {/* Large role/section text — fixed below header, never scrolls */}
        <div className="overflow-hidden pl-1 leading-none flex-shrink-0">
          <span
            className={`font-black uppercase block leading-none select-none pointer-events-none ${roleAccent.light}`}
            style={{ fontSize: bgFontSize }}
          >
            {mobileTab === 'events' ? 'EVENTS' : watermarkInfo.text}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* HOME TAB */}
          {mobileTab === 'home' && (
            <div className="px-4 pt-3 pb-24">
              <div className="mb-4">
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5 mb-0.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">UPCOMING</span>
                </div>
                {upcomingReservations.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No upcoming reservations</div>
                ) : upcomingReservations.map((r) => (
                  <button key={r.id} onClick={() => { setSelectedReservation(r); setShowMyReservation(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left">
                    <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{formatReservationLabel(r)}</span>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5 mb-0.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">CANCELLED</span>
                </div>
                {cancelledReservations.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">None</div>
                ) : cancelledReservations.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{formatReservationLabel(r)}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 px-1">Click on plus to make a new reservation</p>
            </div>
          )}

          {/* CALENDAR TAB */}
          {mobileTab === 'calendar' && (
            <div className="px-4 pt-1 pb-24">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">RULES</p>

              {/* Room selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                  className="w-full flex items-center justify-between px-0 py-2.5 border-b border-gray-200 text-left"
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                    {selectedRoom || 'SELECT ROOM'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {roomDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={() => { setSelectedRoom(''); setRoomDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50">
                      All rooms
                    </button>
                    {(dynamicRooms ?? ALL_ROOMS).map((room) => (
                      <button key={room} onClick={() => { setSelectedRoom(room); setRoomDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 ${selectedRoom === room ? 'font-semibold' : ''}`}>
                        {room}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar card — single day, full natural height, page scrolls for time */}
              <div className="bg-gray-100 rounded-3xl">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-black text-sm uppercase tracking-wider text-gray-800">CALENDAR</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setMobileDayOffset((d) => d - 1)} className="p-1.5 text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </button>
                    <span className="text-[11px] font-semibold text-gray-600 px-2">{mobileDateCompact}</span>
                    <button onClick={() => setMobileDayOffset((d) => d + 1)} className="p-1.5 text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                    <button onClick={() => setShowBooking(true)}
                      className={`flex items-center gap-1 ${roleAccent.bg} text-white text-[9px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full ml-1`}>
                      <span className="text-[11px]">+</span> NEW BOOKING
                    </button>
                  </div>
                </div>
                {/* Full natural height — 14h × 64px row = 896px, outer page scroll handles time navigation */}
                <div className="mx-3 mb-3" style={{ height: (21 - 7) * 64, display: 'flex', flexDirection: 'column' }}>
                  <CalendarGrid
                    reservations={filteredReservations}
                    weekOffset={0}
                    dayDates={[mobileDate]}
                    onReservationClick={handleCalendarClick}
                    currentUserId={user.id}
                    userRole={user.role}
                    startHour={7}
                    endHour={21}
                    dark={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {mobileTab === 'events' && (
            <div className="px-4 pt-2 pb-24">
              <div className="bg-gray-100 rounded-3xl overflow-hidden" style={{ minHeight: '350px' }}>
                {reservations.filter((r) => r.type === 'EVENT' || r.type === 'GLOBAL_EVENT').length === 0 ? (
                  <div className="flex items-center justify-center" style={{ height: '350px' }}>
                    <p className="text-sm text-gray-400">No events</p>
                  </div>
                ) : reservations
                    .filter((r) => r.type === 'EVENT' || r.type === 'GLOBAL_EVENT')
                    .map((r) => (
                      <button key={r.id} onClick={() => { setSelectedReservation(r); setShowReservationInfo(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 last:border-0 hover:bg-gray-200 transition-colors text-left">
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${r.status === 'active' ? 'bg-green-500' : 'bg-red-400'}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.roomName}</p>
                          <p className="text-xs text-gray-500">{formatReservationLabel(r)}</p>
                        </div>
                      </button>
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="relative bg-white border-t border-gray-100">
          <div className="flex items-center justify-around px-6 pt-2 pb-4">
            <button onClick={() => setMobileTab('home')}
              className={`p-2 transition-colors ${mobileTab === 'home' ? roleAccent.text : 'text-gray-400'}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill={mobileTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <button onClick={() => setMobileTab('calendar')}
              className={`p-2 transition-colors ${mobileTab === 'calendar' ? roleAccent.text : 'text-gray-400'}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            {/* FAB spacer */}
            <div className="w-14" />
            <button onClick={() => setMobileTab('events')}
              className={`p-2 transition-colors ${mobileTab === 'events' ? roleAccent.text : 'text-gray-400'}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill={mobileTab === 'events' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <button onClick={() => setShowProfile(true)} className="p-2 text-gray-400">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>

          {/* Center FAB */}
          <button onClick={() => setShowBooking(true)}
            className={`absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full ${roleAccent.bg} shadow-xl flex items-center justify-center`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Modals */}
        {showBooking && (
          <BookingModal user={user} rooms={dynamicRooms} onClose={() => setShowBooking(false)}
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
          <ProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={onUpdateUser} onLogout={onLogout} />
        )}
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] overflow-hidden ${bg} flex flex-col`}>

      {/* TOP NAVBAR */}
      <div className={`${navBg} border-b px-4 sm:px-5 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center">
          <img src={esbdLogo} alt="ESBD" className="h-20 object-contain" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggleDark} title={dark ? 'Light mode' : 'Dark mode'}
            className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-yellow-400' : 'text-gray-500'}`}>
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
            className={`p-1.5 rounded-lg transition-colors ${notificationsEnabled ? (dark ? 'text-gray-300' : 'text-gray-600') : 'text-gray-400'}`}
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
          {/* Name: first name only on mobile, full name on sm+ */}
          <div className="text-right hidden xs:block">
            <p className={`text-sm font-semibold leading-tight ${headingText}`}>
              <span className="hidden sm:inline">{user.firstName} {user.lastName}</span>
              <span className="sm:hidden">{user.firstName}</span>
            </p>
            <p className={`text-xs leading-tight hidden sm:block ${subText}`} style={{ WebkitUserSelect: 'none', pointerEvents: 'none' }}>{user.email}</p>
          </div>
          {/* Logout — mobile only, in navbar */}
          <button onClick={onLogout} title="Log out"
            className={`sm:hidden p-1.5 rounded-lg transition-colors ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
          <button onClick={() => setShowProfile(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-400 transition flex-shrink-0 ${dark ? 'bg-[#252d45]' : 'bg-gray-200'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">

          {/* RULES — hidden on mobile */}
          <div className="hidden sm:flex relative px-4 sm:px-5 pt-2 pb-0 items-center overflow-hidden">
            <div className="hidden sm:block select-none pointer-events-none flex-shrink-0">
              <span className={`block font-black uppercase leading-none ${watermarkInfo.color}`}
                style={{ fontSize: 'clamp(70px, 13vw, 140px)', opacity: 0.35, letterSpacing: '0.02em' }}>
                {watermarkInfo.text}
              </span>
            </div>
            <div className="sm:ml-6 flex-1 max-w-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">RULES</p>
              <p className={`text-sm sm:text-base font-black uppercase mb-0.5 ${rulesContent.color}`}>{rulesContent.label}</p>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{rulesContent.text}</p>
            </div>
          </div>

          {/* ROOM SELECT + TYPE FILTER — single compact row */}
          <div className="px-4 sm:px-5 mt-1.5 relative z-30 flex items-center gap-1.5">
            {/* Room chip — outside overflow so dropdown isn't clipped */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap border transition-colors ${
                  selectedRoom
                    ? 'bg-purple-600 text-white border-purple-600'
                    : dark ? 'bg-[#1e2438] text-gray-400 border-[#2d3650] hover:bg-[#252d45]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {selectedRoom || 'All rooms'}
                <span className="text-[8px] opacity-60">{roomDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {roomDropdownOpen && (
                <div className={`absolute top-full left-0 mt-2 border rounded-xl shadow-xl z-50 overflow-hidden ${dropdownBg}`} style={{ minWidth: '200px' }}>
                  <button onClick={() => { setSelectedRoom(''); setRoomDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium border-b ${dropdownItem}`}>
                    All rooms
                  </button>
                  {(dynamicRooms ?? ALL_ROOMS).map((room) => (
                    <button key={room} onClick={() => { setSelectedRoom(room); setRoomDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm border-b last:border-0 ${dropdownItem} ${selectedRoom === room ? 'font-semibold' : ''}`}>
                      {room}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`w-px h-3.5 flex-shrink-0 ${dark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            {/* Type chips — scrollable single row, gradient fade shows there's more */}
            <div className="relative flex-1 min-w-0">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
                {TYPE_FILTER_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setTypeFilter(value)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                      typeFilter === value
                        ? 'bg-purple-600 text-white'
                        : dark ? 'bg-[#1e2438] text-gray-500 hover:bg-[#252d45]' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Fade hint — shows more chips exist off-screen */}
              <div className={`absolute right-0 top-0 bottom-0 w-6 pointer-events-none ${
                dark ? 'bg-gradient-to-l from-[#141720]' : 'bg-gradient-to-l from-white'
              }`} />
            </div>
          </div>

          {/* Calendar — edge-to-edge on mobile, card on desktop */}
          <div className="flex-1 flex flex-col min-h-0 sm:px-5 sm:pt-3 sm:pb-5">
            <div className={`flex-1 flex flex-col overflow-hidden ${dark ? 'bg-[#1a1f2e]' : 'bg-white'} sm:border sm:rounded-2xl sm:shadow-md ${dark ? 'sm:border-[#252d42]' : 'sm:border-gray-200'}`}>
              {/* Calendar header */}
              <div className={`px-4 sm:px-5 py-3 border-b ${dark ? 'border-[#252d42]' : 'border-gray-100'}`}>
                {isMobile ? (
                  <div className="flex items-center gap-1">
                    {/* Prev arrow */}
                    <button
                      onClick={() => setMobileDayOffset(d => d - 1)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl font-bold flex-shrink-0 transition-colors ${dark ? 'text-gray-400 hover:bg-[#252d45]' : 'text-gray-500 hover:bg-gray-100'}`}
                    >‹</button>
                    {/* Centered date label */}
                    <div className="flex-1 text-center">
                      <p className={`text-[15px] font-bold capitalize leading-tight ${headingText}`}>{mobileDateLabel}</p>
                      {mobileDayOffset !== 0 && (
                        <button
                          onClick={() => setMobileDayOffset(0)}
                          className="text-[11px] text-purple-500 hover:text-purple-400 font-semibold leading-none"
                        >Today</button>
                      )}
                    </div>
                    {/* Next arrow */}
                    <button
                      onClick={() => setMobileDayOffset(d => d + 1)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl font-bold flex-shrink-0 transition-colors ${dark ? 'text-gray-400 hover:bg-[#252d45]' : 'text-gray-500 hover:bg-gray-100'}`}
                    >›</button>
                    {/* Booking button */}
                    <button
                      onClick={() => setShowBooking(true)}
                      className={`flex items-center gap-1 ${bookingBtnClass} text-white font-bold text-xs uppercase tracking-wide px-3 py-2 rounded-full shadow transition-colors flex-shrink-0 ml-1`}
                    >
                      <span className="text-sm leading-none">+</span> BOOKING
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-base font-black uppercase tracking-widest ${headingText}`}>CALENDAR</span>
                    <div className="flex items-center gap-3">
                      <WeekNavigator offset={currentWeekOffset} onChange={setCurrentWeekOffset} />
                      <button
                        onClick={() => setShowBooking(true)}
                        className={`flex items-center gap-1.5 ${bookingBtnClass} text-white font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-full shadow transition-colors`}
                      >
                        <span className="text-base leading-none">+</span> NEW BOOKING
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <CalendarGrid
                  reservations={filteredReservations}
                  weekOffset={isMobile ? 0 : currentWeekOffset}
                  dayDates={isMobile ? [mobileDate] : undefined}
                  onReservationClick={handleCalendarClick}
                  currentUserId={user.id}
                  userRole={user.role}
                  startHour={7}
                  endHour={21}
                  dark={dark}
                />
              </div>
            </div>
          </div>

          {/* MOBILE BOTTOM BAR — hidden on mobile (logout in navbar) and on lg+ (logout in sidebar) */}
          <div className={`hidden sm:flex lg:hidden px-4 pb-3 items-center gap-2`}>
            <div className={`${cardBg} border rounded-xl px-3 py-2 flex-1 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${upcomingReservations.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={`text-xs ${subText}`}>
                {upcomingReservations.length > 0
                  ? `${upcomingReservations.length} upcoming`
                  : 'No upcoming reservations'}
              </span>
            </div>
            <button onClick={onLogout}
              className={`${cardBg} border rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 transition ${dark ? 'text-gray-400 hover:bg-[#1e2438]' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              LOG OUT
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR — desktop only */}
        <div className="hidden lg:flex w-64 flex-col gap-3 p-4 shrink-0">
          <div className={`${cardBg} border rounded-2xl shadow-sm px-5 py-4 flex-1`}>
            <p className={`text-sm font-black uppercase tracking-widest text-center mb-3 ${headingText}`}>UPCOMING</p>
            <div className="space-y-2">
              {upcomingReservations.length === 0 && <p className={`text-xs text-center italic ${subText}`}>No upcoming</p>}
              {upcomingReservations.map((r) => (
                <button key={r.id} onClick={() => { setSelectedReservation(r); setShowMyReservation(true); }}
                  className={`w-full flex items-center gap-2 text-left py-1 rounded-lg px-1 transition ${dark ? 'hover:bg-[#1e2438]' : 'hover:bg-gray-50'}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className={`text-xs ${subText}`}>{formatReservationLabel(r)}</span>
                </button>
              ))}
            </div>
          </div>

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
            className={`${cardBg} border rounded-2xl shadow-sm px-5 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${dark ? 'text-gray-400 hover:bg-[#1e2438]' : 'text-gray-600 hover:bg-gray-50'}`}>
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
        <BookingModal user={user} rooms={dynamicRooms} onClose={() => setShowBooking(false)}
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
