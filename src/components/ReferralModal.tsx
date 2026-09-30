import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  X, 
  Users, 
  Copy, 
  Check, 
  Sparkles, 
  Gift, 
  ArrowRight, 
  Share2, 
  Coins, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    currentRole, 
    referrals, 
    simulateFriendReferral, 
    completeReferredUserTask 
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendEmailInput, setFriendEmailInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const refCode = currentUser.referralCode || `EARN-${currentUser.name.replace(/\s+/g, '').toUpperCase().slice(0, 5)}99`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tubeearn.app';
  const referralLink = `${origin}/?portal=${currentRole === 'creator' ? 'creator' : 'user'}&ref=${refCode}`;

  const myReferrals = referrals.filter(r => r.referrerId === currentUser.uid || r.referrerName === currentUser.name);
  const totalEarned = currentUser.referralEarnings || myReferrals.reduce((acc, r) => acc + r.totalRewardEarned, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join TubeEarn through my referral link! Earn verified daily rewards for video engagement. Get a ₹5.00 welcome bonus upon signup: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSimulateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setFeedbackMsg(null);

    const name = friendNameInput.trim() || `Friend #${Math.floor(100 + Math.random() * 900)}`;
    const email = friendEmailInput.trim() || `friend_${Date.now().toString().slice(-4)}@example.com`;

    const res = await simulateFriendReferral(name, email);
    setIsSimulating(false);

    if (res.success) {
      setFeedbackMsg({ text: res.message });
      setFriendNameInput('');
      setFriendEmailInput('');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      setFeedbackMsg({ text: res.message, isError: true });
    }
  };

  const handleClaimTaskMilestone = async (referralId: string) => {
    const res = await completeReferredUserTask(referralId);
    if (res.success) {
      setFeedbackMsg({ text: res.message });
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } else {
      setFeedbackMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Invite &amp; Earn ₹2 + ₹2</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                  Double Reward
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Earn ₹2 when a friend completes onboarding + ₹2 when they finish their first task!
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Referral Rewards</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                ₹{totalEarned.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Friends Referred</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">
                {myReferrals.length} Users
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block font-medium">Your Referral Code</span>
              <span className="text-base font-bold text-amber-400 font-mono mt-1 block tracking-wider truncate">
                {refCode}
              </span>
            </div>
          </div>

          {/* 2-Step Reward Explanation Cards */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/20 space-y-3">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              How You Get Rewarded (₹4.00 Total per Friend)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    Stage 1: Onboarding
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[11px]">
                    +₹2.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Friend joins with your link &amp; completes basic profile or social setup. ₹2.00 credited immediately.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    Stage 2: 1st Task / Order
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-bold text-[11px]">
                    +₹2.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Friend watches their first video &amp; submits verified feedback or creates campaign. ₹2.00 unlocked!
                </p>
              </div>
            </div>
          </div>

          {/* Share Links Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Your Exclusive Referral Link</span>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share on WhatsApp
              </button>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code: <span className="font-mono font-bold text-amber-400">{refCode}</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Simulation & Test Station */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Instant Referral Reward Simulation Station
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simulate inviting a friend now to test live wallet balance crediting and double-entry ledger logging!
                </p>
              </div>
            </div>

            {feedbackMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedbackMsg.isError ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              }`}>
                {feedbackMsg.isError ? <X className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSimulateReferral} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Friend name (e.g. Rahul Sharma)..."
                value={friendNameInput}
                onChange={e => setFriendNameInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Simulate Onboard (+₹2)</span>
              </button>
            </form>
          </div>

          {/* Referrals List & Milestone Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Your Referred Friends ({myReferrals.length})
              </span>
              <span className="text-[11px]">₹2 Onboarding &bull; ₹2 First Task</span>
            </div>

            {myReferrals.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                <Users className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">No referrals yet</p>
                <p className="text-[11px] text-slate-500">Share your link or use the simulation button above to invite your first friend!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myReferrals.map(r => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                        {r.referredUserName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{r.referredUserName}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                            r.status === 'first_task_completed'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {r.status === 'first_task_completed' ? '1st Task Done (₹4)' : 'Onboarded (₹2)'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Joined {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="text-right mr-1">
                        <span className="text-[10px] text-slate-400 block">Total Reward</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          +₹{r.totalRewardEarned.toFixed(2)}
                        </span>
                      </div>

                      {/* If waiting for 1st task milestone, allow completing it */}
                      {!r.firstTaskRewardPaid && (
                        <button
                          onClick={() => handleClaimTaskMilestone(r.id)}
                          className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                          title="Simulate this friend completing their first video review task"
                        >
                          <Zap className="w-3 h-3 text-purple-400" />
                          <span>Complete 1st Task (+₹2)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>₹2.00 onboarding + ₹2.00 first order/task guarantee</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
