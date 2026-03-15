import { Reservation } from './types';

interface CalendarGridProps {
  reservations: Reservation[];
  weekOffset: number;
  onReservationClick: (r: Reservation) => void;
  currentUserId: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 - 19:00

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

export default function CalendarGrid({
  reservations,
  weekOffset,
  onReservationClick,
  currentUserId,
}: CalendarGridProps) {
  const weekDates = getWeekDates(weekOffset);

  const getReservationsForDayHour = (day: Date, hour: number) => {
    return reservations.filter((r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      return (
        start.toDateString() === day.toDateString() &&
        startHour <= hour &&
        endHour > hour &&
        r.status === 'active'
      );
    });
  };

  return (
    <div className="overflow-auto h-full">
      <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '600px' }}>
        {/* Header */}
        <div className="border-b border-r border-gray-100 h-8" />
        {weekDates.map((day, i) => (
          <div
            key={i}
            className="border-b border-r border-gray-100 h-8 flex flex-col items-center justify-center"
          >
            <span className="text-[10px] font-semibold text-gray-500">{DAYS[i]}</span>
            <span
              className={`text-[10px] font-bold ${
                day.toDateString() === new Date().toDateString()
                  ? 'text-purple-600'
                  : 'text-gray-700'
              }`}
            >
              {day.getDate()}.{day.getMonth() + 1}.
            </span>
          </div>
        ))}

        {/* Time rows */}
        {HOURS.map((hour) => (
          <>
            <div
              key={`h${hour}`}
              className="border-b border-r border-gray-100 h-10 flex items-start justify-end pr-1 pt-0.5"
            >
              <span className="text-[9px] text-gray-400">{hour}:00</span>
            </div>
            {weekDates.map((day, di) => {
              const slots = getReservationsForDayHour(day, hour);
              return (
                <div
                  key={`${hour}-${di}`}
                  className="border-b border-r border-gray-100 h-10 relative"
                >
                  {slots.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onReservationClick(r)}
                      className={`absolute inset-x-0.5 top-0.5 bottom-0.5 rounded text-[9px] font-semibold px-1 truncate text-left transition-opacity hover:opacity-80 ${
                        r.userId === currentUserId
                          ? 'bg-purple-500 text-white'
                          : 'bg-blue-300 text-blue-900'
                      }`}
                      title={`${r.roomName} — ${r.description ?? ''}`}
                    >
                      {r.roomName}
                    </button>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
