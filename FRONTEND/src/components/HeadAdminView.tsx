import React, { useState } from 'react';
import { User, Reservation, Room, UserRole, ReservationType } from './types';
import BookingModal from './BookingModal';
import ProfileModal from './ProfileModal';
import CalendarGrid from './CalendarGrid';
import WeekNavigator from './WeekNavigator';
import { AVATARS } from './AvatarPickerModal';
import { updateRoom } from '../lib/api';

type AdminSection = 'CALENDAR' | 'REPORTS' | 'ROLES' | 'DATABASE' | 'ROOMS';

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  vutId?: string;
}

interface HeadAdminViewProps {
  user: User;
  reservations: Reservation[];
  rooms: Room[];
  allUsers: AdminUser[];
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
  onChangeUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  onVerifyUser?: (userId: string) => Promise<void>;
  onAddRoom: (room: Omit<Room, 'id'>) => Promise<void>;
}

const ROOM_LIST = ['Session Room', 'Meeting Room', 'The Stage', 'Panda Room', 'P159', 'Event'];

const TYPE_FILTER_OPTIONS: Array<{ value: ReservationType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'SESSION', label: 'Session' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PITCHDECK', label: 'Pitchdeck' },
  { value: 'EVENT', label: 'Event' },
  { value: 'GLOBAL_EVENT', label: 'Global Event' },
  { value: 'OTHER', label: 'Other' },
];

