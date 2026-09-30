import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { CreatorDashboard } from './components/CreatorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { WalletModal } from './components/WalletModal';
import { KycModal } from './components/KycModal';
import { SocialAccountsModal } from './components/SocialAccountsModal';
import { AutomatedTestsModal } from './components/AutomatedTestsModal';
import { AuthModal } from './components/AuthModal';
import { ReferralModal } from './components/ReferralModal';
import { Shield, Sparkles, CheckCircle2, Lock, HelpCircle, AlertTriangle, RefreshCw, KeyRound, Tv, User, ArrowRight, ShieldCheck, Zap, Gift } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TubeEarn caught UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reset &amp; Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { currentRole, setCurrentRole, isRoleAuthenticated, loginAsAdmin } = useApp();

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [isSocialsOpen, setIsSocialsOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'user' | 'creator' | 'admin'>('user');
  const [isDirectAdminLinkAccessed, setIsDirectAdminLinkAccessed] = useState(false);

  // Quick gate authentication states
  const [gateAdminKey, setGateAdminKey] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [isGateSubmitting, setIsGateSubmitting] = useState(false);

  // Handle URL separate links and referrals on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const portal = params.get('portal') || params.get('role');
    const refCode = params.get('ref');
    const adminKey = params.get('adminKey') || params.get('key');

    if (refCode) {
      localStorage.setItem('tubeearn_incoming_ref', refCode);
    }

    if (portal === 'admin' || hash === '#admin') {
      setIsDirectAdminLinkAccessed(true);
      if (adminKey === 'ADMIN2026') {
        loginAsAdmin('ADMIN2026');
      } else {
        setCurrentRole('admin');
      }
    } else if (portal === 'creator') {
      setCurrentRole('creator');
    } else if (portal === 'user') {
      setCurrentRole('user');
    }
  }, []);

  const handleAdminGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setIsGateSubmitting(true);
    const res = await loginAsAdmin(gateAdminKey);
    setIsGateSubmitting(false);
    if (!res.success) {
      setGateError(res.message);
    }
  };

  const handleQuickAdminGate = async () => {
    setGateError(null);
    setIsGateSubmitting(true);
    await loginAsAdmin('ADMIN2026');
    setIsGateSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenKyc={() => setIsKycOpen(true)}
        onOpenSocials={() => setIsSocialsOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenAuth={(role) => {
          setAuthInitialRole(role || 'user');
          setIsAuthOpen(true);
        }}
      />

      {/* Main Container with Separate Portals & Security Gates */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Admin Superuser Inspection Banner */}
        {isRoleAuthenticated('admin') && currentRole !== 'admin' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2.5 text-amber-300">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">
                  Admin Superuser Mode &bull; Inspecting {currentRole === 'user' ? 'Earner Portal' : 'Creator Studio'}
                </span>
                <span className="text-amber-400/80 text-[11px]">
                  You have full master privileges across all users, escrows, and disbursement records.
                </span>
              </div>
            </div>
            <button
              onClick={() => setCurrentRole('admin')}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shrink-0 transition-all shadow-md"
            >
              Return to Admin Hub
            </button>
          </div>
        )}

        {/* USER PORTAL */}
        {currentRole === 'user' && (
          isRoleAuthenticated('user') ? (
            <UserDashboard
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenSocials={() => setIsSocialsOpen(true)}
              onOpenReferral={() => setIsReferralOpen(true)}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 mx-auto flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Earner Login Required</h2>
                <p className="text-xs text-slate-400">
                  Please log in with your earner account to discover videos, complete tasks, and manage ₹299+ withdrawals.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthInitialRole('user');
                  setIsAuthOpen(true);
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <span>Log in to Earner Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        )}

        {/* CREATOR STUDIO PORTAL */}
        {currentRole === 'creator' && (
          isRoleAuthenticated('creator') ? (
            <CreatorDashboard
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenReferral={() => setIsReferralOpen(true)}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-rose-500/20 rounded-3xl text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
                <Tv className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Creator Studio Authentication Required</h2>
                <p className="text-xs text-slate-400">
                  Log in to your dedicated creator studio account to deposit escrow funds, launch minimum 1,000 participant campaigns, and review audience research data.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setAuthInitialRole('creator');
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  <Tv className="w-4 h-4" />
                  <span>Log in to Creator Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentRole('user')}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl text-xs font-semibold"
                >
                  Return to Earner Portal
                </button>
              </div>
            </div>
          )
        )}

        {/* ADMIN HUB PORTAL - Strictly gated so users and creators never see admin panel */}
        {currentRole === 'admin' && (
          isRoleAuthenticated('admin') ? (
            <AdminDashboard />
          ) : isDirectAdminLinkAccessed ? (
            <div className="max-w-lg mx-auto my-12 p-8 bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl space-y-5">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold mb-2">
                    <ShieldCheck className="w-3 h-3" />
                    AUTHORIZED INTERNAL OPERATIONS ONLY
                  </div>
                  <h2 className="text-xl font-black text-white">Administrator Security Gate</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your administrative master security passkey to access financial audits, payout disbursement queues, and Gemini Deep Thinking fraud forensics.
                  </p>
                </div>
              </div>

              {gateError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{gateError}</span>
                </div>
              )}

              <form onSubmit={handleAdminGateSubmit} className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300">Security Passkey</label>
                    <span className="text-[10px] font-mono text-amber-400">Demo Passkey: ADMIN2026</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      placeholder="Enter passkey (e.g. ADMIN2026)..."
                      value={gateAdminKey}
                      onChange={e => setGateAdminKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGateSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Verify Passkey &amp; Access Admin Hub</span>
                </button>
              </form>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <button
                  type="button"
                  onClick={handleQuickAdminGate}
                  disabled={isGateSubmitting}
                  className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>⚡ One-Click Administrator Bypass</span>
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded">ADMIN2026</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentRole('user')}
                  className="w-full py-2 bg-transparent text-slate-500 hover:text-slate-300 text-xs font-semibold"
                >
                  &larr; Return to Earner Portal
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-rose-500/20 rounded-3xl text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Administrator Panel Restricted</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Admin Hub is strictly restricted. Only platform administrators using their separate private security link or master credentials may access this area.
                </p>
              </div>
              <button
                onClick={() => setCurrentRole('user')}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20"
              >
                Return to Earner Rewards Portal
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-300">Tube<span className="text-red-500">Earn</span></span>
              <span>&bull;</span>
              <span>Compliant Creator Engagement Marketplace</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> ₹299 Minimum Payout Enforced
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-purple-400">
                <Sparkles className="w-3.5 h-3.5" /> Gemini 3.1 Pro Thinking Mode Anti-Fraud
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Policy Disclosure: TubeEarn provides legitimate creator discovery, video feedback, and audience research tasks. TubeEarn strictly prohibits and does not offer artificial engagement, paid subscribers, or sub-for-sub schemes in full adherence to YouTube and Meta platform developer policies.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onOpenKyc={() => {
          setIsWalletOpen(false);
          setIsKycOpen(true);
        }}
      />

      <KycModal
        isOpen={isKycOpen}
        onClose={() => setIsKycOpen(false)}
      />

      <SocialAccountsModal
        isOpen={isSocialsOpen}
        onClose={() => setIsSocialsOpen(false)}
      />

      <AutomatedTestsModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialRole={authInitialRole}
      />

      <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
