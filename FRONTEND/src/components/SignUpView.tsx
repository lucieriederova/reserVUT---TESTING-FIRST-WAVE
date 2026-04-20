import { useState } from 'react';

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative font-sans">
      {/* reserVUT badge - Opravená velikost a padding podle Login screenu */}
      <div className="absolute top-6 right-6">
        <span className="bg-[#8b5cf6] text-white text-lg font-bold px-6 py-2.5 rounded-full shadow-sm tracking-tight">
          reserVUT
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
          {/* Logo T FP */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1">
              <span className="bg-[#d32f2f] text-white font-bold text-xl px-2.5 py-1 rounded">T</span>
              <span className="bg-[#e0e0e0] text-gray-700 font-bold text-xl px-2.5 py-1 rounded">FP</span>
            </div>
          </div>

          <h1 className="text-center text-xl font-extrabold text-gray-800 mb-8 tracking-tight">SIGN UP</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">NAME</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">SURNAME</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                E-MAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@vut.cz"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                REPEAT PASSWORD
              </label>
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                  passwordMismatch
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-200 focus:ring-purple-400'
                }`}
              />
              {passwordMismatch && (
                <p className="text-red-500 text-[11px] mt-1.5 font-medium">Passwords do not match</p>
              )}
            </div>
          </div>

          {displayError && (
            <p className="text-red-500 text-xs mt-4 text-center font-medium">{displayError}</p>
          )}

          <button
            onClick={handleSignUp}
            disabled={loading || passwordMismatch}
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm mt-8 uppercase tracking-wide"
          >
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-[#8b5cf6] hover:underline font-bold transition-all">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}