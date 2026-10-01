import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { UserProfile, KycStatus, UserRole } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Tv, 
  User, 
  FileText, 
  Lock, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminPendingVerifications: React.FC = () => {
  const { registeredAccounts, processKycVerificationAdmin, currentUser } = useApp();

  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'creator'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Document image blurry or unreadable.');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Compute stats across all registered accounts
  const stats = useMemo(() => {
    const pendingList = registeredAccounts.filter(a => a.kycStatus === 'pending');
    const verifiedList = registeredAccounts.filter(a => a.kycStatus === 'verified');
    const rejectedList = registeredAccounts.filter(a => a.kycStatus === 'rejected');

    const pendingEarners = pendingList.filter(a => a.role === 'user').length;
    const pendingCreators = pendingList.filter(a => a.role === 'creator').length;

    return {
      totalPending: pendingList.length,
      totalVerified: verifiedList.length,
      totalRejected: rejectedList.length,
      pendingEarners,
      pendingCreators
    };
  }, [registeredAccounts]);

  // Filtered accounts list
  const filteredProfiles = useMemo(() => {
    return registeredAccounts.filter(acc => {
      // Role filter
      if (roleFilter !== 'all' && acc.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && acc.kycStatus !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesEmail = acc.email.toLowerCase().includes(q);
        const matchesId = (acc.customUserId || '').toLowerCase().includes(q) || acc.uid.toLowerCase().includes(q);
        const matchesDocType = (acc.kycDocumentType || '').toLowerCase().includes(q);
        const matchesDocNum = (acc.kycDocumentNumberMasked || '').toLowerCase().includes(q);
        const matchesChannel = (acc.channelName || acc.connectedAccounts?.youtube?.channelName || '').toLowerCase().includes(q);
        const matchesHandle = (acc.handle || acc.connectedAccounts?.youtube?.handle || '').toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesId && !matchesDocType && !matchesDocNum && !matchesChannel && !matchesHandle) {
          return false;
        }
      }

      return true;
    });
  }, [registeredAccounts, roleFilter, statusFilter, searchQuery]);

  // 1-Click Approve handler
  const handleApprove = async (profile: UserProfile) => {
    setIsProcessing(profile.uid);
    setActionNotice(null);
    try {
      const res = await processKycVerificationAdmin(profile.uid, 'approve');
      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setActionNotice({ type: 'success', message: res.message });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message || 'Approval failed' });
    } finally {
      setIsProcessing(null);
    }
  };

  // Open Rejection Dialog
  const handleOpenRejectModal = (profile: UserProfile) => {
    setRejectingUser(profile);
    setRejectionReason('Document image blurry or unreadable.');
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    setIsProcessing(rejectingUser.uid);
    setActionNotice(null);

    try {
      const res = await processKycVerificationAdmin(rejectingUser.uid, 'reject', rejectionReason);
      if (res.success) {
        setActionNotice({ type: 'success', message: res.message });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message || 'Rejection failed' });
    } finally {
      setIsProcessing(null);
      setRejectingUser(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold font-mono">
            <UserCheck className="w-3.5 h-3.5" />
            <span>IDENTITY &amp; KYC COMPLIANCE QUEUE</span>
          </div>
          <h2 className="text-xl font-black text-white">Pending Verifications &amp; Document Review</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Review submitted government ID documents (Aadhaar, PAN, Voter ID) and creator channels. Approving grants 100% full payout clearance (&ge; ₹299) and official platform verification status.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
          <span className="text-[10px] text-slate-400 uppercase block">Verification Officer</span>
          <span className="font-bold text-indigo-400 text-sm">{currentUser.name}</span>
          <span className="text-[10px] text-slate-500 block">ID: {currentUser.customUserId || 'ADM-SUPER-2026'}</span>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-1 shadow-md">
          <span className="text-[10px] text-amber-400 uppercase font-bold block">Waiting Review</span>
          <div className="text-2xl font-black text-amber-400">{stats.totalPending} Profiles</div>
          <span className="text-[10px] text-slate-400 block">
            {stats.pendingEarners} Earners &bull; {stats.pendingCreators} Creators
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1 shadow-md">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Approved &amp; Verified</span>
          <div className="text-2xl font-black text-emerald-400">{stats.totalVerified}</div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Full payout access</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-1 shadow-md">
          <span className="text-[10px] text-rose-400 uppercase font-bold block">Rejected / Re-verify</span>
          <div className="text-2xl font-black text-rose-400">{stats.totalRejected}</div>
          <span className="text-[10px] text-slate-400">Non-compliant or blurry</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Single-Click Approval</span>
          <div className="text-sm font-bold text-white pt-1">Active Gateway</div>
          <span className="text-[10px] text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Instant ledger update</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Review ({stats.totalPending})</span>
            </button>

            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified ({stats.totalVerified})</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({stats.totalRejected})</span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Profiles ({registeredAccounts.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Name, Email, Custom ID, Document..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Secondary Role Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter Role:</span>
              <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${roleFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  All Roles
                </button>
                <button
                  onClick={() => setRoleFilter('user')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${roleFilter === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Earners Only
                </button>
                <button
                  onClick={() => setRoleFilter('creator')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${roleFilter === 'creator' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Creators Only
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Showing {filteredProfiles.length} of {registeredAccounts.length} accounts
          </div>
        </div>
      </div>

      {/* Profiles Verification List */}
      {filteredProfiles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Profiles Found in this Queue</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {statusFilter === 'pending'
                ? 'All submitted documents are currently up to date! There are no pending verifications awaiting review.'
                : 'No accounts match the selected role or search criteria.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProfiles.map(profile => {
            const isPending = profile.kycStatus === 'pending';
            const isVerified = profile.kycStatus === 'verified';
            const isRejected = profile.kycStatus === 'rejected';
            const isCreator = profile.role === 'creator';
            const channel = profile.channelName || profile.connectedAccounts?.youtube?.channelName;
            const handle = profile.handle || profile.connectedAccounts?.youtube?.handle;

            return (
              <div
                key={profile.uid}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-4 shadow-md ${
                  isPending
                    ? 'border-amber-500/30 hover:border-amber-500/50 bg-gradient-to-r from-amber-950/10 via-slate-900 to-slate-900'
                    : isVerified
                    ? 'border-emerald-500/20 hover:border-emerald-500/40'
                    : 'border-rose-500/20 hover:border-rose-500/40'
                }`}
              >
                {/* Header row: Avatar, Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=334155&color=fff`}
                      alt={profile.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-700/80 shadow"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base">{profile.name}</span>
                        
                        {/* Role Badge */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isCreator
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {isCreator ? 'Creator Studio' : 'Earner'}
                        </span>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : isVerified
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {profile.kycStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono pt-0.5">
                        <span className="text-slate-300 font-bold">{profile.customUserId || profile.uid}</span>
                        <span>&bull;</span>
                        <span className="text-slate-400">{profile.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Timestamp & Balances */}
                  <div className="text-right shrink-0 text-xs font-mono">
                    <div className="text-white font-bold">
                      {isCreator 
                        ? `₹${(profile.escrowBalance || profile.walletBalance).toLocaleString()} Escrow` 
                        : `₹${profile.walletBalance.toFixed(2)} Balance`}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        {profile.kycSubmittedAt 
                          ? `Submitted: ${new Date(profile.kycSubmittedAt).toLocaleDateString()}` 
                          : `Registered: ${new Date(profile.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Information & Creator Channel Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                  
                  {/* Document Type */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Document Presented</span>
                    <div className="flex items-center gap-1.5 text-white font-bold">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {profile.kycDocumentType === 'aadhaar'
                          ? 'Aadhaar Card (UIDAI)'
                          : profile.kycDocumentType === 'pan'
                          ? 'PAN Card (ITD India)'
                          : profile.kycDocumentType === 'voter_id'
                          ? 'Voter ID (ECI)'
                          : 'Identity Proof Document'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Government Identity Record</span>
                  </div>

                  {/* Masked Document ID */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Encrypted Document Number</span>
                    <div className="flex items-center gap-1.5 text-amber-300 font-black tracking-wider">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>{profile.kycDocumentNumberMasked || 'XXXX-XXXX-9182'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80">Compliance Encrypted</span>
                  </div>

                  {/* Creator Channel (if Creator) or Bank UPI (if User) */}
                  <div className="space-y-0.5">
                    {isCreator ? (
                      <>
                        <span className="text-[10px] text-slate-500 uppercase block font-medium">Channel &amp; Studio</span>
                        <div className="flex items-center gap-1 text-rose-300 font-bold truncate">
                          <Tv className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{channel || 'Creator Studio Channel'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">{handle || '@channel'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-500 uppercase block font-medium">Verified Payout Target</span>
                        <div className="text-slate-200 font-bold truncate">
                          {profile.bankDetails?.upiId || `${profile.name.toLowerCase().replace(/\s+/g, '')}@okaxis`}
                        </div>
                        <span className="text-[10px] text-slate-400">Direct NPCI IMPS Payout</span>
                      </>
                    )}
                  </div>

                </div>

                {/* Rejection notice if already rejected */}
                {isRejected && profile.kycRejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>Rejection Grounds:</span>
                    </div>
                    <p className="text-white pl-5 leading-relaxed">
                      "{profile.kycRejectionReason}"
                    </p>
                  </div>
                )}

                {/* Verification Notice if already verified */}
                {isVerified && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Document verified. User is authorized for unlimited payouts (&ge; ₹299).</span>
                    </div>
                    {profile.kycVerifiedAt && (
                      <span className="text-[10px] text-slate-400">
                        Verified on: {new Date(profile.kycVerifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Single-Click Action Buttons for Pending or Changing Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {isPending 
                      ? 'Action required: Review document authenticity before payout approval.'
                      : 'Audit state recorded in master action ledger.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 1-Click Approve */}
                    {profile.kycStatus !== 'verified' && (
                      <button
                        onClick={() => handleApprove(profile)}
                        disabled={isProcessing === profile.uid}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                        title="Single-click approve: marks profile as verified and allows immediate payouts"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Document (1-Click)</span>
                      </button>
                    )}

                    {/* Reject Button */}
                    {profile.kycStatus !== 'rejected' && (
                      <button
                        onClick={() => handleOpenRejectModal(profile)}
                        disabled={isProcessing === profile.uid}
                        className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Reject document with specific feedback or reason"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject...</span>
                      </button>
                    )}

                    {/* Quick Re-open to pending if verified/rejected */}
                    {!isPending && (
                      <button
                        onClick={async () => {
                          await processKycVerificationAdmin(profile.uid, 'reject', 'Re-evaluation requested by admin.');
                        }}
                        className="px-3 py-2 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
                        title="Reset document status for re-evaluation"
                      >
                        Re-open Review
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Document Verification</h3>
                <p className="text-xs text-slate-400">
                  Profile: <strong className="text-white">{rejectingUser.name}</strong> ({rejectingUser.customUserId || rejectingUser.uid})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Select Preset Reason:</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  'Document image blurry or unreadable.',
                  'Legal name does not match bank/UPI account record.',
                  'Expired or invalid document presented.',
                  'Altered or forged digital image detected.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      rejectionReason === preset
                        ? 'bg-rose-500/20 border-rose-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Custom Reason or Notes:</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Document Rejection</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
