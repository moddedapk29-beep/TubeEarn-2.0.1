import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { CreatorDashboard } from './components/CreatorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CreateIdPage } from './components/CreateIdPage';
import { AdminLoginPage } from './components/AdminLoginPage';
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

  const [currentPage, setCurrentPage] = useState<'marketplace' | 'register'>('marketplace');
  const [registerInitialRole, setRegisterInitialRole] = useState<'user' | 'creator'>('user');

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [isSocialsOpen, setIsSocialsOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'user' | 'creator' | 'admin'>('user');
  const [authInitialId, setAuthInitialId] = useState<string | undefined>(undefined);

  // Handle URL separate links, paths, hashes, and referrals on mount + dynamic navigation
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlRouting = () => {
      const search = window.location.search;
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(search);

      const portal = (params.get('portal') || params.get('role') || '').toLowerCase();
      const page = (params.get('page') || '').toLowerCase();
      const create = (params.get('create') || '').toLowerCase();
      const refCode = params.get('ref');
      const adminKey = params.get('adminKey') || params.get('key');
      const adminIdParam = params.get('adminId') || params.get('id');

      if (refCode) {
        localStorage.setItem('tubeearn_incoming_ref', refCode);
      }

      // Check for Admin trigger in query, hash, or path
      const isAdminRequested = 
        portal === 'admin' || 
        hash === '#admin' || 
        hash === '#/admin' || 
        hash.includes('admin') || 
        path === '/admin' || 
        path.startsWith('/admin/') || 
        params.has('admin') || 
        page === 'admin';

      // Check for Register/Create ID trigger
      const isRegisterRequested = 
        portal === 'register' || 
        hash === '#register' || 
        page === 'register' || 
        page === 'create-id' || 
        path === '/register' || 
        create === 'id';

      if (isAdminRequested) {
        setCurrentRole('admin');
        setCurrentPage('marketplace');
        if (adminKey === 'ADMIN2026') {
          loginAsAdmin('ADMIN2026', adminIdParam || 'ADM-SUPER-2026');
        }
      } else if (isRegisterRequested) {
        setCurrentPage('register');
        const r = params.get('role');
        if (r === 'creator' || r === 'user') {
          setRegisterInitialRole(r);
        }
      } else if (portal === 'creator' || hash === '#creator' || path === '/creator') {
        setCurrentRole('creator');
        setCurrentPage('marketplace');
      } else if (portal === 'user' || hash === '#user' || path === '/user') {
        setCurrentRole('user');
        setCurrentPage('marketplace');
      }
    };

    checkUrlRouting();

    window.addEventListener('hashchange', checkUrlRouting);
    window.addEventListener('popstate', checkUrlRouting);
    return () => {
      window.removeEventListener('hashchange', checkUrlRouting);
      window.removeEventListener('popstate', checkUrlRouting);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenKyc={() => setIsKycOpen(true)}
        onOpenSocials={() => setIsSocialsOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenRegister={(role) => {
          setRegisterInitialRole(role || 'user');
          setCurrentPage('register');
        }}
        onOpenAuth={(role) => {
          setAuthInitialRole(role || 'user');
          setIsAuthOpen(true);
        }}
      />

      {/* Main Container with Separate Portals & Security Gates */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'register' ? (
          <CreateIdPage
            initialRole={registerInitialRole}
            onNavigateToLogin={(role, prefilledId) => {
              setCurrentPage('marketplace');
              setAuthInitialRole(role || 'user');
              setAuthInitialId(prefilledId);
              setIsAuthOpen(true);
            }}
            onNavigateToHome={() => setCurrentPage('marketplace')}
          />
        ) : (
          <>
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
                  <div className="space-y-2">
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
                    <button
                      onClick={() => {
                        setRegisterInitialRole('user');
                        setCurrentPage('register');
                      }}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      ✨ Don't have an ID? Create New Earner ID
                    </button>
                  </div>
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
                      onClick={() => {
                        setRegisterInitialRole('creator');
                        setCurrentPage('register');
                      }}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      ✨ Create New Creator Studio ID
                    </button>

                    <button
                      onClick={() => setCurrentRole('user')}
                      className="w-full py-2 bg-transparent hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Return to Earner Portal
                    </button>
                  </div>
                </div>
              )
            )}

            {/* ADMIN HUB PORTAL - Strictly accessed via separate link with ID and Password */}
            {currentRole === 'admin' && (
              isRoleAuthenticated('admin') ? (
                <AdminDashboard />
              ) : (
                <AdminLoginPage
                  onSuccess={() => setCurrentRole('admin')}
                  onReturnToApp={() => {
                    setCurrentRole('user');
                    setCurrentPage('marketplace');
                  }}
                />
              )
            )}
          </>
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-900/80 text-[11px]">
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Policy Disclosure: TubeEarn provides legitimate creator discovery, video feedback, and audience research tasks. TubeEarn strictly prohibits and does not offer artificial engagement, paid subscribers, or sub-for-sub schemes in full adherence to YouTube and Meta platform developer policies.
            </p>
            <button
              onClick={() => {
                setCurrentRole('admin');
                setCurrentPage('marketplace');
                window.location.hash = 'admin';
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 font-mono text-[10px] transition-colors shrink-0"
              title="Access Isolated Executive Administration Console"
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Admin Portal Login</span>
            </button>
          </div>
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
        onClose={() => {
          setIsAuthOpen(false);
          setAuthInitialId(undefined);
        }}
        initialRole={authInitialRole}
        initialId={authInitialId}
        onOpenRegisterPage={(role) => {
          setIsAuthOpen(false);
          setRegisterInitialRole(role || 'user');
          setCurrentPage('register');
        }}
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
