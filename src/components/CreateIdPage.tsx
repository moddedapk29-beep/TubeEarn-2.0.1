import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { PlatformType, UserRole } from '../types';
import { 
  User, 
  Tv, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ArrowRight, 
  Gift, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Play,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateIdPageProps {
  initialRole?: 'user' | 'creator';
  onNavigateToLogin: (role?: 'user' | 'creator', prefilledId?: string) => void;
  onNavigateToHome: () => void;
}

export const CreateIdPage: React.FC<CreateIdPageProps> = ({
  initialRole = 'user',
  onNavigateToLogin,
  onNavigateToHome
}) => {
  const { registerNewAccount, registeredAccounts, signOutRole } = useApp();

  const [role, setRole] = useState<'user' | 'creator'>(initialRole);
  const [customIdSuffix, setCustomIdSuffix] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [referralCode, setReferralCode] = useState<string>('');
  
  // Creator specific
  const [channelName, setChannelName] = useState<string>('');
  const [handle, setHandle] = useState<string>('');
  const [platform, setPlatform] = useState<PlatformType>('youtube');

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdResult, setCreatedResult] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    walletBalance: number;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Generate random 6-digit ID preview on mount or role change
  const generateRandomSuffix = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  useEffect(() => {
    setCustomIdSuffix(generateRandomSuffix());
    // Auto-fill incoming referral code from URL/localStorage if present
    const incomingRef = localStorage.getItem('tubeearn_incoming_ref');
    if (incomingRef) {
      setReferralCode(incomingRef);
    }
  }, [role]);

  const currentPrefix = role === 'user' ? 'USR-' : 'CRT-';
  const fullGeneratedId = `${currentPrefix}${customIdSuffix.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

  const handleRandomizeId = () => {
    setCustomIdSuffix(generateRandomSuffix());
  };

  const handleQuickFillEarner = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setRole('user');
    setName(`Kavita Verma`);
    setEmail(`kavita.verma${randomNum}@gmail.com`);
    setPassword('TubeEarn#123');
    setConfirmPassword('TubeEarn#123');
    setCustomIdSuffix(generateRandomSuffix());
    setReferralCode('EARN-AARAV');
    setErrorMessage(null);
  };

  const handleQuickFillCreator = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setRole('creator');
    setName(`Rohan Tech Studio`);
    setEmail(`rohan.creator${randomNum}@youtube.com`);
    setPassword('StudioPass#123');
    setConfirmPassword('StudioPass#123');
    setChannelName(`Rohan Tech Reviews`);
    setHandle(`@rohantech${randomNum}`);
    setPlatform('youtube');
    setCustomIdSuffix(generateRandomSuffix());
    setReferralCode('STUDIO-PRIYA');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full legal or brand name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password && password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-check.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerNewAccount({
        role,
        name,
        email,
        password,
        customUserId: fullGeneratedId,
        referralCode: referralCode.trim() || undefined,
        channelName: role === 'creator' ? (channelName.trim() || `${name} Channel`) : undefined,
        handle: role === 'creator' ? (handle.trim() || `@${name.replace(/\s+/g, '').toLowerCase()}`) : undefined,
        platform: role === 'creator' ? platform : undefined
      });

      if (res.success && res.user) {
        setCreatedResult({
          id: res.customUserId || fullGeneratedId,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          walletBalance: res.user.walletBalance
        });
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (createdResult) {
      navigator.clipboard.writeText(createdResult.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // If already created successfully, show celebratory result card
  if (createdResult) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block uppercase tracking-wider">
              {createdResult.role === 'user' ? 'Earner ID Activated' : 'Creator Studio ID Activated'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Welcome, {createdResult.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Your official TubeEarn account is registered and ready. Keep your unique ID safe to log in across devices.
            </p>
          </div>

          {/* Assigned ID Highlight Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Your Official Unique ID</span>
              <span className="font-mono text-emerald-400">Save This ID</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-widest">
                {createdResult.id}
              </span>
              <button
                onClick={handleCopyId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Registered Email</span>
                <span className="font-mono font-semibold text-slate-200 truncate block">{createdResult.email}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Starting Balance</span>
                <span className="font-mono font-bold text-emerald-400 block">₹{createdResult.walletBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onNavigateToHome}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <span>Launch My {createdResult.role === 'user' ? 'Earner' : 'Creator'} Portal Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                signOutRole(createdResult.role);
                onNavigateToLogin(createdResult.role, createdResult.id);
              }}
              className="w-full py-2.5 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Log Out &amp; Test Login with ID: {createdResult.id}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6">
      
      {/* Return Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onNavigateToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Already have an ID?</span>
          <button
            onClick={() => onNavigateToLogin(role)}
            className="text-xs font-bold text-red-400 hover:text-red-300 underline"
          >
            Sign In with ID
          </button>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Title & Tagline */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Unique ID Provisioning
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Create New ID &bull; {role === 'user' ? 'Earner Account' : 'Creator Studio'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Generate your permanent unique ID to participate in compliant video feedback tasks, escrow deposits, and real UPI withdrawals.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setRole('user');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 border ${
              role === 'user'
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Earner ID (USR-)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('creator');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 border ${
              role === 'creator'
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-900'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            <span>Creator Studio ID (CRT-)</span>
          </button>
        </div>

        {/* Dynamic ID Generator Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-950 to-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Auto-Generated {role === 'user' ? 'User' : 'Creator'} ID Preview
              </span>
              <p className="text-[11px] text-slate-400">
                You can randomize or customize the 6-character suffix below.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomizeId}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Randomize ID</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono">
            <span className={`text-base font-black px-2 py-1 rounded-lg ${
              role === 'user' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {currentPrefix}
            </span>
            <input
              type="text"
              maxLength={8}
              value={customIdSuffix}
              onChange={e => setCustomIdSuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. 849201"
              className="bg-transparent text-white font-bold text-base focus:outline-none flex-1 tracking-wider"
            />
            <span className="text-[10px] text-slate-500 uppercase font-sans">Customizable Suffix</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Official Identifier: <strong className="text-white font-mono">{fullGeneratedId}</strong></span>
            <span className="text-emerald-400 font-medium">✓ Available &amp; Verified</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {role === 'user' ? 'Full Legal Name' : 'Studio / Creator Name'} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={role === 'user' ? 'e.g. Kavita Verma' : 'e.g. Rohan Tech Studio'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Creator specific fields */}
          {role === 'creator' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20">
              <div>
                <label className="block text-[11px] font-bold text-rose-300 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as PlatformType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-300 mb-1">Channel / Page Title</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={e => setChannelName(e.target.value)}
                  placeholder="e.g. Tech Reviews India"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-300 mb-1">Handle</label>
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="e.g. @techreviews"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* Password fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Password <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 4 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Referral Code (Earners get ₹5 welcome credit & referrer gets ₹2) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-950 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                Referral Code (Optional)
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                +₹5.00 WELCOME BONUS
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. EARN-AARAV or STUDIO-PRIYA"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono tracking-wider placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setReferralCode(role === 'creator' ? 'STUDIO-PRIYA' : 'EARN-AARAV')}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Apply Demo Ref
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Applying a friend's referral code credits <strong className="text-emerald-300">₹2.00 onboarding reward</strong> to them immediately and adds <strong className="text-emerald-300">₹5.00 welcome bonus</strong> to your new wallet!
            </p>
          </div>

          {/* Policy & Terms disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            By creating an account, you agree to TubeEarn's Terms of Service and Anti-Fraud Policy. Artificial views, botting, and duplicate accounts are strictly blocked via AI thinking verification.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 text-white font-black rounded-xl text-sm transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 ${
              role === 'user'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/20'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating {role === 'user' ? 'Earner' : 'Creator'} ID...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Register &amp; Claim ID: {fullGeneratedId}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Test Autofills */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block text-center">
            Developer &amp; Tester Fast Provisioning
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickFillEarner}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-red-500/20 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>⚡ 1-Click Autofill New Earner</span>
            </button>

            <button
              type="button"
              onClick={handleQuickFillCreator}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>⚡ 1-Click Autofill New Creator</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
