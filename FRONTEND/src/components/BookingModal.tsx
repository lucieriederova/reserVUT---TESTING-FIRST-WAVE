import { useState } from 'react';
import { User, ReservationType, ROOMS_BY_ROLE, TYPES_BY_ROLE, MAX_DURATION_MINUTES } from './types';

interface BookingModalProps {
  user: User;
  rooms?: string[];
  onClose: () => void;
  onConfirm: (data: {
    roomName: string;
    startTime: string;
    endTime: string;
    description: string;
    type: ReservationType;
  }) => Promise<void>;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 21; h++)
    for (let m = 0; m < 60; m += 15)
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

function getEndSlots(startTime: string, maxMinutes: number): string[] {
  const idx = TIME_SLOTS.indexOf(startTime);
  if (idx < 0) return [];
  const maxSlots = maxMinutes / 15;
  return TIME_SLOTS.slice(idx + 1, idx + 1 + maxSlots);
}

const TYPE_LABELS: Record<ReservationType, string> = {
  MEETING: 'Meeting',
  SESSION: 'Session',
  WORKSHOP: 'Workshop',
  PITCHDECK: 'Pitchdeck',
  EVENT: 'Event (Global)',
  OTHER: 'Other',
};

export default function BookingModal({ user, rooms: roomsProp, onClose, onConfirm }: BookingModalProps) {
  const rooms = roomsProp ?? ROOMS_BY_ROLE[user.role];
  const types = TYPES_BY_ROLE[user.role];
  const maxDuration = MAX_DURATION_MINUTES[user.role];

  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('');
  const [type, setType] = useState<ReservationType>(types[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Client-side date constraint based on role
  const maxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + (['STUDENT', 'CEO'].includes(user.role) ? 5 : 365));
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(today);

  const handleConfirm = async () => {
    if (!room || !startTime || !endTime) { setError('Please fill all required fields.'); return; }
    setError('');
    setLoading(true);
    try {
      await onConfirm({
        roomName: room,
        startTime: `${selectedDate}T${startTime}:00`,
        endTime: `${selectedDate}T${endTime}:00`,
        description,
        type,
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to create reservation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>

        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">NEW RESERVATION</h2>

        {/* Not verified warning */}
        {!user.isVerified && (user.role === 'CEO' || user.role === 'GUIDE') && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-3 py-2">
            ⚠️ Your account is not yet verified. A Guide or Head Admin must verify you before you can book.
          </div>
        )}

        {/* Description */}
        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Description of use</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What will you use the room for?"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          />
        </div>

        {/* Room */}
        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Room</label>
          <select value={room} onChange={(e) => setRoom(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            <option value="">SELECT ROOM</option>
            {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Type */}
        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as ReservationType)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            {types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>

        {/* Date */}
        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Date</label>
          <input type="date" value={selectedDate} min={today} max={maxDate()}
            onChange={(e) => { setSelectedDate(e.target.value); setStartTime(''); setEndTime(''); }}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Start / End */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Start</label>
            <select value={startTime} onChange={(e) => { setStartTime(e.target.value); setEndTime(''); }}
              className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">--:--</option>
              {TIME_SLOTS.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">End</label>
            <select value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!startTime}
              className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50">
              <option value="">--:--</option>
              {startTime && getEndSlots(startTime, maxDuration).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Duration hint */}
        <p className="text-[10px] text-gray-400 mb-3">
          Min 15 min · Max {maxDuration === 150 ? '2h 30min' : '3h'} · 15-min blocks
        </p>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button onClick={handleConfirm} disabled={loading || !user.isVerified && (user.role === 'CEO' || user.role === 'GUIDE')}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
          {loading ? 'CONFIRMING...' : 'CONFIRM SESSION'}
        </button>
      </div>
    </div>
  );
}