const NAV_ICONS: Record<AdminSection, React.ReactElement> = {
  CALENDAR: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  REPORTS: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  ROLES: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  DATABASE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  ROOMS: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

const navItems: { key: AdminSection; label: string }[] = [
  { key: 'CALENDAR', label: 'CALENDAR' },
  { key: 'REPORTS', label: 'REPORTS' },
  { key: 'ROLES', label: 'ROLES' },
  { key: 'DATABASE', label: 'DATABASE' },
  { key: 'ROOMS', label: 'ROOMS' },
];

export default function HeadAdminView({
  user, reservations, rooms, allUsers, onLogout, onCreateReservation,
  onCancelReservation, onUpdateUser, onChangeUserRole, onVerifyUser, onAddRoom,
}: HeadAdminViewProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('CALENDAR');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [rolesTab, setRolesTab] = useState<'GUIDES' | 'LEADERS'>('GUIDES');
  const [manageUser, setManageUser] = useState<AdminUser | null>(null);
  const [manageNewRole, setManageNewRole] = useState<UserRole>('STUDENT');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(10);
  const [newRoomRoles, setNewRoomRoles] = useState<UserRole[]>(['STUDENT', 'GUIDE', 'CEO']);
  const [selectedRoomInfo, setSelectedRoomInfo] = useState<Room | null>(null);
  const [editedRoles, setEditedRoles] = useState<UserRole[]>([]);
  const [savingRoom, setSavingRoom] = useState(false);
  const [dbSearch, setDbSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReservationType | 'ALL'>('ALL');
  const [dark, setDark] = useState(() => localStorage.getItem('reservut_dark') === 'true');

  const toggleDark = () => {
    setDark(prev => {
      const n = !prev;
      localStorage.setItem('reservut_dark', String(n));
      return n;
    });
  };

  // Theme helpers
  const navBg = dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-900 border-gray-700';
  const sidebarBg = dark ? 'bg-gray-800' : 'bg-gray-100 border-r border-gray-200';
  const sidebarText = dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700';
  const sidebarActive = dark ? 'text-white bg-gray-700' : 'text-gray-800 bg-gray-200';
  const contentBg = dark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingText = dark ? 'text-gray-100' : 'text-gray-800';
  const subText = dark ? 'text-gray-400' : 'text-gray-500';
  const tableHead = dark ? 'text-gray-500' : 'text-gray-400';
  const tableRow = dark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50';
  const inputClass = dark
    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-700 focus:ring-purple-300';

  const avatarIndex = user.avatarIndex ?? 0;
  const guides = allUsers.filter((u) => u.role === 'GUIDE');
  const leaders = allUsers.filter((u) => u.role === 'CEO');
  const filteredUsers = allUsers.filter(
    (u) => dbSearch === '' ||
      u.email.toLowerCase().includes(dbSearch.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(dbSearch.toLowerCase())
  );

  const filteredReservations = reservations.filter(
    (r) => (!selectedRoom || r.roomName === selectedRoom) && (typeFilter === 'ALL' || r.type === typeFilter)
  );

  const handleOpenRoomInfo = (room: Room) => {
    setSelectedRoomInfo(room);
    setEditedRoles([...room.allowedRoles]);
  };

  const handleSaveRoomRoles = async () => {
    if (!selectedRoomInfo) return;
    setSavingRoom(true);
    try {
      await updateRoom(selectedRoomInfo.name, { allowedRoles: editedRoles });
      setSelectedRoomInfo({ ...selectedRoomInfo, allowedRoles: editedRoles });
    } catch { /* ignore */ } finally {
      setSavingRoom(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-gray-900' : 'bg-gray-900'}`}>
      {/* NAVBAR */}
      <div className={`${navBg} border-b px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-bold text-sm px-1.5 py-0.5 rounded">T</span>
          <span className="bg-gray-600 text-gray-200 font-bold text-sm px-1.5 py-0.5 rounded">FP</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button onClick={toggleDark} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`transition-colors ${dark ? 'text-yellow-400' : 'text-gray-400'}`}>
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
            className={`transition-colors ${notificationsEnabled ? 'text-purple-400' : 'text-gray-600'}`}
            title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}>
            {notificationsEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
          <button onClick={() => setShowProfile(true)} className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-lg">
            {AVATARS[avatarIndex]}
          </button>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-200">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className={`${sidebarBg} flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-12' : 'w-52'}`}>
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-700">
              <span className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">reserVUT</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">HEAD ADMIN HOME</p>
            </div>
          )}
          <nav className="flex-1 py-2">
            {navItems.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-colors ${activeSection === key ? sidebarActive : sidebarText}`}>
                <span className={activeSection === key ? (dark ? 'text-white' : 'text-gray-700') : 'text-gray-500'}>{NAV_ICONS[key]}</span>
                {!sidebarCollapsed && <span className="uppercase tracking-wider">{label}</span>}
              </button>
            ))}
          </nav>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="m-2 text-gray-500 hover:text-gray-300 bg-gray-700 rounded-full w-7 h-7 flex items-center justify-center self-end transition-colors">
            {sidebarCollapsed ? '›' : '‹'}
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-200 border-t border-gray-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>LOG OUT</span>}
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className={`flex-1 ${contentBg} overflow-auto`}>

          {/* ── CALENDAR ── */}
          {activeSection === 'CALENDAR' && (
            <div className="flex flex-col h-full">
              <div className={`${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-2 flex items-center gap-3 flex-wrap`}>
                {/* Room selector */}
                <div className="relative">
                  <button onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                    className={`flex items-center gap-2 border rounded px-3 py-1.5 text-sm min-w-[160px] justify-between ${dark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    <span>{selectedRoom || 'SELECT ROOM'}</span>
                    <span className={dark ? 'text-gray-400' : 'text-gray-400'}>▼</span>
                  </button>
                  {roomDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-1 border rounded shadow-lg z-20 w-full ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <button onClick={() => { setSelectedRoom(''); setRoomDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm border-b ${dark ? 'text-gray-300 hover:bg-gray-600 border-gray-600' : 'text-gray-500 hover:bg-gray-50 border-gray-100'}`}>All rooms</button>
                      {ROOM_LIST.map((r) => (
                        <button key={r} onClick={() => { setSelectedRoom(r); setRoomDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm border-b last:border-0 ${dark ? 'text-gray-200 hover:bg-gray-600 border-gray-600' : 'hover:bg-gray-50 border-gray-100'}`}>{r}</button>
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

                <WeekNavigator offset={weekOffset} onChange={setWeekOffset} />
                <button onClick={() => setShowBooking(true)}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors ml-auto">
                  + NEW BOOKING
                </button>
              </div>
              <div className="p-4 flex-1">
                <div className={`${cardBg} border rounded-xl h-full overflow-hidden`}>
                  <div className={`border-b px-4 py-2 ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${subText}`}>CALENDAR</span>
                  </div>
                  <CalendarGrid
                    reservations={filteredReservations}
                    weekOffset={weekOffset} onReservationClick={() => {}} currentUserId={user.id} />
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeSection === 'REPORTS' && (
            <div className="p-6">
              <h2 className={`text-lg font-bold mb-4 ${headingText}`}>Reports</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Reservations', value: reservations.length },
                  { label: 'Active', value: reservations.filter((r) => r.status === 'active').length },
                  { label: 'Cancelled', value: reservations.filter((r) => r.status !== 'active').length },
                ].map(({ label, value }) => (
                  <div key={label} className={`${cardBg} border rounded-xl p-4`}>
                    <p className={`text-xs uppercase tracking-wider ${subText}`}>{label}</p>
                    <p className={`text-3xl font-black mt-1 ${headingText}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-6 ${cardBg} border rounded-xl overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`text-sm font-bold ${headingText}`}>All Reservations</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-wider ${dark ? 'border-gray-700' : 'border-gray-100'} ${tableHead}`}>
                      <th className="text-left px-4 py-2">Room</th><th className="text-left px-4 py-2">User</th>
                      <th className="text-left px-4 py-2">Start</th><th className="text-left px-4 py-2">End</th>
                      <th className="text-left px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <tr key={r.id} className={`border-b ${tableRow}`}>
                        <td className={`px-4 py-2 ${headingText}`}>{r.roomName}</td>
                        <td className={`px-4 py-2 ${subText}`}>{r.userName ?? r.userId}</td>
                        <td className={`px-4 py-2 ${subText}`}>{new Date(r.startTime).toLocaleString('cs-CZ')}</td>
                        <td className={`px-4 py-2 ${subText}`}>{new Date(r.endTime).toLocaleString('cs-CZ')}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ROLES ── */}
          {activeSection === 'ROLES' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex gap-1 rounded-lg p-1 ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <button onClick={() => setRolesTab('GUIDES')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${rolesTab === 'GUIDES' ? (dark ? 'bg-gray-600 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm') : subText}`}>GUIDES</button>
                  <button onClick={() => setRolesTab('LEADERS')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${rolesTab === 'LEADERS' ? (dark ? 'bg-gray-600 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm') : subText}`}>LEADERS</button>
                </div>
              </div>
              <div className={`${cardBg} border rounded-xl overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-wider ${dark ? 'border-gray-700' : 'border-gray-100'} ${tableHead}`}>
                      <th className="text-left px-4 py-3">USER DETAILS</th><th className="text-left px-4 py-3">VUT ID</th>
                      <th className="text-left px-4 py-3">ROLE</th><th className="text-left px-4 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rolesTab === 'GUIDES' ? guides : leaders).map((u) => (
                      <tr key={u.id} className={`border-b ${tableRow}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                              {u.firstName?.[0] ?? u.email[0].toUpperCase()}
                            </span>
                            <div>
                              <p className={`font-medium ${headingText}`}>{u.firstName} {u.lastName}</p>
                              <p className={`text-xs ${subText}`}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${subText}`}>{u.vutId ?? '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-semibold ${subText}`}>{u.role}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setManageUser(u); setManageNewRole(u.role); }}
                              className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${dark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>MANAGE</button>
                            {onVerifyUser && (
                              <button onClick={() => onVerifyUser(u.id)}
                                className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-lg transition-colors">VERIFY</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(rolesTab === 'GUIDES' ? guides : leaders).length === 0 && (
                      <tr><td colSpan={4} className={`px-4 py-6 text-center text-sm italic ${subText}`}>No {rolesTab.toLowerCase()} found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DATABASE ── */}
          {activeSection === 'DATABASE' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${headingText}`}>DATABASE</h2>
                <input type="text" value={dbSearch} onChange={(e) => setDbSearch(e.target.value)}
                  placeholder="Search users..."
                  className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 w-52 ${inputClass}`} />
              </div>
              <div className={`${cardBg} border rounded-xl overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-wider ${dark ? 'border-gray-700' : 'border-gray-100'} ${tableHead}`}>
                      <th className="text-left px-4 py-3">USER DETAILS</th><th className="text-left px-4 py-3">VUT ID</th>
                      <th className="text-left px-4 py-3">ROLE</th><th className="text-left px-4 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className={`border-b ${tableRow}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${dark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}>
                              {u.firstName?.[0] ?? u.email[0].toUpperCase()}
                            </span>
                            <div>
                              <p className={`font-medium ${headingText}`}>{u.firstName} {u.lastName}</p>
                              <p className={`text-xs ${subText}`}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${subText}`}>{u.vutId ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setManageUser(u); setManageNewRole(u.role); }}
                            className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${dark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>MANAGE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ROOMS list ── */}
          {activeSection === 'ROOMS' && !selectedRoomInfo && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-sm font-bold uppercase tracking-wider ${subText}`}>CURRENT ROOMS</h2>
                <button onClick={() => setShowAddRoom(true)}
                  className={`flex items-center gap-1 border text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${dark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  + ADD ROOM
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(rooms.length > 0 ? rooms : ROOM_LIST.map((name, i) => ({ id: String(i), name, capacity: 10, allowedRoles: ['STUDENT', 'GUIDE', 'CEO'] as UserRole[] }))).map((room) => (
                  <button key={room.id ?? room.name} onClick={() => handleOpenRoomInfo(room as Room)}
                    className={`${cardBg} border rounded-xl overflow-hidden hover:shadow-md transition-shadow text-left`}>
                    <div className={`h-28 flex items-center justify-center ${dark ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-100 to-gray-100'}`}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div className="px-3 py-2">
                      <p className={`text-xs font-bold uppercase tracking-wide ${headingText}`}>{room.name}</p>
                      <p className={`text-xs ${subText}`}>Capacity: {room.capacity}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ROOM detail ── */}
          {activeSection === 'ROOMS' && selectedRoomInfo && (
            <div className="p-6 max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-sm font-bold uppercase tracking-wider ${headingText}`}>{selectedRoomInfo.name}</h2>
                <button onClick={() => setSelectedRoomInfo(null)}
                  className={`flex items-center gap-1 border text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${dark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  ← BACK
                </button>
              </div>
              <div className={`${cardBg} border-2 border-purple-400 rounded-xl overflow-hidden`}>
                <div className={`h-48 flex items-center justify-center ${dark ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-200 to-pink-100'}`}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="p-4">
                  <p className={`text-sm mb-3 ${subText}`}>👥 {selectedRoomInfo.capacity} PEOPLE</p>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subText}`}>WHO CAN BOOK IT</p>
                  <div className="space-y-1 mb-4">
                    {(['CEO', 'GUIDE', 'STUDENT'] as UserRole[]).map((role) => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editedRoles.includes(role)}
                          onChange={(e) => {
                            setEditedRoles(e.target.checked
                              ? [...editedRoles, role]
                              : editedRoles.filter((r) => r !== role));
                          }}
                          className="accent-purple-600"
                        />
                        <span className={`text-sm ${headingText}`}>{role === 'CEO' ? 'LEADER' : role}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handleSaveRoomRoles} disabled={savingRoom}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                    {savingRoom ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MANAGE USER modal ── */}
      {manageUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setManageUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl">×</button>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">MANAGE ROLE</h2>
            <div className="mb-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">NAME</p>
              <p className="text-sm font-semibold text-gray-800">{manageUser.firstName} {manageUser.lastName}</p>
            </div>
            <div className="mb-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">VUT ID</p>
              <p className="text-sm text-gray-600">{manageUser.vutId ?? '—'}</p>
            </div>
            <div className="mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">CHANGE ROLE</p>
              <select value={manageNewRole} onChange={(e) => setManageNewRole(e.target.value as UserRole)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                <option value="STUDENT">STUDENT</option>
                <option value="CEO">LEADER</option>
                <option value="GUIDE">GUIDE</option>
              </select>
            </div>
            <button onClick={async () => { await onChangeUserRole(manageUser.id, manageNewRole); setManageUser(null); }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
              CONFIRM
            </button>
          </div>
        </div>
      )}

      {/* ── ADD ROOM modal ── */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowAddRoom(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl">×</button>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">NEW ROOM</h2>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">NAME OF THE ROOM</label>
                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Room name"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">CAPACITY</label>
                <select value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  {[5, 10, 15, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2">WHO CAN BOOK IT</label>
              <div className="grid grid-cols-2 gap-1">
                {(['CEO', 'GUIDE', 'STUDENT'] as UserRole[]).map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={newRoomRoles.includes(role)}
                      onChange={(e) => setNewRoomRoles(e.target.checked ? [...newRoomRoles, role] : newRoomRoles.filter((r) => r !== role))}
                      className="accent-purple-600" />
                    {role === 'CEO' ? 'LEADER' : role}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={async () => { if (!newRoomName) return; await onAddRoom({ name: newRoomName, capacity: newRoomCapacity, allowedRoles: newRoomRoles }); setShowAddRoom(false); setNewRoomName(''); }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">CONFIRM</button>
          </div>
        </div>
      )}

      {showBooking && (
        <BookingModal user={user} rooms={ROOM_LIST} onClose={() => setShowBooking(false)}
          onConfirm={async (data) => { await onCreateReservation(data); setShowBooking(false); }} />
      )}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={onUpdateUser} />
      )}
    </div>
  );
}
