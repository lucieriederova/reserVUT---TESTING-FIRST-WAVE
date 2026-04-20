import { useState } from 'react';
import { GraduationCap, Briefcase, Compass, ShieldCheck } from 'lucide-react';
import { UserRole } from './types';

interface LoginViewProps {
  onLogin: (email: string, password: string, role: UserRole) => Promise<void>;
  onShowSignUp: () => void;
  error?: string;
}

const ROLE_OPTIONS = [
  { role: 'STUDENT' as UserRole, label: 'STUDENT', icon: GraduationCap },
  { role: 'CEO' as UserRole, label: 'LEADER', icon: Briefcase },
  { role: 'GUIDE' as UserRole, label: 'GUIDE', icon: Compass },
  { role: 'HEAD_ADMIN' as UserRole, label: 'HEAD ADMIN', icon: ShieldCheck },
];

export default function LoginView({ onLogin, onShowSignUp, error }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gray-100 flex flex-col relative font-sans">
      {/* reserVUT badge - Sjednocená velikost s SignUp stránkou */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className="bg-[#8b5cf6] text-white text-lg font-bold px-6 py-2.5 rounded-full shadow-sm tracking-tight">
          reserVUT
        </span>
        <div className="relative group">
          <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-purple-200 transition-colors">
            i
          </div>
          <div className="absolute right-0 top-10 w-64 bg-white border border-gray-100 rounded-xl shadow-xl p-4 text-xs text-gray-600 hidden group-hover:block z-50">
            <p className="font-bold text-[#8b5cf6] mb-1">reserVUT</p>
            <p className="leading-relaxed">
              Rezervační systém pro fakultu. Umožňuje studentům, průvodcům a vedoucím rezervovat místnosti pro různé účely.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-10">
          {/* Logo VUT FP */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1">
              <span className="bg-[#d32f2f] text-white font-bold text-xl px-2.5 py-1 rounded">T</span>
              <span className="bg-[#e0e0e0] text-gray-700 font-bold text-xl px-2.5 py-1 rounded">FP</span>
            </div>
          </div>

          <h1 className="text-center text-xl font-extrabold text-gray-800 mb-8 tracking-tight">WELCOME</h1>

          {/* Role selector - Nahrazeno Lucide ikonami */}
          <div className="flex justify-center gap-4 mb-8">
            {ROLE_OPTIONS.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`flex flex-col items-center justify-center gap-2 w-24 h-24 rounded-xl transition-all border-2 ${
                  selectedRole === role
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm'
                    : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                }`}
              >
                <Icon size={32} strokeWidth={selectedRole === role ? 2 : 1.5} />
                <span className={`text-[10px] font-bold tracking-tight text-center leading-tight uppercase ${
                  selectedRole === role ? 'text-purple-700' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Email input */}
          <div className="mb-4">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@vut.cz"
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            />
          </div>

          {/* Password input */}
          <div className="mb-6">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 pr-10 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-4 text-center font-medium bg-red-50 py-2 rounded-md">{error}</p>
          )}

          {/* Sign In button */}
          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm uppercase tracking-wide"
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          {/* Sign up link */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <button onClick={onShowSignUp} className="text-[#8b5cf6] hover:underline font-bold transition-all">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}