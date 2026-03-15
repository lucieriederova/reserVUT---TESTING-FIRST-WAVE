import { useState } from 'react';
import { UserRole } from './types';

interface LoginViewProps {
  onLogin: (email: string, password: string, role: UserRole) => Promise<void>;
  onShowSignUp: () => void;
  error?: string;
}

const ROLE_OPTIONS: { role: UserRole; label: string; icon: string }[] = [
  { role: 'STUDENT', label: 'STUDENT', icon: '🎓' },
  { role: 'CEO', label: 'CEO', icon: '👔' },
  { role: 'GUIDE', label: 'GUIDE', icon: '🧭' },
  { role: 'HEAD_ADMIN', label: 'HEAD ADMIN', icon: '🛡️' },
];

export default function LoginView({ onLogin, onShowSignUp, error }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
  };

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await onLogin(email, password, selectedRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* reserVUT badge top right */}
      <div className="absolute top-4 right-4">
        <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          reserVUT
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1">
              <span className="bg-red-600 text-white font-bold text-lg px-2 py-1 rounded">T</span>
              <span className="bg-gray-200 text-gray-700 font-bold text-lg px-2 py-1 rounded">FP</span>
            </div>
          </div>

          <h1 className="text-center text-xl font-bold text-gray-800 mb-6">WELCOME</h1>

          {/* Role selector */}
          <div className="flex justify-center gap-3 mb-6">
          {ROLE_OPTIONS.map(({ role, label, icon }) => (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              className={`flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-lg transition-all ${
                selectedRole === role
                  ? 'bg-purple-100 ring-2 ring-purple-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight max-w-[48px]">
                {label}
              </span>
            </button>
          ))}
        </div>

          {/* Email */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@vut.cz"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
          )}

          {/* Sign In button */}
          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          {/* Sign up link */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{' '}
            <button onClick={onShowSignUp} className="text-purple-600 hover:underline font-medium">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
