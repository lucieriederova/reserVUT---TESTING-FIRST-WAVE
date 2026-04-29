import { Reservation, UserRole } from './types';

interface CalendarGridProps {
  reservations: Reservation[];
  weekOffset: number;
  onReservationClick: (r: Reservation) => void;
  currentUserId: string;
  userRole?: UserRole;
  startHour?: number;
  endHour?: number;
  dark?: boolean;
}

function getTodayColors(role?: UserRole, dark?: boolean): { bg: string; text: string; header: string } {
  if (dark) {
    if (role === 'CEO')        return { bg: 'bg-orange-950/25', text: 'text-orange-400', header: 'bg-orange-950/35' };
    if (role === 'GUIDE')      return { bg: 'bg-purple-950/25', text: 'text-purple-400', header: 'bg-purple-950/35' };
    if (role === 'HEAD_ADMIN') return { bg: 'bg-blue-950/25',   text: 'text-blue-400',   header: 'bg-blue-950/35' };
    return { bg: 'bg-pink-950/25', text: 'text-pink-400', header: 'bg-pink-950/35' };
  }
  if (role === 'CEO')        return { bg: 'bg-orange-50', text: 'text-orange-600', header: 'bg-orange-50' };
  if (role === 'GUIDE')      return { bg: 'bg-purple-50', text: 'text-purple-600', header: 'bg-purple-50' };
  if (role === 'HEAD_ADMIN') return { bg: 'bg-blue-50',   text: 'text-blue-600',   header: 'bg-blue-50' };
  return { bg: 'bg-pink-50', text: 'text-pink-600', header: 'bg-pink-50' };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROW_HEIGHT = 40; // px per hour

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getReservationStyle(
  r: Reservation,
  startHour: number,
  colIndex: number,
  colCount: number
): React.CSSProperties {
  const start = new Date(r.startTime);
  const end = new Date(r.endTime);
  const startH = start.getHours() + start.getMinutes() / 60;
  const endH = end.getHours() + end.getMinutes() / 60;
  const clampedStart = Math.max(startH, startHour);
  const top = (clampedStart - startHour) * ROW_HEIGHT;
  const height = Math.max((endH - clampedStart) * ROW_HEIGHT - 2, 18);
  const colW = 100 / colCount;
  return {
    position: 'absolute',
    top,
    height,
    left: `calc(${colIndex * colW}% + 2px)`,
    width: `calc(${colW}% - 4px)`,
    zIndex: 10 + colIndex,
  };
}

function getReservationColors(r: Reservation, isOwn: boolean): string {
  if (isOwn) return 'bg-emerald-500 text-white border border-emerald-600';
  if (r.priorityLevel === 4) return 'bg-blue-500 text-white border border-blue-600';
  if (r.priorityLevel === 3) return 'bg-purple-500 text-white border border-purple-600';
  if (r.priorityLevel === 2) return 'bg-orange-400 text-white border border-orange-500';
  return 'bg-red-400 text-white border border-red-500';
}

export default function CalendarGrid({
  reservations,
  weekOffset,
  onReservationClick,
  currentUserId,
  userRole,
  startHour = 7,
  endHour = 21,
  dark,
}: CalendarGridProps) {
  const weekDates = getWeekDates(weekOffset);
  const HOURS = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);
  const totalHeight = HOURS.length * ROW_HEIGHT;
  const todayColors = getTodayColors(userRole, dark);

  const cellBg = dark ? 'bg-[#1f2535]' : 'bg-white';
  const borderCol = dark ? 'border-gray-700/40' : 'border-gray-200';
  const borderHour = dark ? 'border-gray-700/25' : 'border-gray-100';
  const timeText = dark ? 'text-gray-600' : 'text-gray-400';
  const dayNameText = dark ? 'text-gray-500' : 'text-gray-500';
  const dateText = dark ? 'text-gray-400' : 'text-gray-700';
  const legendBg = dark ? 'bg-[#1a1f2e] border-gray-700/40 text-gray-500' : 'bg-white border-gray-100 text-gray-500';

  const getReservationsForDay = (day: Date) =>
    reservations.filter((r) => {
      const start = new Date(r.startTime);
      return sameLocalDate(start, day) && r.status === 'active';
    });

  return (
    <div className="overflow-auto h-full flex flex-col">
      <div className="flex-1" style={{ minWidth: '600px' }}>
        <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>

          {/* Sticky header row */}
          <div className={`border-b border-r ${borderCol} h-8 ${cellBg} sticky top-0 z-20`} />
          {weekDates.map((day, i) => {
            const isToday = sameLocalDate(day, new Date());
            return (
              <div
                key={i}
                className={`border-b border-r ${borderCol} h-8 flex flex-col items-center justify-center sticky top-0 z-20 ${isToday ? todayColors.header : cellBg}`}
              >
                <span className={`text-[10px] font-semibold ${dayNameText}`}>{DAYS[i]}</span>
                <span className={`text-[10px] font-bold ${isToday ? todayColors.text : dateText}`}>
                  {day.getDate()}.{day.getMonth() + 1}.
                </span>
              </div>
            );
          })}

          {/* Time gutter */}
          <div className={`border-r ${borderCol} relative`} style={{ height: totalHeight }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className={`absolute w-full border-b ${borderHour} flex items-start justify-end pr-1 pt-0.5`}
                style={{ top: (hour - startHour) * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                <span className={`text-[9px] ${timeText}`}>{hour}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((day, di) => {
            const dayReservations = getReservationsForDay(day);
            const isToday = sameLocalDate(day, new Date());
            const now = new Date();
            const nowH = now.getHours() + now.getMinutes() / 60;
            const showNowLine = isToday && nowH >= startHour && nowH <= endHour;
            const nowTop = (nowH - startHour) * ROW_HEIGHT;

            return (
              <div
                key={di}
                className={`border-r ${borderCol} relative ${isToday ? todayColors.bg : ''}`}
                style={{ height: totalHeight }}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={`absolute w-full border-b ${borderHour}`}
                    style={{ top: (hour - startHour) * ROW_HEIGHT, height: ROW_HEIGHT }}
                  />
                ))}

                {/* Current time line */}
                {showNowLine && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-purple-500 opacity-70" />
                  </div>
                )}

                {/* Reservation blocks — one per reservation, properly spanning */}
                {dayReservations.map((r) => {
                  const isOwn = r.userId === currentUserId;
                  const start = new Date(r.startTime);
                  const end = new Date(r.endTime);
                  const startLabel = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
                  const endLabel = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                  const overlaps = dayReservations.filter((o) => {
                    const os = new Date(o.startTime).getTime();
                    const oe = new Date(o.endTime).getTime();
                    return os < end.getTime() && oe > start.getTime();
                  });
                  const colCount = overlaps.length;
                  const colIndex = overlaps.indexOf(r);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onReservationClick(r)}
                      style={getReservationStyle(r, startHour, colIndex, colCount)}
                      className={`rounded-md text-[9px] font-semibold px-1.5 py-0.5 text-left overflow-hidden hover:brightness-95 transition-all ${getReservationColors(r, isOwn)}`}
                      title={`${r.roomName} · ${startLabel}–${endLabel}${r.description ? ' · ' + r.description : ''}`}
                    >
                      <div className="truncate font-bold leading-tight">{r.roomName}</div>
                      <div className="truncate opacity-90 leading-tight">{startLabel}–{endLabel}</div>
                      {r.userName && !isOwn && (
                        <div className="truncate opacity-75 leading-tight">{r.userName}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap items-center gap-3 px-3 py-2 border-t ${legendBg} text-[10px] flex-shrink-0`}>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block flex-shrink-0" />
          My reservation
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-400 inline-block flex-shrink-0" />
          Student
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-400 inline-block flex-shrink-0" />
          Leader
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-500 inline-block flex-shrink-0" />
          Guide
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block flex-shrink-0" />
          Admin
        </div>
      </div>
    </div>
  );
}
