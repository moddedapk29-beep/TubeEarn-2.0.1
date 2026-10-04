import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Sparkles, User, Tv } from 'lucide-react';

interface GoogleAuthFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'user' | 'creator';
  onSelectGoogleAccount: (account: { email: string; name: string; photoURL?: string }) => void;
  isSubmitting?: boolean;
}

export const GoogleAuthFallbackModal: React.FC<GoogleAuthFallbackModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onSelectGoogleAccount,
  isSubmitting = false
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isUsingCustom, setIsUsingCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Primary Google Account from active environment
  const primaryAccount = {
    email: 'moddedapk29@gmail.com',
    name: 'Google User',
    photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
  };

  const handleSelectPrimary = () => {
    onSelectGoogleAccount(primaryAccount);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const derivedName = customName.trim() || customEmail.split('@')[0].replace(/[._-]/g, ' ');
    onSelectGoogleAccount({
      email: customEmail.trim().toLowerCase(),
      name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=4285F4&color=fff`
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Google Logo */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Sign in with Google</h3>
              <p className="text-xs text-slate-400">
                Authenticate as <strong className="text-white capitalize">{targetRole === 'user' ? 'Earner' : 'Creator Studio'}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Google login automatically assigns your official <strong>{targetRole === 'user' ? 'USR-XXXXXX' : 'CRT-XXXXXX'} ID</strong> with starter balance.
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!isUsingCustom ? (
            <div className="space-y-3">
              {/* Active Account Button */}
              <button
                type="button"
                onClick={handleSelectPrimary}
                disabled={isSubmitting}
                className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    M
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block group-hover:text-blue-400 transition-colors">
                      {primaryAccount.email}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Active Account &bull; Click to Sign In
                    </span>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Or switch to custom input */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsUsingCustom(true)}
                  className="text-xs text-slate-400 hover:text-white transition-colors underline"
                >
                  Use another Google account...
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Kumar"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsUsingCustom(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to quick account
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Continue with Google</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
