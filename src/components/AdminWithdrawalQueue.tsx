import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { WithdrawalRequest } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Smartphone, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Clock, 
  Lock, 
  X, 
  AlertCircle, 
  FileText, 
  Sparkles,
  User,
  Building,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const COMMON_REJECTION_REASONS = [
  {
    label: '🤖 Automated Bot Activity',
    category: 'bot_velocity',
    text: 'Fraudulent attempt: Automated bot activity detected with unnatural watch duration velocity (sub-10s watch time).'
  },
  {
    label: '📝 Duplicate / Spam Feedback',
    category: 'spam_feedback',
    text: 'Fraudulent attempt: Generic or duplicate feedback text copy-pasted across multiple campaign review tasks.'
  },
  {
    label: '👥 Multiple Accounts (Sybil)',
    category: 'multiple_accounts',
    text: 'Sybil violation: Same UPI VPA / bank account destination associated with multiple unauthorized earner IDs.'
  },
  {
    label: '⏱️ Watch Duration Deficit',
    category: 'duration_deficit',
    text: 'Compliance violation: Video task was closed prematurely prior to satisfying the mandatory minimum watch duration.'
  },
  {
    label: '🪪 KYC Identity Mismatch',
    category: 'kyc_mismatch',
    text: 'Identity mismatch: Payout beneficiary name does not match the legal name on verified government KYC identification.'
  },
  {
    label: '⚠️ Artificial Engagement Scheme',
    category: 'policy_violation',
    text: 'Policy violation: Unnatural engagement pattern violating YouTube/Meta platform compliance terms.'
  }
];

