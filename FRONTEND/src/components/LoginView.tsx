import { useState } from 'react';
import esbdLogo from '../assets/esbdlogo.png';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onShowSignUp: () => void;
  error?: string;
  signUpSuccessEmail?: string;
}

export default function LoginView({ onLogin, onShowSignUp, error, signUpSuccessEmail }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative font-sans">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <div className="flex flex-col items-center">
          <span className="bg-[#9333ea] text-white text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl shadow-sm tracking-tight">
            reser<span className="font-extrabold">VUT</span>
          </span>
          <span className="text-[#9333ea] text-[10px] font-bold tracking-widest mt-1">BY LSSL</span>
        </div>
        <div className="relative group">
          <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-purple-200 transition-colors">
            i
          </div>
          <div className="absolute right-0 top-10 w-60 bg-white border border-gray-100 rounded-xl shadow-xl p-4 text-xs text-gray-600 hidden group-hover:block z-50">
            <p className="text-[#9333ea] mb-1">reser<span className="font-extrabold">VUT</span> <span className="text-[9px] font-bold tracking-widest">BY LSSL</span></p>
            <p className="leading-relaxed">
              Rezervační systém pro fakultu. Umožňuje studentům, průvodcům a vedoucím rezervovat místnosti.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pt-16 sm:pt-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 sm:p-10">
          <div className="flex justify-center mb-2">
            <img src={esbdLogo} alt="ESBD" className="h-28 object-contain" />
          </div>

          <h1 className="text-center text-xl font-extrabold text-gray-800 mb-8 tracking-tight">WELCOME</h1>

          <div className="mb-4">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@vut.cz"
              className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 pr-10 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1"
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

          {signUpSuccessEmail && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
              <p className="text-green-700 text-xs font-bold mb-0.5">Registration successful!</p>
              <p className="text-green-600 text-xs">We sent a confirmation link to <span className="font-semibold">{signUpSuccessEmail}</span>. Click it, then sign in here.</p>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs mb-4 text-center font-medium bg-red-50 py-2.5 px-3 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] active:bg-[#7e22ce] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm uppercase tracking-wide"
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-5">
            Don't have an account?{' '}
            <button onClick={onShowSignUp} className="text-[#9333ea] hover:underline font-bold transition-all">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
