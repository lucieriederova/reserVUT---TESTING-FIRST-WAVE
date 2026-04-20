import { useState } from 'react';
import { User } from './types';
import AvatarPickerModal, { AVATARS } from './AvatarPickerModal';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
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
              className="text-4xl w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors"
              title="Change avatar"
            >
              {AVATARS[avatarIndex]}
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
              {AVATARS.slice(0, 4).map((a, i) => (
                <button
                  key={i}
                  onClick={() => onUpdate({ avatarIndex: i })}
                  className={`text-2xl p-1 rounded-lg transition-all ${
                    avatarIndex === i ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-100'
                  }`}
                >
                  {a}
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
