import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Campaign, PlatformType, TaskType } from '../types';
import { UpiPaymentGatewayModal } from './UpiPaymentGatewayModal';
import { 
  Tv, 
  Plus, 
  Sparkles, 
  Lock, 
  Wallet, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  BrainCircuit, 
  Coins,
  Gift,
  Copy,
  Check,
  Zap,
  Smartphone,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, FacebookIcon } from './SocialIcons';
import { TransactionLedger } from './TransactionLedger';
import { generateCampaignOptimizer } from '../gemini';
import confetti from 'canvas-confetti';

interface CreatorDashboardProps {
  onOpenWallet: () => void;
  onOpenReferral?: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onOpenWallet, onOpenReferral }) => {
  const { currentUser, campaigns, createCampaign, simulateFriendReferral } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpiGatewayOpen, setIsUpiGatewayOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('youtube');
  const [taskType, setTaskType] = useState<TaskType>('video_feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [channelOrHandle, setChannelOrHandle] = useState(currentUser.connectedAccounts.youtube?.handle || '@MyCreatorChannel');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulatingRef, setSimulatingRef] = useState(false);
  const [refNotification, setRefNotification] = useState<string | null>(null);
  
  // Mandatory Minimum 1,000 Participants
  const [requiredParticipants, setRequiredParticipants] = useState<number>(1000);
  const [creatorCostPerTask, setCreatorCostPerTask] = useState<number>(3.0); // ₹3.00 default
  const [userRewardPerTask, setUserRewardPerTask] = useState<number>(1.0); // ₹1.00 default
  const [minimumWatchTimeSeconds, setMinimumWatchTimeSeconds] = useState<number>(90);
  
  // Verification Prompts
  const [verificationPrompts, setVerificationPrompts] = useState<{ question: string; expectedEvidence: string }[]>([
    { question: 'What was the main topic introduced in the first 2 minutes?', expectedEvidence: 'Accurate topic overview' },
    { question: 'What audio or lighting improvement would you suggest?', expectedEvidence: 'Constructive technical feedback' }
  ]);

  // AI Optimizer State
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalBudget = requiredParticipants * creatorCostPerTask;
  const platformFee = Math.max(0, creatorCostPerTask - userRewardPerTask);

  const creatorCampaigns = campaigns.filter(c => c.creatorId === currentUser.uid || currentUser.role === 'admin');

  // AI Optimizer with Gemini 3.5 Flash
  const handleAIOptimize = async () => {
    setIsAiOptimizing(true);
    setErrorMessage(null);

    try {
      const opt = await generateCampaignOptimizer({
        platform,
        topicOrChannel: channelOrHandle,
        goal: 'Get authentic video feedback, sound critique, and audience research'
      });

      setTitle(opt.optimizedTitle);
      setDescription(opt.description);
      setVerificationPrompts(opt.verificationQuestions);
      setMinimumWatchTimeSeconds(opt.suggestedDurationSeconds);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage("AI Optimizer temporarily unavailable, please fill manually.");
    } finally {
      setIsAiOptimizing(false);
    }
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Hard Rule 1: Minimum 1,000 Participants
    if (requiredParticipants < 1000) {
      setErrorMessage("Strict Rule: Campaigns must require at least 1,000 participants (Current: " + requiredParticipants + ").");
      return;
    }

    // Hard Rule 2: Budget check
    if (currentUser.walletBalance < totalBudget) {
      setErrorMessage(
        `Insufficient Creator Funds. Required budget is ₹${totalBudget.toFixed(2)}, but your wallet balance is ₹${currentUser.walletBalance.toFixed(2)}. Please add funds first.`
      );
      return;
    }

    if (!title || !targetUrl) {
      setErrorMessage("Please fill in campaign title and destination URL.");
      return;
    }

    const res = await createCampaign({
      platform,
      taskType,
      title,
      description,
      targetUrl,
      channelOrHandle,
      requiredParticipants,
      creatorCostPerTask,
      userRewardPerTask,
      platformFeePerTask: platformFee,
      verificationPrompts,
      minimumWatchTimeSeconds,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (res.success) {
      setSuccessMessage(res.message);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      setTimeout(() => {
        setIsCreating(false);
        setSuccessMessage(null);
      }, 2000);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Creator Studio Identity Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=f43f5e&color=fff`} 
            alt={currentUser.name}
            className="w-12 h-12 rounded-2xl border-2 border-rose-500/40 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">{currentUser.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase font-bold">
                Creator Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {currentUser.connectedAccounts.youtube?.channelName || 'Studio Account'} &bull; {currentUser.connectedAccounts.youtube?.handle || '@creator'} &bull; Min. 1,000 participant escrow reserve
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Close Creator Form' : 'New Campaign (1,000+ Viewers)'}</span>
          </button>
        </div>
      </div>

      {/* Creator Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Creator Escrow Wallet Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Available Escrow (In App)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ₹{currentUser.walletBalance.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500">Ready to launch campaigns or withdraw via UPI</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => setIsUpiGatewayOpen(true)}
              className="py-1.5 px-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            >
              <QrCode className="w-3 h-3" />
              Deposit UPI
            </button>
            <button
              onClick={onOpenWallet}
              className="py-1.5 px-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            >
              <Smartphone className="w-3 h-3" />
              Withdraw UPI
            </button>
          </div>
        </div>

        {/* Escrow Locked */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Escrow Locked</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-amber-400 font-mono">
              ₹{currentUser.lockedBalance.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500">Reserved for active participant rewards</p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Immutable Escrow Safe</span>
        </div>

        {/* Total Spent */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Lifetime Campaign Spend</span>
            <Coins className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono">
              ₹{currentUser.lifetimeSpent.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500">Distributed to legitimate reviewers</p>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Policy Compliant
          </span>
        </div>

        {/* Active Campaigns */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Campaigns</span>
            <Tv className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono">
              {creatorCampaigns.length}
            </div>
            <p className="text-[11px] text-slate-500">Minimum 1,000 participants each</p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Guaranteed Scale</span>
        </div>

      </div>

      {/* Creator Escrow Wallet & Real UPI Gateway Architecture Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">TubeEarn Real UPI Escrow System</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                Zero Gateway Fee &bull; 100% In-App Escrow
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Deposit payments via Google Pay, PhonePe, Paytm, or BHIM directly into your <strong>Escrow Wallet</strong>. Keep funds safely in-app to launch video campaigns (1,000+ viewers) or withdraw remaining balance back via UPI anytime (min ₹299).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setIsUpiGatewayOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Deposit via UPI
          </button>
          <button
            onClick={onOpenWallet}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Withdraw via UPI
          </button>
        </div>
      </div>

      {/* Creator Referral Rewards Program Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-rose-950/30 border border-emerald-500/30 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <Gift className="w-3.5 h-3.5" />
              CREATOR &amp; EARNER REFERRALS &bull; EARN ₹2 + ₹2
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Refer Users &amp; Fellow Creators &bull; <span className="text-emerald-400">₹2 Onboarding</span> + <span className="text-purple-400">₹2 First Order / Task</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              When someone registers with your creator code, you earn <strong className="text-emerald-400">₹2.00 instant reward</strong> as soon as they complete onboarding. When they complete an order or task, you receive another <strong className="text-purple-400">₹2.00 milestone reward</strong> credited directly to your creator escrow wallet!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Referred</span>
              <span className="text-sm font-extrabold text-white font-mono">{currentUser.referralCount || 0}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Earned</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">₹{(currentUser.referralEarnings || 0).toFixed(2)}</span>
            </div>
            {onOpenReferral && (
              <button
                onClick={onOpenReferral}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Referral Hub</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Creator Code:</span>
              <span className="font-mono font-bold text-amber-400 tracking-wider">
                {currentUser.referralCode || (currentUser.customUserId ? `STUDIO-${currentUser.customUserId.replace(/[^A-Za-z0-9]/g, '')}` : 'STUDIO-CREATOR')}
              </span>
              <button
                onClick={() => {
                  const refCode = currentUser.referralCode || (currentUser.customUserId ? `STUDIO-${currentUser.customUserId.replace(/[^A-Za-z0-9]/g, '')}` : 'STUDIO-CREATOR');
                  navigator.clipboard.writeText(refCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="text-slate-400 hover:text-white p-1"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tubeearn.app';
                const refCode = currentUser.referralCode || (currentUser.customUserId ? `STUDIO-${currentUser.customUserId.replace(/[^A-Za-z0-9]/g, '')}` : 'STUDIO-CREATOR');
                const link = `${origin}/?portal=creator&ref=${refCode}`;
                navigator.clipboard.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Creator Referral Link'}</span>
            </button>
          </div>

          <button
            disabled={simulatingRef}
            onClick={async () => {
              setSimulatingRef(true);
              const testNum = Math.floor(100 + Math.random() * 900);
              const res = await simulateFriendReferral(`Creator / Reviewer #${testNum}`, `partner_${testNum}@example.com`);
              setSimulatingRef(false);
              if (res.success) {
                confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                setRefNotification(res.message);
                setTimeout(() => setRefNotification(null), 4000);
              }
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            title="Simulate someone completing onboarding with your link to test ₹2 reward"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{simulatingRef ? 'Simulating...' : '⚡ Test ₹2 Onboarding Reward'}</span>
          </button>
        </div>

        {refNotification && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{refNotification}</span>
          </div>
        )}
      </div>

      {/* Campaign Launcher Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Creator Campaigns
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {creatorCampaigns.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400">Real audience discovery and high-value constructive feedback</p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'Cancel Wizard' : 'Launch New Campaign (Min 1,000)'}
        </button>
      </div>

      {/* CREATE CAMPAIGN WIZARD */}
      {isCreating && (
        <form onSubmit={handleLaunchCampaign} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Launch Compliant Engagement Campaign
                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-mono">
                  Min 1,000 Participants
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Funds are held in secure escrow and released only upon automated server-side verification.
              </p>
            </div>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={handleAIOptimize}
              disabled={isAiOptimizing}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <BrainCircuit className={`w-3.5 h-3.5 ${isAiOptimizing ? 'animate-spin' : ''}`} />
              {isAiOptimizing ? 'Optimizing with Gemini...' : 'AI Campaign Generator'}
            </button>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Social Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'youtube', label: 'YouTube', icon: YoutubeIcon },
                  { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
                  { id: 'facebook', label: 'Facebook', icon: FacebookIcon }
                ].map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id as PlatformType)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        platform === p.id 
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permitted Task Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Permitted Task Type (YouTube / Meta Policy Compliant)
              </label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value as TaskType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                <option value="video_feedback">Video Feedback &amp; Critique (Audio, Camera, Pacing)</option>
                <option value="content_discovery">Content Discovery &amp; Comprehension Takeaways</option>
                <option value="watch_and_review">Watch &amp; Thoughtful Review</option>
                <option value="audience_survey">Audience Research &amp; Preferences Survey</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Watch & Review: Smartphone Camera Shootout 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            {/* Channel Handle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Channel / Creator Handle</label>
              <input
                type="text"
                value={channelOrHandle}
                onChange={e => setChannelOrHandle(e.target.value)}
                placeholder="e.g. @MyCreatorChannel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            {/* Destination URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Content URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/reel/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Task Instructions for Users</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Specify what segment of content to watch and what aspects to critique..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            {/* Participants (Min 1,000) & Watch Time */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Participants Required (Strict Min 1,000)
                </label>
                {requiredParticipants < 1000 && (
                  <span className="text-[10px] text-rose-400 font-bold">&times; Must be &ge; 1,000</span>
                )}
              </div>
              <input
                type="number"
                min="1000"
                step="50"
                value={requiredParticipants}
                onChange={e => setRequiredParticipants(Number(e.target.value))}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                  requiredParticipants < 1000 ? 'border-rose-500 text-rose-400' : 'border-slate-800 focus:border-red-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Watch Time Required (Seconds)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                step="10"
                value={minimumWatchTimeSeconds}
                onChange={e => setMinimumWatchTimeSeconds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
              />
            </div>

          </div>

          {/* Pricing Economics Breakdown Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Transparent Wallet Economics Breakdown
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Creator Cost/Task</span>
                <span className="text-sm font-bold text-white font-mono">₹{creatorCostPerTask.toFixed(2)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">User Receives</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">₹{userRewardPerTask.toFixed(2)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Platform Reserve</span>
                <span className="text-sm font-bold text-slate-300 font-mono">₹{platformFee.toFixed(2)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30">
                <span className="text-[10px] text-red-300 block">Total Escrow Required</span>
                <span className="text-sm font-black text-red-400 font-mono">₹{totalBudget.toFixed(2)}</span>
              </div>

            </div>

            <div className="text-[11px] text-slate-400">
              Calculation: {requiredParticipants} participants &times; ₹{creatorCostPerTask.toFixed(2)} = ₹{totalBudget.toFixed(2)}. 
              Available in your wallet: <span className="font-bold text-emerald-400 font-mono">₹{currentUser.walletBalance.toFixed(2)}</span>.
            </div>
          </div>

          {/* Error / Success Feedback */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={requiredParticipants < 1000 || currentUser.walletBalance < totalBudget}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-40 flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Escrow &amp; Launch (₹{totalBudget.toFixed(2)})
            </button>
          </div>

        </form>
      )}

      {/* Campaigns Listing */}
      <div className="space-y-4">
        {creatorCampaigns.map(camp => {
          const percent = Math.min(100, Math.round((camp.completedParticipants / camp.requiredParticipants) * 100));

          return (
            <div 
              key={camp.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/10 text-red-400 border border-red-500/20 uppercase">
                    {camp.platform}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {camp.taskType.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {camp.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{camp.title}</h3>
                
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Target: <span className="font-mono text-slate-200">{camp.requiredParticipants} participants</span></span>
                  <span>&bull;</span>
                  <span>Escrow: <span className="font-mono text-emerald-400 font-bold">₹{camp.totalBudget.toFixed(2)}</span></span>
                  <span>&bull;</span>
                  <a href={camp.targetUrl} target="_blank" rel="noreferrer" className="text-red-400 hover:underline flex items-center gap-1">
                    Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progress: {camp.completedParticipants} / {camp.requiredParticipants}</span>
                    <span className="font-mono font-bold text-slate-300">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>

              {/* Status / Analytics */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <div className="text-right mr-2 hidden sm:block">
                  <span className="text-[11px] text-slate-400 block">Creator Cost</span>
                  <span className="text-xs font-mono font-bold text-white">₹{camp.creatorCostPerTask.toFixed(2)}/task</span>
                </div>
                <div className="p-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-700">
                  {camp.completedParticipants >= camp.requiredParticipants ? 'Completed' : 'Running'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Firestore Creator Wallet Transactions Ledger */}
      <div className="pt-4">
        <TransactionLedger userId={currentUser.uid} showHeader={true} />
      </div>

      {/* Real UPI Payment Gateway Modal for Creator Escrow Deposits */}
      <UpiPaymentGatewayModal
        isOpen={isUpiGatewayOpen}
        onClose={() => setIsUpiGatewayOpen(false)}
        defaultAmount={3000}
      />

    </div>
  );
};
