import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  Play, 
  Wallet, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Tv, 
  Layers, 
  CheckCircle2, 
  Share2, 
  FileCheck,
  Terminal,
  LogOut,
  Sparkles,
  KeyRound,
  Lock,
  Gift,
  Copy,
  Check
} from 'lucide-react';

interface NavbarProps {
  onOpenWallet: () => void;
  onOpenKyc: () => void;
  onOpenSocials: () => void;
  onOpenTests: () => void;
  onOpenAuth: (role?: 'user' | 'creator' | 'admin') => void;
  onOpenReferral?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWallet,
  onOpenKyc,
  onOpenSocials,
  onOpenTests,
  onOpenAuth,
  onOpenReferral
}) => {
  const { 
    currentUser, 
    currentRole, 
    setCurrentRole, 
    signInWithGoogle, 
    signOut, 
    signOutRole,
    isRoleAuthenticated,
    isGoogleLoading 
  } = useApp();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [copiedLinkRole, setCopiedLinkRole] = useState<'user' | 'creator' | 'admin' | null>(null);

  const copyDirectLink = (role: 'user' | 'creator' | 'admin') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tubeearn.app';
    const url = `${origin}/?portal=${role}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkRole(role);
    setTimeout(() => setCopiedLinkRole(null), 2000);
  };

  const handlePortalSwitch = (targetRole: 'user' | 'creator' | 'admin') => {
    if (targetRole === 'admin') {
      if (!isRoleAuthenticated('admin')) {
        onOpenAuth('admin');
        return;
      }
    } else if (targetRole === 'creator') {
      if (!isRoleAuthenticated('creator')) {
        onOpenAuth('creator');
        return;
      }
    }
    setCurrentRole(targetRole);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Tube<span className="text-red-500">Earn</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Compliant
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Creator Engagement & Reward Marketplace</p>
            </div>
          </div>

          {/* Center Navigation: Scoped per Role, Admin Gets Full Access */}
          {currentRole === 'admin' ? (
            <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-amber-500/40 shadow-lg shadow-amber-500/5">
              <span className="px-2 py-0.5 text-[9px] font-black text-amber-400 font-mono tracking-wider flex items-center gap-1 border-r border-slate-800 mr-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                FULL ACCESS:
              </span>
              <button
                onClick={() => setCurrentRole('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentRole === 'admin' 
                    ? 'bg-amber-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Admin Hub</span>
              </button>
              <button
                onClick={() => setCurrentRole('user')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
                title="Inspect Earner Dashboard with Admin privileges"
              >
                <User className="w-3.5 h-3.5" />
                <span>Inspect User Earn</span>
              </button>
              <button
                onClick={() => setCurrentRole('creator')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
                title="Inspect Creator Studio with Admin privileges"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Inspect Creator Studio</span>
              </button>
            </div>
          ) : currentRole === 'creator' ? (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-400 text-xs font-bold shadow-sm">
              <Tv className="w-4 h-4 text-rose-400" />
              <span>Creator Studio Portal</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 ml-1">
                Escrow Active
              </span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold shadow-sm">
              <User className="w-4 h-4 text-red-400" />
              <span>Earner Rewards Portal</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 ml-1">
                Min. ₹299 Payout
              </span>
            </div>
          )}

          {/* Right Action Icons & Wallet */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Refer & Earn ₹2+₹2 Button */}
            {onOpenReferral && (
              <button
                onClick={onOpenReferral}
                title="Refer & Earn ₹2 on onboarding + ₹2 on first task"
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
              >
                <Gift className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Refer &amp; Earn</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                  ₹2+₹2
                </span>
              </button>
            )}

            {/* Separate Logins Portal Button */}
            <div className="relative">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Separate logins for Earner and Creator"
              >
                <KeyRound className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden lg:inline">Portals &amp; Logins</span>
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1.5 animate-in fade-in">
                  <div className="p-2 border-b border-slate-800 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Logged In As</span>
                    <span className="text-xs font-bold text-white block truncate">{currentUser.name}</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] font-mono text-emerald-400 block uppercase">[{currentRole} portal]</span>
                      {currentUser.customUserId && (
                        <span className="text-[10px] font-mono text-slate-400 block">ID: {currentUser.customUserId}</span>
                      )}
                    </div>
                  </div>

                  {/* Earner Portal Login & Direct Link */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuth('user');
                      }}
                      className="flex-1 p-2 rounded-xl text-left text-xs font-semibold hover:bg-red-600/10 text-slate-300 hover:text-red-400 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-4 h-4 text-red-500 shrink-0" />
                      <div className="truncate">
                        <span className="block font-bold">Earner Portal Login</span>
                        <span className="text-[10px] text-slate-500 font-mono">USR-ID &bull; Watch &amp; Earn</span>
                      </div>
                    </button>
                    <button
                      onClick={() => copyDirectLink('user')}
                      title="Copy Earner Portal Direct Link"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {copiedLinkRole === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Creator Studio Login & Direct Link */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuth('creator');
                      }}
                      className="flex-1 p-2 rounded-xl text-left text-xs font-semibold hover:bg-rose-600/10 text-slate-300 hover:text-rose-400 flex items-center gap-2 transition-colors"
                    >
                      <Tv className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="truncate">
                        <span className="block font-bold">Creator Studio Login</span>
                        <span className="text-[10px] text-slate-500 font-mono">CRT-ID &bull; 1,000+ Escrow</span>
                      </div>
                    </button>
                    <button
                      onClick={() => copyDirectLink('creator')}
                      title="Copy Creator Studio Direct Link"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {copiedLinkRole === 'creator' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* STRICT ACCESS CONTROL: Only show Admin Hub to Authenticated Admins! Users and creators NEVER see this */}
                  {isRoleAuthenticated('admin') && (
                    <div className="pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            setCurrentRole('admin');
                          }}
                          className="flex-1 p-2 rounded-xl text-left text-xs font-semibold hover:bg-amber-600/10 text-amber-300 flex items-center gap-2 transition-colors"
                        >
                          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="truncate">
                            <span className="block font-bold">Admin Hub Console</span>
                            <span className="text-[10px] text-amber-500/80 font-mono">Authorized Superuser</span>
                          </div>
                        </button>
                        <button
                          onClick={() => copyDirectLink('admin')}
                          title="Copy Secret Admin Portal Link"
                          className="p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors shrink-0"
                        >
                          {copiedLinkRole === 'admin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-800 mt-1">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        signOut();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out Current Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Run Automated CUJ Tests Button */}
            <button
              onClick={onOpenTests}
              title="Run Automated Tests"
              className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tests</span>
            </button>

            {/* Social Connect Button */}
            <button
              onClick={onOpenSocials}
              title="Manage Social Accounts"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
            >
              <Share2 className="w-4 h-4" />
              {currentUser.connectedAccounts.youtube?.connected && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* KYC Status Pill */}
            <button
              onClick={onOpenKyc}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                currentUser.kycStatus === 'verified'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : currentUser.kycStatus === 'pending'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {currentUser.kycStatus === 'verified' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">KYC OK</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Verify KYC</span>
                </>
              )}
            </button>

            {/* Wallet Balance Chip */}
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700/80 rounded-xl transition-all shadow-sm group"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ₹
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block leading-tight font-medium">Balance</span>
                <span className="text-sm font-bold text-emerald-400 block leading-none font-mono">
                  ₹{currentUser.walletBalance.toFixed(2)}
                </span>
              </div>
            </button>

            {/* Authenticated Profile Chip & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${
                  currentRole === 'admin' ? 'd97706' : currentRole === 'creator' ? 'e11d48' : 'dc2626'
                }&color=fff`} 
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className={`text-[9px] font-bold block uppercase tracking-wider ${
                  currentRole === 'admin' 
                    ? 'text-amber-400' 
                    : currentRole === 'creator' 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`}>
                  {currentRole === 'admin' ? 'Administrator' : currentRole === 'creator' ? 'Creator' : 'Earner'}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Scoped Portal Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-800 text-xs">
          {currentRole === 'admin' ? (
            <div className="flex items-center justify-center gap-2 w-full">
              <span className="text-[10px] font-mono text-amber-400 font-bold">ADMIN:</span>
              <button
                onClick={() => setCurrentRole('admin')}
                className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[11px]"
              >
                Admin
              </button>
              <button
                onClick={() => setCurrentRole('user')}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
              >
                Earner
              </button>
              <button
                onClick={() => setCurrentRole('creator')}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
              >
                Creator
              </button>
            </div>
          ) : currentRole === 'creator' ? (
            <div className="flex items-center justify-between w-full text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Tv className="w-3.5 h-3.5" />
                Creator Studio Active
              </span>
              <button
                onClick={() => onOpenAuth('creator')}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Switch Account
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-slate-300">
              <span className="flex items-center gap-1.5 text-red-400 font-bold">
                <User className="w-3.5 h-3.5" />
                Earner Portal Active
              </span>
              <button
                onClick={() => onOpenAuth('user')}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Switch Account
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
