import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Zap, 
  ArrowRight, 
  Layers, 
  Eye, 
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onReturnToApp: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onReturnToApp
}) => {
  const { loginAsAdmin } = useApp();

  const [adminId, setAdminId] = useState<string>('ADM-SUPER-2026');
  const [adminPassword, setAdminPassword] = useState<string>('ADMIN2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tubeearn.app';
  const separateAdminLink = `${origin}/?portal=admin`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(separateAdminLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText('ADM-SUPER-2026');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText('ADMIN2026');
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginAsAdmin(adminPassword, adminId);
      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        onSuccess();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAutofillAndLogin = async () => {
    setAdminId('ADM-SUPER-2026');
    setAdminPassword('ADMIN2026');
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = await loginAsAdmin('ADMIN2026', 'ADM-SUPER-2026');
    setIsSubmitting(false);
    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      onSuccess();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      
      {/* Return button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onReturnToApp}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Marketplace</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          STRICT ADMIN ACCESS
        </span>
      </div>

      {/* Main Admin Gate Card */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              CENTRAL EXECUTIVE ADMINISTRATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Administrator Access Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              This panel is strictly isolated from users and creators. Access requires your designated Admin ID and security password.
            </p>
          </div>
        </div>

        {/* Separate Link Showcase Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Dedicated Separate Admin Link
            </span>
            <span className="text-[10px] font-mono text-slate-400">Direct Bookmark URL</span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <code className="text-xs text-amber-400 font-mono truncate select-all">
              {separateAdminLink}
            </code>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 shadow"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Bookmark or share this direct URL. Regular earners and creators have no access or view of the admin panel.
          </p>
        </div>

        {/* Credentials Reference Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs">
          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Admin ID</span>
              <span className="font-mono font-black text-white text-sm">ADM-SUPER-2026</span>
            </div>
            <button
              onClick={handleCopyId}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Copy Admin ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Admin Password</span>
              <span className="font-mono font-black text-amber-400 text-sm">ADMIN2026</span>
            </div>
            <button
              onClick={handleCopyPassword}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Copy Admin Password"
            >
              {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Login Form with ID and Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Administrator ID <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                placeholder="e.g. ADM-SUPER-2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Administrator Password / Passkey <span className="text-amber-400">*</span>
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
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="Enter admin password (e.g. ADMIN2026)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white font-mono tracking-wider placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Verify Credentials &amp; Unlock Admin Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Fast Fill for Testing */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={handleQuickAutofillAndLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>⚡ 1-Click Fill Credentials &amp; Enter</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
              ADM-SUPER-2026 / ADMIN2026
            </span>
          </button>
        </div>

      </div>

    </div>
  );
};
