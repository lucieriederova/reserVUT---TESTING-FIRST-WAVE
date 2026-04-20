import React, { useState } from 'react';
import { User, Reservation, Room, UserRole, ReservationType } from './types';
import BookingModal from './BookingModal';
import ProfileModal from './ProfileModal';
import CalendarGrid from './CalendarGrid';
import WeekNavigator from './WeekNavigator';
import { AVATAR_ICONS } from './AvatarPickerModal'; // Importujeme ikony místo textu 
import { updateRoom } from '../lib/api';

type AdminSection = 'CALENDAR' | 'REPORTS' | 'ROLES' | 'DATABASE' | 'ROOMS';

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  vutId?: string;
  isVerified?: boolean;
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

  // Dynamicky vybereme správnou komponentu ikony 
  const UserAvatarIcon = AVATAR_ICONS[user.avatarIndex ?? 0] || AVATAR_ICONS[0];

  // Theme helpers
  const navBg = 'bg-gray-900 border-gray-700';
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
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* NAVBAR */}
      <div className={`${navBg} border-b px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-bold text-sm px-1.5 py-0.5 rounded">T</span>
          <span className="bg-gray-600 text-gray-200 font-bold text-sm px-1.5 py-0.5 rounded">FP</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} className={`transition-colors ${dark ? 'text-yellow-400' : 'text-gray-400'}`}>
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          
          {/* PROFILOVÉ TLAČÍTKO - OPRAVENO  */}
          <button 
            onClick={() => setShowProfile(true)} 
            className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white hover:bg-purple-600 transition-colors"
          >
            <UserAvatarIcon size={18} strokeWidth={2} />
          </button>

          <div className="text-right">
            <p className="text-xs font-semibold text-gray-200">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{user.role}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className={`${sidebarBg} flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-12' : 'w-52'}`}>
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">RESERVUT</span>
            </div>
          )}
          <nav className="flex-1 py-4">
            {navItems.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all ${activeSection === key ? sidebarActive : sidebarText}`}>
                <span className={activeSection === key ? (dark ? 'text-white' : 'text-gray-700') : 'text-gray-500'}>{NAV_ICONS[key]}</span>
                {!sidebarCollapsed && <span className="tracking-widest uppercase text-[10px]">{label}</span>}
              </button>
            ))}
          </nav>
          <button onClick={onLogout}
            className="flex items-center gap-2 px-4 py-4 text-[10px] font-bold text-gray-500 hover:text-red-400 border-t border-gray-700 transition-colors uppercase tracking-widest">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!sidebarCollapsed && <span>LOG OUT</span>}
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className={`flex-1 ${contentBg} overflow-auto p-6`}>

          {/* CALENDAR */}
          {activeSection === 'CALENDAR' && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className={`text-xl font-black uppercase tracking-tighter ${headingText}`}>Global Priority Schedule</h1>
                <div className="flex items-center gap-3">
                  <WeekNavigator offset={weekOffset} onChange={setWeekOffset} />
                  <button onClick={() => setShowBooking(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-all uppercase tracking-widest">+ NEW BOOKING</button>
                </div>
              </div>
              <div className={`${cardBg} rounded-2xl border p-2 flex-1 shadow-sm overflow-hidden`}>
                <CalendarGrid reservations={filteredReservations} weekOffset={weekOffset} onReservationClick={() => {}} currentUserId={user.id} userRole={user.role} />
              </div>
            </div>
          )}

          {/* ROLES */}
          {activeSection === 'ROLES' && (
            <div className="flex flex-col gap-6">
              <h2 className={`text-xl font-black uppercase tracking-tighter ${headingText}`}>Role Management</h2>
              <div className="flex gap-2 mb-2">
                {(['GUIDES', 'LEADERS'] as const).map(tab => (
                  <button key={tab} onClick={() => setRolesTab(tab)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${rolesTab === tab ? 'bg-purple-600 text-white' : `${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className={`${cardBg} border rounded-2xl overflow-hidden shadow-sm`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-[10px] font-bold uppercase tracking-widest ${tableHead} ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {(rolesTab === 'GUIDES' ? guides : leaders).map(u => (
                      <tr key={u.id} className={tableRow}>
                        <td className={`px-4 py-3 font-medium ${headingText}`}>{u.firstName} {u.lastName}</td>
                        <td className={`px-4 py-3 text-xs ${subText}`}>{u.email}</td>
                        <td className="px-4 py-3"><span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{u.role === 'CEO' ? 'LEADER' : u.role}</span></td>
                        <td className="px-4 py-3">
                          {u.isVerified
                            ? <span className="text-xs text-green-600 font-bold">✓ Verified</span>
                            : <span className="text-xs text-orange-500 font-bold">Pending</span>}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => { setManageUser(u); setManageNewRole(u.role); }}
                            className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${dark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>MANAGE</button>
                          {onVerifyUser && !u.isVerified && (
                            <button onClick={() => onVerifyUser(u.id)}
                              className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors">VERIFY</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(rolesTab === 'GUIDES' ? guides : leaders).length === 0 && (
                      <tr><td colSpan={5} className={`px-4 py-8 text-center text-sm italic ${subText}`}>No {rolesTab.toLowerCase()} found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {manageUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className={`${dark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-sm p-6`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${headingText}`}>Manage User</h3>
                    <p className={`text-sm mb-4 ${subText}`}>{manageUser.firstName} {manageUser.lastName} · {manageUser.email}</p>
                    <label className={`block text-[10px] uppercase tracking-wider mb-1 ${subText}`}>Change Role</label>
                    <select value={manageNewRole} onChange={e => setManageNewRole(e.target.value as UserRole)}
                      className={`w-full border rounded px-3 py-2 text-sm mb-4 ${inputClass}`}>
                      {(['STUDENT','CEO','GUIDE','HEAD_ADMIN'] as UserRole[]).map(r => (
                        <option key={r} value={r}>{r === 'CEO' ? 'LEADER' : r}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setManageUser(null)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${dark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                      <button onClick={async () => { await onChangeUserRole(manageUser.id, manageNewRole); setManageUser(null); }}
                        className="flex-1 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white">Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DATABASE */}
          {activeSection === 'DATABASE' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-black uppercase tracking-tighter ${headingText}`}>All Users</h2>
                <input type="text" value={dbSearch} onChange={e => setDbSearch(e.target.value)}
                  placeholder="Search users..." className={`border rounded-lg px-3 py-1.5 text-sm w-56 ${inputClass}`} />
              </div>
              <div className={`${cardBg} border rounded-2xl overflow-hidden shadow-sm`}>
                <table className="w-full text-left text-sm">
                  <thead className={`text-[10px] font-bold uppercase tracking-widest ${tableHead} ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">VUT ID</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Verified</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={tableRow}>
                        <td className={`px-4 py-3 font-medium ${headingText}`}>{u.firstName} {u.lastName}</td>
                        <td className={`px-4 py-3 text-xs ${subText}`}>{u.email}</td>
                        <td className={`px-4 py-3 text-xs font-mono ${subText}`}>{u.vutId ?? '—'}</td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold">{u.role === 'CEO' ? 'LEADER' : u.role}</span></td>
                        <td className="px-4 py-3">{u.isVerified ? <span className="text-green-600 text-xs font-bold">✓</span> : <span className="text-orange-400 text-xs">—</span>}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={5} className={`px-4 py-8 text-center text-sm italic ${subText}`}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOMS */}
          {activeSection === 'ROOMS' && (
            <div className="flex flex-col gap-4">
              <h2 className={`text-xl font-black uppercase tracking-tighter ${headingText}`}>Room Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(rooms.length > 0 ? rooms : ROOM_LIST.map((name, i) => ({ id: String(i), name, capacity: 10, allowedRoles: ['STUDENT', 'GUIDE', 'CEO'] as UserRole[] }))).map(room => (
                  <div key={room.name} className={`${cardBg} border rounded-2xl p-4 shadow-sm`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold ${headingText}`}>{room.name}</h3>
                      <button onClick={() => handleOpenRoomInfo(room)}
                        className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg">EDIT</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {room.allowedRoles.map(r => (
                        <span key={r} className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{r === 'CEO' ? 'LEADER' : r}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {selectedRoomInfo && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className={`${dark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-sm p-6`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${headingText}`}>{selectedRoomInfo.name}</h3>
                    <p className={`text-[10px] uppercase tracking-wider mb-2 ${subText}`}>Who can book this room</p>
                    <div className="flex flex-col gap-2 mb-5">
                      {(['STUDENT','CEO','GUIDE','HEAD_ADMIN'] as UserRole[]).map(r => (
                        <label key={r} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editedRoles.includes(r)}
                            onChange={e => setEditedRoles(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))}
                            className="accent-purple-600" />
                          <span className={`text-sm ${headingText}`}>{r === 'CEO' ? 'Leader' : r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedRoomInfo(null)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${dark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                      <button onClick={handleSaveRoomRoles} disabled={savingRoom}
                        className="flex-1 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white">
                        {savingRoom ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REPORTS */}
          {activeSection === 'REPORTS' && (
            <div className="flex flex-col gap-4">
              <h2 className={`text-xl font-black uppercase tracking-tighter ${headingText}`}>Reports</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: allUsers.length },
                  { label: 'Total Reservations', value: reservations.length },
                  { label: 'Active', value: reservations.filter(r => r.status === 'active').length },
                  { label: 'Cancelled', value: reservations.filter(r => r.status === 'cancelled').length },
                ].map(stat => (
                  <div key={stat.label} className={`${cardBg} border rounded-2xl p-5 shadow-sm text-center`}>
                    <p className={`text-3xl font-black ${headingText}`}>{stat.value}</p>
                    <p className={`text-xs uppercase tracking-widest mt-1 ${subText}`}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className={`${cardBg} border rounded-2xl p-4 shadow-sm`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${subText}`}>Recent Reservations</p>
                <table className="w-full text-sm">
                  <thead className={`text-[10px] font-bold uppercase tracking-widest ${tableHead}`}>
                    <tr>
                      <th className="px-3 py-2 text-left">Room</th>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {[...reservations].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 10).map(r => (
                      <tr key={r.id} className={tableRow}>
                        <td className={`px-3 py-2 font-medium ${headingText}`}>{r.roomName}</td>
                        <td className={`px-3 py-2 text-xs ${subText}`}>{r.userName ?? '—'}</td>
                        <td className={`px-3 py-2 text-xs ${subText}`}>{new Date(r.startTime).toLocaleDateString('cs-CZ')}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

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