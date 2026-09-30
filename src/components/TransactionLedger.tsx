import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  orderBy, 
  setDoc, 
  doc 
} from 'firebase/firestore';
import { useApp } from '../store/AppContext';
import { WalletTransaction, TransactionType } from '../types';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  Search, 
  Database, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface TransactionLedgerProps {
  className?: string;
  userId?: string;
  limitCount?: number;
  showHeader?: boolean;
  isFullSystemView?: boolean;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  className = '',
  userId,
  limitCount,
  showHeader = true,
  isFullSystemView = false
}) => {
  const { currentUser, transactions: fallbackTransactions } = useApp();
  const effectiveUserId = userId || currentUser.uid;
  const isAllView = isFullSystemView || userId === 'ALL';

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'firestore' | 'local_fallback'>('firestore');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync initial seed data to Firestore if empty, so the user has immediate live Firestore records
  const seedInitialTransactionsIfEmpty = async () => {
    try {
      const colRef = collection(db, 'walletTransactions');
      const q = isAllView 
        ? query(colRef)
        : query(colRef, where('userId', '==', effectiveUserId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Seed with existing mock data
        const seeds = isAllView
          ? fallbackTransactions
          : fallbackTransactions.filter(t => t.userId === effectiveUserId);
        for (const seed of seeds) {
          await setDoc(doc(db, 'walletTransactions', seed.id), seed);
        }
      }
    } catch (e) {
      console.warn("Could not seed initial walletTransactions to Firestore:", e);
    }
  };

  // Real-time Firestore Listener
  const fetchFirestoreTransactions = () => {
    setLoading(true);
    setError(null);

    try {
      // Query walletTransactions: all for admin full view, or scoped to effectiveUserId
      const colRef = collection(db, 'walletTransactions');
      const q = isAllView
        ? query(colRef)
        : query(colRef, where('userId', '==', effectiveUserId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: WalletTransaction[] = [];
            snapshot.forEach((docSnap) => {
              items.push(docSnap.data() as WalletTransaction);
            });
            // Sort by createdAt descending
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTransactions(items);
            setSource('firestore');
          } else {
            // Check fallback collection 'transactions' or seed
            seedInitialTransactionsIfEmpty().then(() => {
              const localMatches = isAllView
                ? fallbackTransactions
                : fallbackTransactions.filter(t => t.userId === effectiveUserId);
              setTransactions(localMatches);
            });
          }
          setLoading(false);
          setIsRefreshing(false);
        },
        (err) => {
          console.warn("Firestore listener error, using synchronized context fallback:", err.message);
          setError(err.message);
          const localMatches = isAllView
            ? fallbackTransactions
            : fallbackTransactions.filter(t => t.userId === effectiveUserId);
          setTransactions(localMatches);
          setSource('local_fallback');
          setLoading(false);
          setIsRefreshing(false);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error("Error setting up Firestore listener:", err);
      setError(err.message);
      const localMatches = isAllView
        ? fallbackTransactions
        : fallbackTransactions.filter(t => t.userId === effectiveUserId);
      setTransactions(localMatches);
      setSource('local_fallback');
      setLoading(false);
      setIsRefreshing(false);
      return () => {};
    }
  };

  useEffect(() => {
    const unsub = fetchFirestoreTransactions();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [effectiveUserId, isAllView]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await seedInitialTransactionsIfEmpty();
    fetchFirestoreTransactions();
  };

  // Header title depending on view
  const headerTitle = isAllView 
    ? 'Master System Transaction Ledger' 
    : currentUser.role === 'creator'
    ? 'Creator Campaign Financial Ledger'
    : 'Earner Rewards & Payouts Ledger';

  const headerSubtitle = isAllView
    ? 'Global double-entry audit trail across all earners, creators, and platform treasury'
    : currentUser.role === 'creator'
    ? 'Your escrow deposits, campaign reservations, and participant reward disbursements'
    : 'Your verified task earnings, platform bonuses, and ₹299+ withdrawal disbursements';

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (selectedFilter === 'deposit' && t.type !== 'deposit') return false;
    if (selectedFilter === 'reward' && !t.type.includes('reward')) return false;
    if (selectedFilter === 'withdrawal' && !t.type.includes('withdrawal')) return false;
    if (selectedFilter === 'campaign' && !t.type.includes('campaign')) return false;
    if (selectedFilter === 'earner_only' && !t.type.includes('reward') && !t.type.includes('withdrawal')) return false;
    if (selectedFilter === 'creator_only' && !t.type.includes('deposit') && !t.type.includes('campaign')) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.referenceId.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        (t.userId && t.userId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const displayList = limitCount ? filteredTransactions.slice(0, limitCount) : filteredTransactions;

  // Formatting helpers
  const formatTransactionType = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return { label: 'Deposit', icon: ArrowDownLeft, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'task_reward_settled':
        return { label: 'Task Reward', icon: ArrowDownLeft, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
      case 'task_reward_pending':
        return { label: 'Reward Pending', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'campaign_budget_lock':
        return { label: 'Campaign Escrow', icon: ArrowUpRight, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'campaign_refund':
        return { label: 'Campaign Refund', icon: ArrowDownLeft, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'withdrawal_request':
        return { label: 'Withdrawal Req', icon: ArrowUpRight, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'withdrawal_payout':
        return { label: 'Payout Settled', icon: ArrowUpRight, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'withdrawal_refund':
        return { label: 'Payout Refund', icon: ArrowDownLeft, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      default:
        return { label: String(type).replace(/_/g, ' '), icon: ArrowDownLeft, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const formatStatusBadge = (status: WalletTransaction['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-2.5 h-2.5" /> Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-mono">
            <Clock className="w-2.5 h-2.5 animate-spin" /> Pending
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider font-mono">
            <XCircle className="w-2.5 h-2.5" /> {status}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase text-slate-400">
            {status}
          </span>
        );
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        formattedDate: date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        formattedTime: date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
    } catch {
      return { formattedDate: isoString, formattedTime: '' };
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header Section */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                {headerTitle}
              </h3>
              {isAllView ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold">
                  FULL ACCESS ADMIN VIEW
                </span>
              ) : (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  source === 'firestore'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Firestore db: walletTransactions
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {headerSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh ledger from Cloud Firestore"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={isAllView ? "Search user ID, ref, type..." : "Search reference, type, ID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(isAllView ? [
            { id: 'all', label: 'All Entries' },
            { id: 'earner_only', label: 'Earners' },
            { id: 'creator_only', label: 'Creators' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'campaign', label: 'Escrow' }
          ] : currentUser.role === 'creator' ? [
            { id: 'all', label: 'All Entries' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'campaign', label: 'Campaign Escrow' }
          ] : [
            { id: 'all', label: 'All Entries' },
            { id: 'reward', label: 'Task Rewards' },
            { id: 'withdrawal', label: 'Withdrawals' }
          ]).map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 border ${
                selectedFilter === f.id
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Ledger Records Table / Cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
                <div className="space-y-1">
                  <div className="w-32 h-3.5 bg-slate-800 rounded" />
                  <div className="w-20 h-2.5 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="w-16 h-4 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <Clock className="w-6 h-6 text-slate-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-300">No Ledger Transactions Found</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Transactions will appear here as soon as you deposit creator funds, complete campaign tasks, or request withdrawals.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((tx) => {
            const typeInfo = formatTransactionType(tx.type);
            const Icon = typeInfo.icon;
            const { formattedDate, formattedTime } = formatTimestamp(tx.createdAt);
            const isCredit = tx.amount > 0;

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm group"
              >
                {/* Left: Type, Icon & Description */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeInfo.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded border font-mono uppercase ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {tx.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono flex-wrap">
                      {isAllView && (
                        <>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                            User: {tx.userId}
                          </span>
                          <span>&bull;</span>
                        </>
                      )}
                      <span>Ref: {tx.referenceId}</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">
                        {formattedDate} {formattedTime}
                      </span>
                      {tx.paymentMethod && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-400">{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Status & Running Balance */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-900">
                  <div className="sm:text-right">
                    <div className={`font-mono font-bold text-sm ${
                      isCredit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                    </div>
                    {tx.balanceAfter !== undefined && (
                      <span className="text-[10px] font-mono text-slate-500 block">
                        Bal: ₹{tx.balanceAfter.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {formatStatusBadge(tx.status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
        <span>Showing {displayList.length} of {filteredTransactions.length} entries</span>
        <span className="font-mono">User ID: {effectiveUserId}</span>
      </div>

    </div>
  );
};
export default TransactionLedger;
