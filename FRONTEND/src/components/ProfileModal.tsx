import { useState } from 'react';
import { User } from './types';
import AvatarPickerModal, { AVATARS } from './AvatarPickerModal';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
  onLogout?: () => void;
}

export default function ProfileModal({ user, onClose, onUpdate, onLogout }: ProfileModalProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarIndex = user.avatarIndex ?? 0;

  const roleLabel: Record<string, string> = {
    STUDENT: 'STUDENT',
    CEO: 'LEADER',
    GUIDE: 'GUIDE',
    HEAD_ADMIN: 'HEAD ADMIN',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>

          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
            EDIT PROFILE
          </h2>

          {/* Avatar + user info */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="text-4xl w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors text-purple-600"
              title="Change avatar"
            >
              {(() => { const Icon = AVATARS[avatarIndex]; return <Icon size={28} />; })()}
            </button>
            <div>
              <p className="font-bold text-sm text-gray-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <p className="text-xs font-semibold text-purple-600">{roleLabel[user.role]}</p>
            </div>
          </div>

          {/* Choose avatar row */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">CHOOSE AVATAR</p>
            <div className="flex gap-2">
              {AVATARS.slice(0, 4).map((Icon, i) => (
                <button
                  key={i}
                  onClick={() => onUpdate({ avatarIndex: i })}
                  className={`p-1 rounded-lg transition-all flex items-center justify-center ${
                    avatarIndex === i ? 'ring-2 ring-purple-500 bg-purple-50 text-purple-600' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon size={24} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAvatarPicker(true)}
            className="text-xs text-purple-600 hover:underline"
          >
            Show all avatars →
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-5 w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-red-500 hover:text-red-600 py-2.5 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          )}
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPickerModal
          currentIndex={avatarIndex}
          onSelect={(i) => onUpdate({ avatarIndex: i })}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </>
  );
}
