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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* reserVUT badge */}
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

          <h1 className="text-center text-xl font-bold text-gray-800 mb-6">SIGN UP</h1>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">NAME</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">SURNAME</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                E-MAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@vut.cz"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                REPEAT PASSWORD
              </label>
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  passwordMismatch
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-300 focus:ring-purple-400'
                }`}
              />
              {passwordMismatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          {displayError && (
            <p className="text-red-500 text-xs mt-3 text-center">{displayError}</p>
          )}

          <button
            onClick={handleSignUp}
            disabled={loading || passwordMismatch}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm mt-5"
          >
            {loading ? 'SIGNING UP...' : 'SIGN IN'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-purple-600 hover:underline font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
