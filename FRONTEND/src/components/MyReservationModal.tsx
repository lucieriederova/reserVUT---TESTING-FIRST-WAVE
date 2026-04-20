import { useState } from 'react';
import { Reservation } from './types';

interface MyReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
  onCancel: () => Promise<void>;
}

export default function MyReservationModal({ reservation, onClose, onCancel }: MyReservationModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const formatDate = (d: Date) =>
    `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

  const handleCancel = async () => {
    if (!confirming) { setConfirming(true); return; }
    setLoading(true);
    try { await onCancel(); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>

        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">MY RESERVATION</h2>

        <div className="mb-3">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">DESCRIPTION OF USE</label>
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

        {reservation.type && (
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">TYPE</label>
            <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50">
              {reservation.type}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">TIME</label>
          <div className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50">
            {formatTime(start)} – {formatTime(end)} · {formatDate(start)}
          </div>
        </div>

        {confirming ? (
          <div className="space-y-2">
            <p className="text-xs text-red-600 text-center font-semibold mb-1">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                KEEP IT
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'CANCELLING...' : 'YES, CANCEL'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleCancel}
            className="w-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
          >
            CANCEL RESERVATION
          </button>
        )}
      </div>
    </div>
  );
}
