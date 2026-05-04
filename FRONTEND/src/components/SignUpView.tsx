import { useState } from 'react';
import esbdLogo from '../assets/esbdlogo.png';

interface SignUpViewProps {
  onSignUp: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onBackToLogin: () => void;
  error?: string;
}

export default function SignUpView({ onSignUp, onBackToLogin, error }: SignUpViewProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const passwordMismatch = repeatPassword.length > 0 && password !== repeatPassword;

  const handleSignUp = async () => {
    if (passwordMismatch || !firstName || !lastName || !email || !password) {
      setLocalError('Please fill in all fields correctly.');
      return;
    }
    setLocalError('');
    setLoading(true);
    try {
      await onSignUp({ firstName, lastName, email, password });
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
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
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative font-sans">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <div className="flex flex-col items-center">
          <span className="bg-[#9333ea] text-white text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl shadow-sm tracking-tight">
            reser<span className="font-extrabold">VUT</span>
          </span>
          <span className="text-[#9333ea] text-[10px] font-bold tracking-widest mt-1">BY LSSL</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pt-16 sm:pt-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 sm:p-8">
          <div className="flex justify-center mb-2">
            <img src={esbdLogo} alt="ESBD" className="h-28 object-contain" />
          </div>

          <h1 className="text-center text-xl font-extrabold text-gray-800 mb-6 tracking-tight">SIGN UP</h1>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">NAME</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">SURNAME</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">E-MAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@vut.cz"
              className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            />
          </div>

          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 pr-10 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">REPEAT PASSWORD</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              className={`w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                passwordMismatch
                  ? 'border-red-400 focus:ring-red-300 bg-red-50'
                  : 'border-gray-200 focus:ring-purple-400'
              }`}
            />
            {passwordMismatch && (
              <p className="text-red-500 text-[11px] mt-1.5 font-medium">Passwords do not match</p>
            )}
          </div>

          {displayError && (
            <p className="text-red-500 text-xs mb-4 text-center font-medium bg-red-50 py-2.5 px-3 rounded-lg">{displayError}</p>
          )}

          <button
            onClick={handleSignUp}
            disabled={loading || passwordMismatch}
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] active:bg-[#7e22ce] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm uppercase tracking-wide"
          >
            {loading ? 'SIGNING UP...' : 'CREATE ACCOUNT'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-5">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-[#9333ea] hover:underline font-bold transition-all">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
