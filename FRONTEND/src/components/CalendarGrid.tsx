import { useRef, useEffect } from 'react';
import { Reservation, UserRole } from './types';

interface CalendarGridProps {
  reservations: Reservation[];
  weekOffset: number;
  dayDates?: Date[];
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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ROW_H = 40;
const DAY_ROW_H = 64;

function getDayName(d: Date): string {
  return DAY_NAMES[d.getDay()];
}

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
  colCount: number,
  rowH: number,
): React.CSSProperties {
  const start = new Date(r.startTime);
  const end = new Date(r.endTime);
  const startH = start.getHours() + start.getMinutes() / 60;
  const endH = end.getHours() + end.getMinutes() / 60;
  const clampedStart = Math.max(startH, startHour);
  const top = (clampedStart - startHour) * rowH + 1;
  const height = Math.max((endH - clampedStart) * rowH - 3, 18);
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

function getReservationColors(r: Reservation, isOwn: boolean): { bg: string; borderL: string } {
  if (isOwn) return { bg: 'bg-emerald-500', borderL: 'border-l-emerald-700' };
  if (r.priorityLevel === 4) return { bg: 'bg-blue-500', borderL: 'border-l-blue-700' };
  if (r.priorityLevel === 3) return { bg: 'bg-purple-500', borderL: 'border-l-purple-700' };
  if (r.priorityLevel === 2) return { bg: 'bg-orange-400', borderL: 'border-l-orange-600' };
  return { bg: 'bg-red-400', borderL: 'border-l-red-600' };
}

export default function CalendarGrid({
  reservations,
  weekOffset,
  dayDates,
  onReservationClick,
  currentUserId,
  userRole,
  startHour = 7,
  endHour = 21,
  dark,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dates = dayDates ?? getWeekDates(weekOffset);
  const isSingleDay = dates.length === 1;
  const rowH = isSingleDay ? DAY_ROW_H : WEEK_ROW_H;
  const HOURS = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);
  const totalHeight = HOURS.length * rowH;
  const todayColors = getTodayColors(userRole, dark);
  const gutterW = isSingleDay ? 52 : 48;
  const cols = `${gutterW}px repeat(${dates.length}, 1fr)`;

  // Scroll so current time is visible (~1.5h above now)
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const nowH = now.getHours() + now.getMinutes() / 60;
    scrollRef.current.scrollTop = Math.max(0, (nowH - startHour - 1.5) * rowH);
  }, [isSingleDay, startHour, rowH]);

  const cellBg   = dark ? 'bg-[#1f2535]' : 'bg-white';
  const borderC  = dark ? 'border-gray-700/40' : 'border-gray-200';
  const borderH  = dark ? 'border-gray-700/20' : 'border-gray-100';
  const timeText = dark ? 'text-gray-600' : 'text-gray-400';
  const dayText  = dark ? 'text-gray-500' : 'text-gray-400';
  const dateText = dark ? 'text-gray-300' : 'text-gray-700';
  const legendBg = dark ? 'bg-[#1a1f2e] border-gray-700/40 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400';

  const getReservationsForDay = (day: Date) =>
    reservations.filter(r => sameLocalDate(new Date(r.startTime), day) && r.status === 'active');

  return (
    // h-full so this fills whatever container gives it height
    <div className="h-full flex flex-col">

      {/* ── Fixed day-header row (not part of the scroll) ── */}
      <div className={`grid flex-shrink-0 border-b ${borderC}`} style={{ gridTemplateColumns: cols }}>
        <div className={`h-12 border-r ${borderC} ${cellBg}`} />
        {dates.map((day, i) => {
          const isToday = sameLocalDate(day, new Date());
          return (
            <div
              key={i}
              className={`h-12 border-r ${borderC} flex flex-col items-center justify-center ${isToday ? todayColors.header : cellBg}`}
            >
              <span className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? todayColors.text : dayText}`}>
                {getDayName(day)}
              </span>
              {isToday ? (
                <span className="text-sm font-black w-7 h-7 flex items-center justify-center rounded-full mt-0.5 bg-purple-600 text-white leading-none">
                  {day.getDate()}
                </span>
              ) : (
                <span className={`text-sm font-bold mt-0.5 ${dateText}`}>{day.getDate()}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Scrollable time grid ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div style={{ minWidth: isSingleDay ? 0 : 600 }}>
          <div className="grid" style={{ gridTemplateColumns: cols, height: totalHeight }}>

            {/* Time gutter */}
            <div className={`border-r ${borderC} relative flex-shrink-0`} style={{ height: totalHeight }}>
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="absolute w-full flex items-start justify-end pr-2"
                  style={{ top: (hour - startHour) * rowH - 8, height: rowH }}
                >
                  <span className={`text-[10px] font-medium tabular-nums ${timeText}`}>
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {dates.map((day, di) => {
              const dayRes = getReservationsForDay(day);
              const isToday = sameLocalDate(day, new Date());
              const now = new Date();
              const nowH = now.getHours() + now.getMinutes() / 60;
              const showNow = isToday && nowH >= startHour && nowH <= endHour;
              const nowTop = (nowH - startHour) * rowH;

              return (
                <div
                  key={di}
                  className={`border-r ${borderC} relative ${isToday ? todayColors.bg : ''}`}
                  style={{ height: totalHeight }}
                >
                  {/* Hour + half-hour lines */}
                  {HOURS.map(hour => (
                    <div key={hour}>
                      <div className={`absolute w-full border-t ${borderH}`} style={{ top: (hour - startHour) * rowH }} />
                      {isSingleDay && (
                        <div
                          className="absolute w-full"
                          style={{
                            top: (hour - startHour) * rowH + rowH / 2,
                            height: 1,
                            background: dark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)',
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {/* Current-time indicator */}
                  {showNow && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: nowTop }}>
                      <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  )}

                  {/* Events */}
                  {dayRes.map(r => {
                    const isOwn = r.userId === currentUserId;
                    const start = new Date(r.startTime);
                    const end = new Date(r.endTime);
                    const sl = `${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`;
                    const el = `${String(end.getHours()).padStart(2,'00')}:${String(end.getMinutes()).padStart(2,'0')}`;
                    const durH = (end.getTime() - start.getTime()) / 3600000;
                    const overlaps = dayRes.filter(o => {
                      const os = new Date(o.startTime).getTime();
                      const oe = new Date(o.endTime).getTime();
                      return os < end.getTime() && oe > start.getTime();
                    });
                    const style = getReservationStyle(r, startHour, overlaps.indexOf(r), overlaps.length, rowH);
                    const h = style.height as number;
                    const { bg, borderL } = getReservationColors(r, isOwn);
                    const tiny = h < 28;
                    const short = h < (isSingleDay ? 56 : 30);

                    return (
                      <button
                        key={r.id}
                        onClick={() => onReservationClick(r)}
                        style={style}
                        className={`text-white text-left overflow-hidden rounded-lg border-l-4 shadow-sm transition-all hover:brightness-110 active:brightness-90 ${bg} ${borderL} ${isSingleDay ? 'px-2' : 'px-1.5'}`}
                        title={`${r.roomName} · ${sl}–${el}${r.description ? ' · ' + r.description : ''}`}
                      >
                        {isSingleDay ? (
                          tiny ? (
                            <p className="text-[11px] font-bold truncate leading-none mt-px">{r.roomName}</p>
                          ) : short ? (
                            <div className="py-0.5">
                              <p className="text-xs font-bold truncate leading-tight">{r.roomName}</p>
                              <p className="text-[11px] opacity-90 leading-tight">{sl}–{el}</p>
                            </div>
                          ) : (
                            <div className="py-1 flex flex-col gap-0.5">
                              <p className="text-[13px] font-bold truncate leading-snug">{r.roomName}</p>
                              <p className="text-[11px] opacity-90 leading-snug">{sl} – {el}</p>
                              {r.description && durH >= 0.75 && (
                                <p className="text-[11px] opacity-70 truncate leading-snug">{r.description}</p>
                              )}
                              {r.userName && !isOwn && durH >= 1 && (
                                <p className="text-[11px] opacity-70 truncate leading-snug">{r.userName}</p>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="py-px">
                            <p className="text-[9px] font-bold truncate leading-tight">{r.roomName}</p>
                            {!short && <p className="text-[9px] opacity-90 truncate leading-tight">{sl}–{el}</p>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend — week view only */}
      {!isSingleDay && (
        <div className={`flex flex-wrap items-center gap-3 px-3 py-2 border-t text-[10px] flex-shrink-0 ${legendBg}`}>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block flex-shrink-0" />My reservation</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block flex-shrink-0" />Student</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block flex-shrink-0" />Leader</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block flex-shrink-0" />Guide</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block flex-shrink-0" />Admin</div>
        </div>
      )}
    </div>
  );
}
