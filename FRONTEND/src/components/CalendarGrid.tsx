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
const DAY_ROW_H = 60;

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

function getReservationColors(r: Reservation, isOwn: boolean): { bg: string; border: string } {
  if (isOwn) return { bg: 'bg-emerald-500', border: 'border-l-emerald-600' };
  if (r.priorityLevel === 4) return { bg: 'bg-blue-500', border: 'border-l-blue-700' };
  if (r.priorityLevel === 3) return { bg: 'bg-purple-500', border: 'border-l-purple-700' };
  if (r.priorityLevel === 2) return { bg: 'bg-orange-400', border: 'border-l-orange-600' };
  return { bg: 'bg-red-400', border: 'border-l-red-600' };
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

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const nowH = now.getHours() + now.getMinutes() / 60;
    const scrollTo = Math.max(0, (nowH - startHour - 1.5) * rowH);
    scrollRef.current.scrollTop = scrollTo;
  }, [isSingleDay, startHour, rowH]);

  const cellBg = dark ? 'bg-[#1f2535]' : 'bg-white';
  const borderCol = dark ? 'border-gray-700/40' : 'border-gray-200';
  const borderHour = dark ? 'border-gray-700/25' : 'border-gray-100';
  const timeText = dark ? 'text-gray-600' : 'text-gray-400';
  const dayNameText = dark ? 'text-gray-500' : 'text-gray-400';
  const dateText = dark ? 'text-gray-300' : 'text-gray-700';
  const legendBg = dark ? 'bg-[#1a1f2e] border-gray-700/40 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400';
  const gutterW = isSingleDay ? 52 : 48;

  const getReservationsForDay = (day: Date) =>
    reservations.filter((r) => {
      const start = new Date(r.startTime);
      return sameLocalDate(start, day) && r.status === 'active';
    });

  return (
    <div ref={scrollRef} className="overflow-auto h-full flex flex-col">
      <div className="flex-1" style={{ minWidth: isSingleDay ? '0' : '600px' }}>
        <div className="grid" style={{ gridTemplateColumns: `${gutterW}px repeat(${dates.length}, 1fr)` }}>

          {/* Sticky header row */}
          <div className={`border-b border-r ${borderCol} h-12 ${cellBg} sticky top-0 z-20`} />
          {dates.map((day, i) => {
            const isToday = sameLocalDate(day, new Date());
            return (
              <div
                key={i}
                className={`border-b border-r ${borderCol} h-12 flex flex-col items-center justify-center sticky top-0 z-20 ${isToday ? todayColors.header : cellBg}`}
              >
                <span className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? todayColors.text : dayNameText}`}>{getDayName(day)}</span>
                {isToday ? (
                  <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full mt-0.5 ${
                    dark ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'
                  }`}>
                    {day.getDate()}
                  </span>
                ) : (
                  <span className={`text-sm font-bold mt-0.5 ${dateText}`}>{day.getDate()}</span>
                )}
              </div>
            );
          })}

          {/* Time gutter */}
          <div className={`border-r ${borderCol} relative`} style={{ height: totalHeight }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: (hour - startHour) * rowH - 8, height: rowH }}
              >
                <span className={`text-[10px] font-medium ${timeText}`}>
                  {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((day, di) => {
            const dayReservations = getReservationsForDay(day);
            const isToday = sameLocalDate(day, new Date());
            const now = new Date();
            const nowH = now.getHours() + now.getMinutes() / 60;
            const showNowLine = isToday && nowH >= startHour && nowH <= endHour;
            const nowTop = (nowH - startHour) * rowH;

            return (
              <div
                key={di}
                className={`border-r ${borderCol} relative ${isToday ? todayColors.bg : ''}`}
                style={{ height: totalHeight }}
              >
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div key={hour}>
                    <div
                      className={`absolute w-full border-t ${borderHour}`}
                      style={{ top: (hour - startHour) * rowH }}
                    />
                    {isSingleDay && (
                      <div
                        className="absolute w-full"
                        style={{
                          top: (hour - startHour) * rowH + rowH / 2,
                          height: 1,
                          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        }}
                      />
                    )}
                  </div>
                ))}

                {/* Current time indicator */}
                {showNowLine && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 flex-shrink-0 shadow-sm" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                  </div>
                )}

                {/* Reservations */}
                {dayReservations.map((r) => {
                  const isOwn = r.userId === currentUserId;
                  const start = new Date(r.startTime);
                  const end = new Date(r.endTime);
                  const startLabel = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
                  const endLabel = `${String(end.getHours()).padStart(2, '00')}:${String(end.getMinutes()).padStart(2, '0')}`;
                  const durationH = (end.getTime() - start.getTime()) / 3600000;
                  const overlaps = dayReservations.filter((o) => {
                    const os = new Date(o.startTime).getTime();
                    const oe = new Date(o.endTime).getTime();
                    return os < end.getTime() && oe > start.getTime();
                  });
                  const colCount = overlaps.length;
                  const colIndex = overlaps.indexOf(r);
                  const style = getReservationStyle(r, startHour, colIndex, colCount, rowH);
                  const heightPx = style.height as number;
                  const colors = getReservationColors(r, isOwn);
                  const isVeryShort = heightPx < 28;
                  const isShort = heightPx < (isSingleDay ? 52 : 30);

                  return (
                    <button
                      key={r.id}
                      onClick={() => onReservationClick(r)}
                      style={style}
                      className={`rounded-lg text-left overflow-hidden transition-all text-white shadow-sm hover:brightness-110 active:brightness-90 border-l-4 ${colors.bg} ${colors.border} ${isSingleDay ? 'px-2.5' : 'px-1.5'}`}
                      title={`${r.roomName} · ${startLabel}–${endLabel}${r.description ? ' · ' + r.description : ''}`}
                    >
                      {isSingleDay ? (
                        isVeryShort ? (
                          <p className="text-[11px] font-bold truncate leading-none mt-0.5">{r.roomName}</p>
                        ) : isShort ? (
                          <div className="py-0.5">
                            <p className="text-[12px] font-bold truncate leading-tight">{r.roomName}</p>
                            <p className="text-[11px] opacity-90 leading-tight">{startLabel}–{endLabel}</p>
                          </div>
                        ) : (
                          <div className="py-1">
                            <p className="text-[13px] font-bold truncate leading-snug">{r.roomName}</p>
                            <p className="text-[11px] opacity-90 leading-snug">{startLabel} – {endLabel}</p>
                            {r.description && durationH >= 0.75 && (
                              <p className="text-[11px] opacity-75 leading-snug truncate">{r.description}</p>
                            )}
                            {r.userName && !isOwn && durationH >= 1 && (
                              <p className="text-[11px] opacity-70 leading-snug truncate">{r.userName}</p>
                            )}
                          </div>
                        )
                      ) : (
                        <>
                          <p className="text-[9px] font-bold truncate leading-tight mt-0.5">{r.roomName}</p>
                          {!isShort && <p className="text-[9px] truncate opacity-90 leading-tight">{startLabel}–{endLabel}</p>}
                          {!isShort && r.userName && !isOwn && (
                            <p className="text-[9px] truncate opacity-75 leading-tight">{r.userName}</p>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
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
