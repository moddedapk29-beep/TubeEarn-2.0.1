import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { AdminActionLog } from '../types';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  Smartphone, 
  Building, 
  Copy, 
  Check, 
  Clock, 
  Lock, 
  ArrowUpRight, 
  Coins, 
  AlertTriangle, 
  UserCheck, 
  UserX,
  FileSpreadsheet
} from 'lucide-react';

export const AdminActionHistory: React.FC = () => {
  const { adminActionLogs, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'approve_withdrawal' | 'reject_withdrawal'>('all');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Compute summary metrics
  const stats = useMemo(() => {
    const approvals = adminActionLogs.filter(l => l.actionType === 'approve_withdrawal');
    const rejections = adminActionLogs.filter(l => l.actionType === 'reject_withdrawal');

    const totalApprovedAmount = approvals.reduce((acc, l) => acc + (l.amount || 0), 0);
    const totalRejectedAmount = rejections.reduce((acc, l) => acc + (l.amount || 0), 0);

    return {
      totalCount: adminActionLogs.length,
      approvalCount: approvals.length,
      approvedAmount: totalApprovedAmount,
      rejectionCount: rejections.length,
      rejectedAmount: totalRejectedAmount
    };
  }, [adminActionLogs]);

  // Filtered action logs
  const filteredLogs = useMemo(() => {
    return adminActionLogs.filter(log => {
      // Action type filter
      if (actionFilter !== 'all' && log.actionType !== actionFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAdmin = log.adminName.toLowerCase().includes(q) || log.adminId.toLowerCase().includes(q);
        const matchesUser = (log.targetUserName || '').toLowerCase().includes(q) || (log.targetUserEmail || '').toLowerCase().includes(q);
        const matchesId = log.id.toLowerCase().includes(q) || log.targetId.toLowerCase().includes(q);
        const matchesReason = (log.details?.rejectionReason || '').toLowerCase().includes(q);
        const matchesUtr = (log.details?.utrNumber || '').toLowerCase().includes(q);
        const matchesDest = (log.details?.destination || '').toLowerCase().includes(q);

        if (!matchesAdmin && !matchesUser && !matchesId && !matchesReason && !matchesUtr && !matchesDest) {
          return false;
        }
      }

      return true;
    });
  }, [adminActionLogs, actionFilter, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner / Explanation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono">
            <History className="w-3.5 h-3.5" />
            <span>IMMUTABLE EXECUTIVE AUDIT TRAIL</span>
          </div>
          <h2 className="text-xl font-black text-white">Administrator Action History Log</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Complete compliance journal recording every approval and rejection decision, the acting administrative officer ID, timestamps, 12-digit UTR proofs, and reasons for rejected fraudulent attempts.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
          <span className="text-[10px] text-slate-400 uppercase block">Active Session Officer</span>
          <span className="font-bold text-amber-400 text-sm">{currentUser.name}</span>
          <span className="text-[10px] text-slate-500 block">ID: {currentUser.customUserId || 'ADM-SUPER-2026'}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total Actions Logged</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
              Full Ledger
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.totalCount}</div>
          <span className="text-[11px] text-slate-400">All administrative operations recorded</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-medium">Approvals Recorded</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
              {stats.approvalCount} Settled
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{stats.approvedAmount.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-400/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Disbursed via Real UPI Payout Gateway</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-rose-400 font-medium">Rejections &amp; Reasons Logged</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[10px]">
              {stats.rejectionCount} Fraud Blocked
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{stats.rejectedAmount.toFixed(2)}
          </div>
          <span className="text-[11px] text-rose-400/80 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Escrow defended &amp; refunded</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Action Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                actionFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Logs ({stats.totalCount})</span>
            </button>

            <button
              onClick={() => setActionFilter('approve_withdrawal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                actionFilter === 'approve_withdrawal'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approvals ({stats.approvalCount})</span>
            </button>

            <button
              onClick={() => setActionFilter('reject_withdrawal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                actionFilter === 'reject_withdrawal'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejections ({stats.rejectionCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Admin ID, Earner Name, Rejection Reason, UTR..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
          <span>Showing {filteredLogs.length} of {adminActionLogs.length} recorded action entries</span>
          <span>Dual-Entry Audit Protocol &bull; ISO-8601 UTC Timestamps</span>
        </div>
      </div>

      {/* Action Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Action Logs Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || actionFilter !== 'all'
                ? 'Try changing your search terms or filter selection.'
                : 'Action history is currently empty. Actions taken in the queue will be recorded here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const isApproval = log.actionType === 'approve_withdrawal';
            const isRejection = log.actionType === 'reject_withdrawal';

            return (
              <div
                key={log.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-3.5 shadow-md ${
                  isApproval
                    ? 'border-emerald-500/20 hover:border-emerald-500/40'
                    : 'border-rose-500/30 hover:border-rose-500/50 bg-gradient-to-r from-rose-950/5 to-slate-900'
                }`}
              >
                {/* Header Row: Actor Info & Action Type */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {/* Action Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isApproval 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isApproval ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isApproval
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {isApproval ? 'APPROVED & DISBURSED' : 'REJECTED (FRAUD / NON-COMPLIANCE)'}
                        </span>

                        <span className="text-xs text-slate-300 font-mono">
                          Target: <strong className="text-white">{log.targetId}</strong>
                        </span>
                      </div>

                      {/* Acting Admin Officer */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Action by:</span>
                        <span className="font-bold text-white">{log.adminName}</span>
                        <span className="font-mono text-[10px] text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                          {log.adminId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Amount */}
                  <div className="text-right shrink-0">
                    {log.amount !== undefined && (
                      <div className="text-base font-black text-white font-mono">
                        ₹{log.amount.toFixed(2)}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Target Earner & Destination Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Beneficiary Earner</span>
                    <span className="font-bold text-white text-sm block">{log.targetUserName || 'Earner'}</span>
                    <span className="text-slate-400 text-[11px]">{log.targetUserEmail}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Payout Destination</span>
                    <span className="font-bold text-slate-200 text-sm block truncate">
                      {log.details?.destination || 'UPI / Bank Transfer'}
                    </span>
                    <span className="text-[10px] text-slate-400">Method: {log.details?.method || 'UPI'}</span>
                  </div>
                </div>

                {/* APPROVAL DETAILS: UTR and Payout Gateway Reference */}
                {isApproval && log.details?.utrNumber && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          Disbursed via UPI Instant Payout Gateway (NPCI IMPS)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Ref: {log.details.payoutRef}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase">12-Digit UTR:</span>
                      <span className="text-xs font-black text-amber-300 tracking-wider">
                        {log.details.utrNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(log.details!.utrNumber!)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Copy UTR Reference"
                      >
                        {copiedUtr === log.details.utrNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* REJECTION REASON: Prominently Highlighted with Grounds */}
                {isRejection && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        Documented Rejection Reason:
                      </span>
                      {log.details?.fraudScore !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          Risk Score: {log.details.fraudScore}/100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white pl-5 leading-relaxed font-sans font-medium">
                      "{log.details?.rejectionReason || 'Rejected during administrative compliance review.'}"
                    </p>
                    <div className="text-[10px] text-slate-400 pl-5 pt-0.5 font-mono">
                      Funds refunded to earner balance. Action recorded under Admin ID {log.adminId}.
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
