import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { TransactionLedger } from './TransactionLedger';
import { UpiPaymentGatewayModal } from './UpiPaymentGatewayModal';
import { AdminCommissionWithdrawModal } from './AdminCommissionWithdrawModal';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  Building,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Zap,
  Coins,
  QrCode
} from 'lucide-react';
import { resolveBankFromVpa, validateUpiVpa } from '../utils/upiGateway';
import confetti from 'canvas-confetti';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKyc: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onOpenKyc }) => {
  const { 
    currentUser, 
    currentRole,
    transactions, 
    addCreatorFunds, 
    requestWithdrawal,
    adminCommissionBalance,
    escrowSummary
  } = useApp();

  const role = currentUser.role || currentRole || 'user';
  const isAdmin = role === 'admin';
  const isCreator = role === 'creator';
  const isEarner = role === 'user';

  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'withdraw' | 'escrow' | 'ledger'>('overview');
  const [isUpiGatewayOpen, setIsUpiGatewayOpen] = useState(false);
  const [isAdminCommissionModalOpen, setIsAdminCommissionModalOpen] = useState(false);

  // Add Money Form State
  const [addAmount, setAddAmount] = useState<number>(isAdmin ? 25000 : 500);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingAdd, setIsProcessingAdd] = useState(false);
  const [addStatusMessage, setAddStatusMessage] = useState<string | null>(null);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(Math.max(299, Math.floor(currentUser.walletBalance)));
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [upiId, setUpiId] = useState(currentUser.bankDetails?.upiId || (isCreator ? 'priya.creators@okhdfcbank' : 'aarav@okaxis'));
  const [bankAccount, setBankAccount] = useState(currentUser.bankDetails?.accountNumberMasked || '0984102948192');
  const [ifsc, setIfsc] = useState(currentUser.bankDetails?.ifsc || 'HDFC0001234');
  const [accountName, setAccountName] = useState(currentUser.bankDetails?.accountHolderName || currentUser.name);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAdd(true);
    setAddStatusMessage(null);

    const res = await addCreatorFunds(addAmount, `Razorpay (${paymentMethod.toUpperCase()})`);
    setIsProcessingAdd(false);

    if (res.success) {
      setAddStatusMessage(res.message);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => {
        setAddStatusMessage(null);
        setActiveTab('overview');
      }, 1500);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    // Strict client validation: Minimum ₹299
    if (withdrawAmount < 299) {
      setWithdrawError('Minimum withdrawal amount is strictly ₹299.');
      return;
    }

    if (withdrawAmount > currentUser.walletBalance) {
      setWithdrawError(`Insufficient funds. Your available balance is ₹${currentUser.walletBalance.toFixed(2)}.`);
      return;
    }

    if (isEarner && currentUser.kycStatus !== 'verified') {
      setWithdrawError('KYC verification is required before initiating withdrawals. Please complete KYC.');
      return;
    }

    if (withdrawMethod === 'upi' && !validateUpiVpa(upiId)) {
      setWithdrawError('Please provide a valid virtual payment address (e.g. name@bank or mobile@paytm).');
      return;
    }

    setIsProcessingWithdraw(true);

    const res = await requestWithdrawal(withdrawAmount, withdrawMethod, {
      upiId,
      bankAccount,
      ifsc,
      name: accountName
    });

    setIsProcessingWithdraw(false);

    if (res.success) {
      setWithdrawSuccess(res.message);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else {
      setWithdrawError(res.message);
    }
  };

  const userTransactions = transactions.filter(t => t.userId === currentUser.uid);
  const resolvedWithdrawBank = resolveBankFromVpa(upiId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isAdmin 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : isCreator 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isAdmin ? 'Master Treasury & Escrow Console' : isCreator ? 'Creator Escrow Wallet' : 'Earner Rewards Wallet'}
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                  isAdmin 
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                    : isCreator 
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isAdmin ? 'TREASURY' : isCreator ? 'ESCROW & UPI' : 'EARNER INR'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin 
                  ? 'System-wide reserves, commissions & UPI disbursements' 
                  : isCreator 
                  ? 'Real UPI payment gateway, escrow vault & withdrawals' 
                  : 'Real-time verified task rewards & instant UPI payouts'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-5 gap-1 bg-slate-900/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'overview'
                ? isAdmin ? 'border-amber-500 text-amber-400' : isCreator ? 'border-rose-500 text-rose-400' : 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>

          {/* Add Funds: Creator & Admin only */}
          {(isCreator || isAdmin) && (
            <button
              onClick={() => setActiveTab('add')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'add'
                  ? isAdmin ? 'border-amber-500 text-amber-400' : 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              {isAdmin ? 'Deposit Treasury' : 'Deposit Escrow (UPI)'}
            </button>
          )}

          {/* Withdraw: Available for BOTH Creators and Users via UPI! */}
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'withdraw'
                ? isAdmin ? 'border-amber-500 text-amber-400' : isCreator ? 'border-rose-500 text-rose-400' : 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            Withdraw via UPI (₹299+)
          </button>

          {/* Escrow Details: Creator & Admin */}
          {(isCreator || isAdmin) && (
            <button
              onClick={() => setActiveTab('escrow')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'escrow'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Escrow Vault
            </button>
          )}

          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'ledger'
                ? isAdmin ? 'border-amber-500 text-amber-400' : isCreator ? 'border-rose-500 text-rose-400' : 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAdmin 
              ? `Global Ledger (${transactions.length})` 
              : `Ledger (${userTransactions.length})`}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Primary Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Available Balance / Escrow Kept In App */}
                <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 rounded-xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-medium">{isCreator ? 'Available Escrow (In App)' : 'Available Balance'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{currentUser.walletBalance.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {isCreator ? 'Kept in app ready for campaigns or UPI withdrawal' : 'Ready to withdraw via UPI or bank'}
                  </p>
                </div>

                {/* Pending Balance */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-medium">Pending Settlement</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    ₹{currentUser.pendingBalance.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Under automated clearing</p>
                </div>

                {/* Locked Escrow */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-medium">Locked in Escrow</span>
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-200 font-mono">
                    ₹{currentUser.lockedBalance.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Reserved for ongoing verified tasks</p>
                </div>
              </div>

              {/* Admin Commission Treasury Banner (Admin only) */}
              {isAdmin && (
                <div className="p-4 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <Coins className="w-4 h-4" />
                      Platform Commission Wallet (Withdrawable via UPI)
                    </div>
                    <div className="text-xl font-black text-amber-300 font-mono">
                      ₹{adminCommissionBalance.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Accumulated from ₹2.00/task platform fee on completed campaigns.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAdminCommissionModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 shrink-0"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Withdraw Commission to UPI
                  </button>
                </div>
              )}

              {/* Quick Actions depending on role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(isCreator || isAdmin) && (
                  <button
                    onClick={() => setIsUpiGatewayOpen(true)}
                    className="p-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow"
                  >
                    <QrCode className="w-4 h-4" />
                    Deposit Escrow via Real UPI Gateway
                  </button>
                )}

                {/* Withdraw via UPI for BOTH Creators and Earners */}
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="p-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow"
                >
                  <Smartphone className="w-4 h-4" />
                  {isCreator ? 'Withdraw Escrow via UPI (₹299+)' : 'Withdraw Rewards via UPI (₹299+)'}
                </button>

                <button
                  onClick={() => setActiveTab('ledger')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all sm:col-span-2"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  View Complete Ledger &amp; UTR Records
                </button>
              </div>

              {/* Progress to ₹299 Withdrawal - Earner Only */}
              {isEarner && (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Minimum Payout Threshold (₹299)
                    </span>
                    <span className="font-mono text-slate-400">
                      ₹{Math.min(299, currentUser.walletBalance).toFixed(2)} / ₹299.00
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        currentUser.walletBalance >= 299 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (currentUser.walletBalance / 299) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    {currentUser.walletBalance >= 299 ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Eligible for instant UPI payout!
                      </span>
                    ) : (
                      <span>
                        Earn ₹{(299 - currentUser.walletBalance).toFixed(2)} more to reach withdraw threshold.
                      </span>
                    )}

                    <button 
                      onClick={() => setActiveTab('withdraw')}
                      disabled={currentUser.walletBalance < 299}
                      className={`font-semibold underline ${
                        currentUser.walletBalance >= 299 ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      Withdraw via UPI &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Creator Escrow Keep In App Status - Creator Only */}
              {isCreator && (
                <div className="bg-slate-950/60 border border-rose-500/20 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-rose-400" />
                      Creator Escrow Account Status
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      100% Escrow Backed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Your deposited payments are held safely in your Escrow Wallet. Funds are disbursed to verified earners only after review. Remaining balance can be kept in app or withdrawn via UPI.
                  </p>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setIsUpiGatewayOpen(true)}
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Add Escrow via UPI
                    </button>
                    <button
                      onClick={() => setActiveTab('withdraw')}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-500/30"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Withdraw Escrow to UPI
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Ledger Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Recent Ledger Entries</span>
                  <button 
                    onClick={() => setActiveTab('ledger')}
                    className="text-emerald-400 hover:underline text-xs"
                  >
                    View All
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80 bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
                  {userTransactions.slice(0, 3).map(tx => (
                    <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.amount > 0 ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 line-clamp-1">{tx.description}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ADD ESCROW FUNDS */}
          {activeTab === 'add' && (
            <div className="space-y-5">
              
              {/* Highlight Real UPI Payment Gateway */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Recommended Payment Method:</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                      REAL UPI 2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scan dynamic QR with Google Pay, PhonePe, Paytm, or BHIM. Zero surcharge, 100% escrow protected.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpiGatewayOpen(true)}
                  className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  Launch UPI Payment Gateway
                </button>
              </div>

              {/* Standard Gateway Form */}
              <form onSubmit={handleAddFunds} className="space-y-4 pt-2">
                <div className="text-xs font-semibold text-slate-300">
                  Or Deposit via Card / NetBanking
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Select Amount (INR)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[500, 1000, 3000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAddAmount(amt)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                          addAmount === amt
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number"
                      min="100"
                      value={addAmount}
                      onChange={e => setAddAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    paymentMethod === 'card' ? 'border-emerald-500 bg-slate-800' : 'border-slate-800 bg-slate-950'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white">Cards</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payMethod" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')}
                      className="text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    paymentMethod === 'netbanking' ? 'border-emerald-500 bg-slate-800' : 'border-slate-800 bg-slate-950'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white">NetBanking</span>
                    </div>
                    <input 
                      type="radio" 
                      name="payMethod" 
                      checked={paymentMethod === 'netbanking'} 
                      onChange={() => setPaymentMethod('netbanking')}
                      className="text-emerald-500 focus:ring-0"
                    />
                  </label>
                </div>

                {addStatusMessage && (
                  <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{addStatusMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessingAdd || addAmount <= 0}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all border border-slate-700 disabled:opacity-50"
                >
                  {isProcessingAdd ? 'Authorizing Gateway Transaction...' : `Deposit ₹${addAmount.toFixed(2)} via Card/NetBanking`}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: WITHDRAWAL (Earners & Creators via UPI) */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="space-y-5">
              
              {/* Policy Warning */}
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs space-y-1 text-rose-300">
                <div className="font-bold flex items-center gap-1.5 text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  Official UPI Withdrawal Gateway (₹299 Minimum Threshold)
                </div>
                <p className="text-[11px] text-rose-300/80">
                  {isCreator 
                    ? 'Creators can withdraw unallocated escrow balance via UPI anytime. Requests below ₹299 are rejected.' 
                    : 'Earners can withdraw verified task earnings directly to their UPI VPA. Compliance audits run automatically.'}
                </p>
              </div>

              {/* KYC Requirement Notice (Earner only) */}
              {isEarner && currentUser.kycStatus !== 'verified' && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs flex items-center justify-between text-amber-300">
                  <div>
                    <span className="font-bold block">KYC Verification Required</span>
                    <span className="text-[11px] text-amber-300/80">Identity proof must be approved before withdrawal.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenKyc}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Verify Now
                  </button>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="font-semibold text-slate-300">Withdrawal Amount</label>
                  <span className="text-slate-400 font-mono">
                    Available: ₹{currentUser.walletBalance.toFixed(2)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="299"
                    max={currentUser.walletBalance}
                    step="1"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500 font-bold"
                    placeholder="Enter amount (min 299)"
                  />
                </div>

                {withdrawAmount < 299 && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">
                    &times; Amount must be at least ₹299.00
                  </p>
                )}
              </div>

              {/* Method Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payout Rail
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('upi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                      withdrawMethod === 'upi'
                        ? 'bg-slate-800 border-rose-500 text-rose-400 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Instant UPI (VPA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank_transfer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                      withdrawMethod === 'bank_transfer'
                        ? 'bg-slate-800 border-rose-500 text-rose-400 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    Bank IMPS / NEFT
                  </button>
                </div>

                {/* UPI Fields */}
                {withdrawMethod === 'upi' ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Recipient UPI ID / Virtual Payment Address
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value.toLowerCase().trim())}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                    />

                    {upiId && (
                      <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Verified Bank: {resolvedWithdrawBank.bankName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Account Holder Full Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Account Number</label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={e => setBankAccount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={ifsc}
                          onChange={e => setIfsc(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {withdrawError && (
                <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {withdrawError}
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {withdrawSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isProcessingWithdraw || 
                  withdrawAmount < 299 || 
                  withdrawAmount > currentUser.walletBalance ||
                  (isEarner && currentUser.kycStatus !== 'verified')
                }
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-40"
              >
                {isProcessingWithdraw ? 'Authorizing Payout Rail...' : `Withdraw ₹${withdrawAmount.toFixed(2)} via UPI`}
              </button>
            </form>
          )}

          {/* TAB 4: ESCROW VAULT BREAKDOWN */}
          {activeTab === 'escrow' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Smart Escrow Vault Architecture</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                    100% PROTECTED
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Payments taken from creators are held safely in the app's Escrow system. When earners complete tasks, the earner reward (e.g. ₹1.00) is disbursed, and platform commission (e.g. ₹2.00) is credited to the Admin Commission Wallet.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Escrow Deposits</span>
                    <span className="font-bold text-emerald-400">₹{escrowSummary.totalCreatorDeposits.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Active Escrow Locked</span>
                    <span className="font-bold text-indigo-400">₹{escrowSummary.totalActiveEscrowLocked.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Released to Earners</span>
                    <span className="font-bold text-white">₹{escrowSummary.totalEarnersPaid.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Admin Commission</span>
                    <span className="font-bold text-amber-400">₹{escrowSummary.currentAdminCommissionBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-200 block">Escrow Options for Creators:</span>
                <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                  <li><strong>Keep In App</strong>: Funds remain in your available escrow balance with zero expiration, ready for instant campaign launches.</li>
                  <li><strong>Instant UPI Withdrawal</strong>: Creators can withdraw unallocated balance anytime to any UPI VPA with zero penalty.</li>
                  <li><strong>1,000+ Participants Protection</strong>: Escrow guarantees all 1,000+ participants receive prompt reward credits.</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsUpiGatewayOpen(true)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Deposit Escrow via UPI
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs rounded-xl transition-all border border-rose-500/30 flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Withdraw Escrow via UPI
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: IMMUTABLE TRANSACTION LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <TransactionLedger 
                userId={isAdmin ? undefined : currentUser.uid} 
                isFullSystemView={isAdmin} 
                showHeader={false} 
              />
            </div>
          )}

        </div>
      </div>

      {/* Real UPI Payment Gateway Modal */}
      <UpiPaymentGatewayModal
        isOpen={isUpiGatewayOpen}
        onClose={() => setIsUpiGatewayOpen(false)}
        defaultAmount={addAmount}
      />

      {/* Admin Commission UPI Withdrawal Modal */}
      <AdminCommissionWithdrawModal
        isOpen={isAdminCommissionModalOpen}
        onClose={() => setIsAdminCommissionModalOpen(false)}
      />
    </div>
  );
};
