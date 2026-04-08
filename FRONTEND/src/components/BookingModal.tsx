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
  EVENT: 'Event',
  GLOBAL_EVENT: 'Global Event',
  OTHER: 'Other',
};

function localDateTimeToISO(date: string, time: string): string {
  // Build a Date from local date+time (no timezone suffix = local), then emit UTC ISO
  const local = new Date(`${date}T${time}:00`);
  return local.toISOString();
}

function isTimeInPast(date: string, time: string): boolean {
  const now = new Date();
  const selected = new Date(`${date}T${time}:00`);
  return selected <= now;
}

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
  const [conflictDetail, setConflictDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const maxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + (['STUDENT', 'CEO'].includes(user.role) ? 5 : 365));
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(today);

  // Filter out past time slots for today
  const availableStartSlots = TIME_SLOTS.slice(0, -1).filter((t) => {
    if (selectedDate !== today) return true;
    return !isTimeInPast(selectedDate, t);
  });

  const handleConfirm = async () => {
    setSubmitted(true);
    if (!room || !startTime || !endTime) { setError('Please fill all required fields.'); return; }
    if (isTimeInPast(selectedDate, startTime)) { setError('Cannot book a time slot in the past.'); return; }
    setError('');
    setConflictDetail('');
    setLoading(true);
    try {
      await onConfirm({
        roomName: room,
        startTime: localDateTimeToISO(selectedDate, startTime),
        endTime: localDateTimeToISO(selectedDate, endTime),
        description,
        type,
      });
    } catch (e: unknown) {
      const resData = (e as { response?: { data?: { error?: string; conflicting?: Array<{ roomName: string; startTime: string; endTime: string }> } } })?.response?.data;
      const msg = resData?.error;
      const conflicting = resData?.conflicting;
      if (conflicting?.length) {
        const c = conflicting[0];
        const s = new Date(c.startTime);
        const en = new Date(c.endTime);
        const fmt = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        setConflictDetail(`${c.roomName} · ${fmt(s)}–${fmt(en)}`);
      }
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to create reservation'));
    } finally {
      setLoading(false);
    }
  };

  const allFieldsFilled = room && startTime && endTime;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>

        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">NEW RESERVATION</h2>

        {!user.isVerified && (user.role === 'CEO' || user.role === 'GUIDE') && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-3 py-2">
            ⚠️ Your account is not yet verified. A Head Admin must verify you before you can book.
          </div>
        )}

        {/* Description */}
        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            Description of use <span className="text-gray-300">(optional)</span>
          </label>
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
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            Room <span className="text-red-400">*</span>
          </label>
          <select value={room} onChange={(e) => setRoom(e.target.value)}
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 ${submitted && !room ? 'border-red-400 ring-1 ring-red-300' : room ? 'border-purple-300' : 'border-gray-200'}`}>
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
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            min={today}
            max={maxDate()}
            onChange={(e) => { setSelectedDate(e.target.value); setStartTime(''); setEndTime(''); }}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer box-border"
            style={{ WebkitAppearance: 'none', maxWidth: '100%' }}
          />
        </div>

        {/* Start / End */}
        <div className="flex gap-3 mb-2">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
              Start <span className="text-red-400">*</span>
            </label>
            <select value={startTime} onChange={(e) => { setStartTime(e.target.value); setEndTime(''); }}
              className={`w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 ${submitted && !startTime ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}`}>
              <option value="">--:--</option>
              {availableStartSlots.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
              End <span className="text-red-400">*</span>
            </label>
            <select value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!startTime}
              className={`w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 ${submitted && !endTime ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}`}>
              <option value="">--:--</option>
              {startTime && getEndSlots(startTime, maxDuration).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mb-3">
          Min 15 min · Max {maxDuration === 150 ? '2h 30min' : '3h'} · 15-min blocks
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-red-600 text-xs font-semibold">
              {error.includes('Conflict') || error.includes('CONFLICT')
                ? `⚠️ Time slot conflict — this room is already booked at that time.${conflictDetail ? ` (${conflictDetail})` : ''}`
                : error.includes('WEEKLY_LIMIT') || error.includes('2 reservations')
                ? '⚠️ Weekly limit reached — students can only make 2 bookings per week.'
                : error.includes('SIMULTANEOUS')
                ? '⚠️ You already have a booking in another room at this time.'
                : error.includes('PAST_TIME') || error.includes('past')
                ? '⚠️ Cannot book a time in the past.'
                : error.includes('verified') || error.includes('NOT_VERIFIED')
                ? '⚠️ Your account needs Head Admin verification before booking.'
                : `⚠️ ${error}`}
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading || !allFieldsFilled || (!user.isVerified && (user.role === 'CEO' || user.role === 'GUIDE'))}
          className={`w-full font-bold py-2.5 rounded-lg text-sm transition-all text-white ${
            allFieldsFilled && (user.isVerified || (user.role !== 'CEO' && user.role !== 'GUIDE'))
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              CONFIRMING...
            </span>
          ) : !allFieldsFilled ? 'FILL ALL FIELDS TO CONFIRM' : 'CONFIRM SESSION'}
        </button>
      </div>
    </div>
  );
}
