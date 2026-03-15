import { Reservation } from './types';

interface ReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
}

export default function ReservationModal({ reservation, onClose }: ReservationModalProps) {
  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const formatDate = (d: Date) =>
    `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none"
        >
          ×
        </button>

        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
          RESERVATION INFO
        </h2>

        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            DESCRIPTION OF USE
          </label>
          <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 min-h-[40px] bg-gray-50">
            {reservation.description || <span className="text-gray-400 italic">No description</span>}
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">ROOM</label>
          <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50">
            {reservation.roomName}
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">TIME</label>
          <div className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50">
            {formatTime(start)}–{formatTime(end)} | {formatDate(start)}
          </div>
        </div>

        {reservation.userName && (
          <div className="mt-2 text-xs text-gray-400 text-right">
            Reserved by: {reservation.userName}
          </div>
        )}
      </div>
    </div>
  );
}
