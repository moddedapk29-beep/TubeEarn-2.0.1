import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Smartphone, 
  Building, 
  ShieldCheck, 
  RefreshCw,
  Coins
} from 'lucide-react';
import { validateUpiVpa, resolveBankFromVpa } from '../utils/upiGateway';
import confetti from 'canvas-confetti';

interface AdminCommissionWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCommissionWithdrawModal: React.FC<AdminCommissionWithdrawModalProps> = ({
  isOpen,
  onClose
}) => {
  const { adminCommissionBalance, withdrawAdminCommission, currentUser } = useApp();

  const [amount, setAmount] = useState<number>(Math.min(5000, Math.floor(adminCommissionBalance)));
  const [upiId, setUpiId] = useState<string>(currentUser.bankDetails?.upiId || 'tubeearn.treasury@icici');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<{
    utr: string;
    amount: number;
    upiId: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Please specify an amount greater than ₹0.');
      return;
    }

    if (amount > adminCommissionBalance) {
      setError(`Requested amount exceeds available commission balance (₹${adminCommissionBalance.toFixed(2)}).`);
      return;
    }

    if (!validateUpiVpa(upiId)) {
      setError('Please enter a valid virtual payment address (e.g. name@bank).');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await withdrawAdminCommission(amount, upiId);
      setIsProcessing(false);

      if (res.success) {
        setPayoutResult({
          utr: res.utr,
          amount,
          upiId,
          message: res.message
        });
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Error executing UPI commission payout.');
    }
  };

  const resolvedBank = resolveBankFromVpa(upiId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-amber-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Withdraw Admin Commission via UPI</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                  TREASURY
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct real-time payout of accumulated platform fees</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {payoutResult ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">UPI Commission Payout Disbursed!</h3>
                <p className="text-xs text-emerald-300 mt-1">{payoutResult.message}</p>
              </div>

              {/* Payout Slip */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Disbursed Amount:</span>
                  <span className="text-emerald-400 font-bold text-sm">₹{payoutResult.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bank UTR Number:</span>
                  <span className="text-white font-bold">{payoutResult.utr}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recipient UPI VPA:</span>
                  <span className="text-slate-200">{payoutResult.upiId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gateway Settlement:</span>
                  <span className="text-emerald-400">NPCI IMPS Fast Rail</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Remaining Commission Balance:</span>
                  <span className="text-amber-400 font-bold">₹{adminCommissionBalance.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/20"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              
              {/* Balance card */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-300 block">Available Admin Commission</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    ₹{adminCommissionBalance.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-amber-400/80">
                    Accumulated from ₹2.00/task platform commission
                  </span>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setAmount(Math.floor(adminCommissionBalance))}
                    className="text-xs font-bold text-amber-400 hover:underline px-2.5 py-1 bg-amber-500/20 rounded-lg border border-amber-500/30"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Commission Payout Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={adminCommissionBalance}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Destination UPI VPA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Destination UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. admin.treasury@icici or name@okaxis"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />

                {upiId && (
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Routing to: {resolvedBank.bankName}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || amount <= 0 || amount > adminCommissionBalance}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Initiating Instant UPI Disbursement...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Disburse ₹{amount.toFixed(2)} to UPI
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center">
                Disbursements are processed via automated UPI IMPS Gateway with real bank UTR generation.
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
