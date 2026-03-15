interface AvatarPickerModalProps {
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

// 8 avatar emoji options
const AVATARS = ['🧑‍🎓', '👩‍💻', '🧑‍🔬', '👨‍🏫', '🧕', '🧑‍🎨', '🧑‍⚕️', '🧑‍💼'];

export default function AvatarPickerModal({ currentIndex, onSelect, onClose }: AvatarPickerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-72 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none"
        >
          ×
        </button>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
          CHOOSE AVATAR
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((avatar, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); onClose(); }}
              className={`text-3xl p-2 rounded-xl transition-all hover:bg-purple-50 ${
                currentIndex === i ? 'ring-2 ring-purple-500 bg-purple-50' : 'bg-gray-50'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { AVATARS };
