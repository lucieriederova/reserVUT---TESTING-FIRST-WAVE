import { Reservation } from './types';

interface MyReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
  onCancel: () => Promise<void>;
}

export default function MyReservationModal({ reservation, onClose, onCancel }: MyReservationModalProps) {
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
          MY RESERVATION
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
          <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50 flex items-center justify-between">
            <span>{reservation.roomName}</span>
            <span className="text-gray-400">▼</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">TIME</label>
          <div className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50">
            {formatTime(start)} – {formatTime(end)} | {formatDate(start)}
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
        >
          CANCEL RESERVATION
        </button>
      </div>
    </div>
  );
}
