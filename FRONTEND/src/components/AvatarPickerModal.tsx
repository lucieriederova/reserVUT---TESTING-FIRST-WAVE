import { 
  User, 
  UserCircle, 
  UserRound, 
  CircleUserRound, 
  Contact, 
  UserSquare, 
  UserRoundSearch, 
  CircleUser 
} from 'lucide-react';

interface AvatarPickerModalProps {
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

// Definice ikon jako komponent, které nahrazují původní AVATARS pole
const AVATAR_ICONS = [
  User, 
  UserCircle, 
  UserRound, 
  CircleUserRound, 
  Contact, 
  UserSquare, 
  UserRoundSearch, 
  CircleUser
];

export default function AvatarPickerModal({ currentIndex, onSelect, onClose }: AvatarPickerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
          Choose Avatar
        </h3>

        <div className="grid grid-cols-4 gap-4">
          {AVATAR_ICONS.map((Icon, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); onClose(); }}
              className={`flex items-center justify-center aspect-square rounded-xl transition-all border-2 ${
                currentIndex === i 
                  ? 'border-purple-500 bg-purple-50 text-purple-600 shadow-sm' 
                  : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <Icon size={28} strokeWidth={currentIndex === i ? 2 : 1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Exportujeme ikony pro použití v profilu uživatele
export { AVATAR_ICONS };
export const AVATARS = AVATAR_ICONS;