export const AdminWithdrawalQueue: React.FC = () => {
  const { 
    withdrawals, 
    processWithdrawalAdmin, 
    updateUserStatusAdmin, 
    addFraudSignalLog 
  } = useApp();

  // Filters and state
  const [activeQueueFilter, setActiveQueueFilter] = useState<'pending' | 'completed' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'upi' | 'bank_transfer'>('all');
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Rejection modal state
  const [selectedForRejection, setSelectedForRejection] = useState<WithdrawalRequest | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [alsoSuspendUser, setAlsoSuspendUser] = useState(false);
  const [alsoLogFraud, setAlsoLogFraud] = useState(true);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Compute metrics
  const queueStats = useMemo(() => {
    const pendingList = withdrawals.filter(w => w.status === 'pending');
    const completedList = withdrawals.filter(w => w.status === 'completed');
    const rejectedList = withdrawals.filter(w => w.status === 'rejected');

    const pendingTotal = pendingList.reduce((acc, w) => acc + w.amount, 0);
    const completedTotal = completedList.reduce((acc, w) => acc + w.amount, 0);
    const rejectedTotal = rejectedList.reduce((acc, w) => acc + w.amount, 0);

    return {
      pendingCount: pendingList.length,
      pendingTotal,
      completedCount: completedList.length,
      completedTotal,
      rejectedCount: rejectedList.length,
      rejectedTotal,
      totalCount: withdrawals.length
    };
  }, [withdrawals]);

  // Filtered list
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      // Status filter
      if (activeQueueFilter !== 'all' && w.status !== activeQueueFilter) {
        return false;
      }

      // Method filter
      if (methodFilter !== 'all' && w.method !== methodFilter) {
        return false;
      }

      // High risk filter
      if (onlyHighRisk && (w.fraudScore || 0) < 50) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = w.userName?.toLowerCase().includes(query);
        const matchesEmail = w.userEmail?.toLowerCase().includes(query);
        const matchesId = w.id?.toLowerCase().includes(query);
        const matchesUpi = w.upiId?.toLowerCase().includes(query);
        const matchesUtr = w.utrNumber?.toLowerCase().includes(query);
        const matchesAcc = w.bankAccountNumber?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesId && !matchesUpi && !matchesUtr && !matchesAcc) {
          return false;
        }
      }

      return true;
    });
  }, [withdrawals, activeQueueFilter, methodFilter, onlyHighRisk, searchQuery]);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApprove = async (withdrawal: WithdrawalRequest) => {
    setIsProcessingAction(true);
    try {
      await processWithdrawalAdmin(withdrawal.id, 'approve');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setSuccessToast(`Disbursed ₹${withdrawal.amount.toFixed(2)} to ${withdrawal.userName} via Real UPI IMPS Gateway.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenRejectionModal = (withdrawal: WithdrawalRequest) => {
    setSelectedForRejection(withdrawal);
    // Pre-select bot reason if fraud score is high
    if ((withdrawal.fraudScore || 0) >= 80) {
      setRejectionReasonText(COMMON_REJECTION_REASONS[0].text);
      setAlsoSuspendUser(true);
    } else {
      setRejectionReasonText('');
      setAlsoSuspendUser(false);
    }
    setAlsoLogFraud(true);
    setRejectionError(null);
  };

  const handleConfirmRejection = async () => {
    if (!selectedForRejection) return;

    const trimmedReason = rejectionReasonText.trim();
    if (!trimmedReason || trimmedReason.length < 10) {
      setRejectionError('Please provide a specific rejection reason of at least 10 characters explaining the non-compliance or fraud grounds.');
      return;
    }

    setIsProcessingAction(true);
    try {
      // 1. Process rejection and refund
      await processWithdrawalAdmin(selectedForRejection.id, 'reject', trimmedReason);

      // 2. Optionally record in fraud log
      if (alsoLogFraud) {
        addFraudSignalLog({
          userId: selectedForRejection.userId,
          userName: selectedForRejection.userName,
          riskScore: selectedForRejection.fraudScore || 85,
          signals: selectedForRejection.flaggedSignals || [trimmedReason],
          submissionId: selectedForRejection.id,
          deepThinkingAudit: `Administrative rejection: ${trimmedReason}`,
          actionTaken: alsoSuspendUser ? 'account_suspended' : 'account_flagged'
        });
      }

      // 3. Optionally suspend user
      if (alsoSuspendUser) {
        updateUserStatusAdmin(selectedForRejection.userId, 'suspended');
      }

      setSuccessToast(`Withdrawal request ${selectedForRejection.id} rejected. Reason logged and balance returned.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setSelectedForRejection(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Queue Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Pending Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Pending Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold">
              {queueStats.pendingCount} Action Required
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{queueStats.pendingTotal.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400/80">
            <Clock className="w-3 h-3" />
            <span>Awaiting compliance review</span>
          </div>
        </div>

        {/* Policy Guard Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Payout Threshold</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
              Enforced
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ≥ ₹299.00
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% of requests meet policy</span>
          </div>
        </div>

        {/* Approved Disbursed Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Disbursed via UPI</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
              {queueStats.completedCount} Settled
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{queueStats.completedTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            NPCI IMPS Real UTRs Recorded
          </div>
        </div>

        {/* Fraud Intercepted Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Fraud Intercepted</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-mono text-[10px] font-bold">
              {queueStats.rejectedCount} Rejected
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{queueStats.rejectedTotal.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-400/80">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Reasons logged &amp; refunded</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveQueueFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeQueueFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Review ({queueStats.pendingCount})</span>
            </button>

            <button
              onClick={() => setActiveQueueFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeQueueFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved ({queueStats.completedCount})</span>
            </button>

            <button
              onClick={() => setActiveQueueFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeQueueFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({queueStats.rejectedCount})</span>
            </button>

            <button
              onClick={() => setActiveQueueFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeQueueFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All ({queueStats.totalCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Earner, Email, UPI VPA, or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Method:</span>
              <select
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Methods (UPI &amp; Bank)</option>
                <option value="upi">UPI VPA Only</option>
                <option value="bank_transfer">Bank Transfer Only</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyHighRisk}
                onChange={e => setOnlyHighRisk(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-0"
              />
              <span className={`text-xs ${onlyHighRisk ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                ⚠️ High Fraud Risk (&gt;50%) Only
              </span>
            </label>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawal records
          </div>
        </div>
      </div>

      {/* Withdrawal Queue List */}
      {filteredWithdrawals.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Withdrawal Requests Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || activeQueueFilter !== 'all' || onlyHighRisk
                ? 'Try adjusting your filters or search terms to inspect other queue items.'
                : 'No pending withdrawal requests in the queue.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map(w => {
            const isHighFraudRisk = (w.fraudScore || 0) >= 70;
            const isMediumFraudRisk = (w.fraudScore || 0) >= 30 && (w.fraudScore || 0) < 70;

            return (
              <div
                key={w.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-3 shadow-md ${
                  w.status === 'rejected'
                    ? 'border-rose-500/30 bg-rose-950/5'
                    : isHighFraudRisk && w.status === 'pending'
                    ? 'border-rose-500/40 hover:border-rose-500/60 bg-gradient-to-r from-rose-950/10 to-slate-900'
                    : w.status === 'completed'
                    ? 'border-emerald-500/20 bg-slate-900'
                    : 'border-slate-800 hover:border-amber-500/30'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-white text-base">{w.userName}</span>
                      <span className="text-xs text-slate-400 font-mono">({w.userEmail})</span>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        w.userRole === 'creator' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {w.userRole === 'creator' ? 'Creator Studio' : 'Earner Rewards'}
                      </span>

                      {/* Status Badge */}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${
                        w.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : w.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {w.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {w.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {w.status === 'pending' && <Clock className="w-3 h-3" />}
                        <span>{w.status}</span>
                      </span>

                      {/* Fraud Risk Flag */}
                      {isHighFraudRisk && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>HIGH FRAUD RISK ({w.fraudScore}%)</span>
                        </span>
                      )}

                      {isMediumFraudRisk && !isHighFraudRisk && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Moderate Risk ({w.fraudScore}%)</span>
                        </span>
                      )}
                    </div>

                    {/* Beneficiary Details */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono pt-1">
                      <span className="flex items-center gap-1 text-slate-400">
                        {w.method === 'upi' ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Building className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="font-bold text-white">{w.method === 'upi' ? 'UPI VPA:' : 'Bank Transfer:'}</span>
                      </span>

                      <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {w.method === 'upi' ? w.upiId : `${w.bankAccountNumber} (IFSC: ${w.ifsc})`}
                      </span>

                      <span className="text-[10px] text-slate-500">
                        Requested: {new Date(w.createdAt).toLocaleString()} &bull; ID: {w.id}
                      </span>
                    </div>
                  </div>

                  {/* Amount and Action Buttons */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Requested Amount</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ₹{w.amount.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-emerald-400/90 font-mono block">
                        ✓ ≥ ₹299 Policy Compliant
                      </span>
                    </div>

                    {/* Pending Action Buttons */}
                    {w.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(w)}
                          disabled={isProcessingAction}
                          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                          title="Generate 12-digit UTR and disburse immediately via NPCI IMPS UPI Gateway"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Approve &amp; Disburse</span>
                        </button>

                        <button
                          onClick={() => handleOpenRejectionModal(w)}
                          disabled={isProcessingAction}
                          className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          title="Open rejection dialog to specify reason for fraudulent or non-compliant attempt"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject...</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* If Completed: Show Payout Proof with UTR */}
                {w.status === 'completed' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          Disbursed via {w.gatewayProvider || 'UPI Instant Payout Gateway'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Processed: {w.processedAt ? new Date(w.processedAt).toLocaleString() : 'Just now'} &bull; Officer: <span className="text-amber-300 font-semibold">{w.processedByAdminName || w.processedByAdminId || 'Super Admin (ADM-SUPER-2026)'}</span> &bull; Ref: {w.payoutRef}
                        </span>
                      </div>
                    </div>

                    {w.utrNumber && (
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">12-Digit UTR:</span>
                        <span className="text-xs font-black text-amber-300 tracking-wider">{w.utrNumber}</span>
                        <button
                          onClick={() => handleCopyUtr(w.utrNumber!)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Copy UTR Number"
                        >
                          {copiedUtr === w.utrNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* If Rejected: Show Detailed Rejection Reason Box */}
                {w.status === 'rejected' && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Rejection &amp; Non-Compliance Grounds:</span>
                    </div>
                    <p className="text-slate-200 pl-6 leading-relaxed">
                      {w.rejectionReason || 'Rejected during administrative compliance review. Payout refunded to user wallet.'}
                    </p>
                    {w.processedAt && (
                      <div className="text-[10px] text-slate-400 pl-6 flex items-center gap-2">
                        <span>Rejected on: {new Date(w.processedAt).toLocaleString()}</span>
                        <span>&bull;</span>
                        <span>Officer: <strong className="text-amber-300 font-mono">{w.processedByAdminName || w.processedByAdminId || 'Super Admin (ADM-SUPER-2026)'}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* If Flagged Signals Detected on pending request */}
                {w.status === 'pending' && w.flaggedSignals && w.flaggedSignals.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs space-y-1">
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Automated Forensics Detected Anomalies:
                    </span>
                    <ul className="list-disc pl-5 text-[11px] text-slate-300 space-y-0.5">
                      {w.flaggedSignals.map((signal, idx) => (
                        <li key={idx}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Reject Withdrawal with Reason Field */}
      {selectedForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Reject Withdrawal Attempt</h3>
                  <p className="text-xs text-slate-400">Specify reason to document compliance decision and refund earner.</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedForRejection(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Earner:</span>
                <span className="font-bold text-white">{selectedForRejection.userName} ({selectedForRejection.userEmail})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount to Refund:</span>
                <span className="font-bold text-rose-400 text-sm">₹{selectedForRejection.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Payout Destination:</span>
                <span className="text-slate-200">
                  {selectedForRejection.method === 'upi' ? selectedForRejection.upiId : selectedForRejection.bankAccountNumber}
                </span>
              </div>
            </div>

            {/* Quick Reason Preset Chips */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Quick Rejection Category Presets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {COMMON_REJECTION_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReasonText(preset.text)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-[11px] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{preset.label}</span>
                    <Sparkles className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  Rejection Reason &amp; Compliance Notes <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {rejectionReasonText.length} characters (min 10)
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={rejectionReasonText}
                onChange={e => {
                  setRejectionReasonText(e.target.value);
                  setRejectionError(null);
                }}
                placeholder="Explain why this withdrawal is being rejected (e.g. Bot engagement, fake feedback, multiple account violation, etc.)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
              />
            </div>

            {/* Optional Enforcement Options */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoLogFraud}
                  onChange={e => setAlsoLogFraud(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Log this attempt in the <strong>Gemini Anti-Fraud Forensic Ledger</strong>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoSuspendUser}
                  onChange={e => setAlsoSuspendUser(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                />
                <span className="text-rose-300 font-semibold">
                  Suspend earner account (prohibit future video task claims)
                </span>
              </label>
            </div>

            {/* Error Message */}
            {rejectionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{rejectionError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForRejection(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={isProcessingAction || !rejectionReasonText.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection &amp; Log Reason</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
