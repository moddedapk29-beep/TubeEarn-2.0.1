import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Campaign, PlatformType, TaskType } from '../types';
import { 
  Play, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Award,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Gift,
  Copy,
  Check,
  Zap,
  Users
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, FacebookIcon } from './SocialIcons';
import { TransactionLedger } from './TransactionLedger';
import { verifyTaskWithAI } from '../gemini';
import confetti from 'canvas-confetti';

interface UserDashboardProps {
  onOpenWallet: () => void;
  onOpenSocials: () => void;
  onOpenReferral?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onOpenWallet, onOpenSocials, onOpenReferral }) => {
  const { campaigns, currentUser, submitTask, simulateFriendReferral } = useApp();

  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulatingRef, setSimulatingRef] = useState(false);
  const [refNotification, setRefNotification] = useState<string | null>(null);
  
  // Task Execution Modal State
  const [activeTaskCampaign, setActiveTaskCampaign] = useState<Campaign | null>(null);
  const [watchSeconds, setWatchSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    score?: number;
    feedbackQuality?: string;
    summary?: string;
    error?: string;
  } | null>(null);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (c.status !== 'active') return false;
    if (selectedPlatform !== 'all' && c.platform !== selectedPlatform) return false;
    if (selectedTaskType !== 'all' && c.taskType !== selectedTaskType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.creatorName.toLowerCase().includes(q) ||
        c.channelOrHandle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const startTaskExecution = (campaign: Campaign) => {
    setActiveTaskCampaign(campaign);
    setWatchSeconds(0);
    setIsTimerRunning(true);
    setFeedbackText('');
    setQuestionAnswers({});
    setVerificationResult(null);
  };

  // Watch timer simulation
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeTaskCampaign) {
      interval = setInterval(() => {
        setWatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeTaskCampaign]);

  const handleSubmitTask = async () => {
    if (!activeTaskCampaign) return;

    if (feedbackText.trim().length < 20) {
      setVerificationResult({ error: 'Please provide at least 20 characters of substantive feedback.' });
      return;
    }

    if (watchSeconds < activeTaskCampaign.minimumWatchTimeSeconds * 0.7) {
      setVerificationResult({
        error: `Please watch for at least ${Math.round(activeTaskCampaign.minimumWatchTimeSeconds * 0.7)} seconds before submitting (Logged: ${watchSeconds}s).`
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    // Call Gemini 3.5 Flash task verification
    const formattedAnswers = (activeTaskCampaign.verificationPrompts || []).map(p => ({
      question: p.question,
      answer: questionAnswers[p.question] || 'Reviewed in video'
    }));

    const aiRes = await verifyTaskWithAI({
      campaignTitle: activeTaskCampaign.title,
      taskType: activeTaskCampaign.taskType,
      userFeedback: feedbackText,
      answers: formattedAnswers,
      watchDurationSeconds: watchSeconds,
      minimumWatchTimeSeconds: activeTaskCampaign.minimumWatchTimeSeconds
    });

    if (aiRes.isAccepted) {
      // Settle into state
      await submitTask(activeTaskCampaign.id, feedbackText, formattedAnswers, watchSeconds);
      
      setVerificationResult({
        score: aiRes.score,
        feedbackQuality: aiRes.feedbackQuality,
        summary: aiRes.feedbackSummary
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => {
        setActiveTaskCampaign(null);
      }, 2500);
    } else {
      setVerificationResult({
        error: aiRes.feedbackSummary || 'Submission did not meet authenticity standards. Please expand your review.'
      });
    }

    setIsVerifying(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-500/20 p-6 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-red-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Compliant Creator Marketplace &bull; Legitimate Research Tasks
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover Content. Review Creators. <span className="text-red-500">Earn Daily.</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Get paid ₹1.00 to ₹2.50 per task for discovering new creators, writing constructive feedback, and participating in audience surveys. Minimum withdrawal is strictly <span className="font-bold text-white">₹299</span> directly to UPI or bank.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Earner:</span>
              <span className="font-bold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                {currentUser.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Available:</span>
              <span className="font-bold text-emerald-400 font-mono">₹{currentUser.walletBalance.toFixed(2)}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Lifetime Earned:</span>
              <span className="font-bold text-white font-mono">₹{currentUser.lifetimeEarned.toFixed(2)}</span>
            </div>

            <button
              onClick={onOpenWallet}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
            >
              Withdraw (₹299+)
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Refer & Earn ₹2 + ₹2 Showcase Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <Gift className="w-3.5 h-3.5" />
              REFERRAL REWARD PROGRAM &bull; UNLIMITED ₹2 + ₹2
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Invite Friends &bull; Get <span className="text-emerald-400">₹2 on Onboarding</span> + <span className="text-purple-400">₹2 on First Task</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Share your referral link with users or creators. When they complete onboarding, you get <strong className="text-emerald-400">₹2.00 instant reward</strong> in your wallet. When they complete 1 task, you receive another <strong className="text-purple-400">₹2.00 milestone bonus</strong>!
            </p>
          </div>

          {/* Referral Stats & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Referred</span>
              <span className="text-sm font-extrabold text-white font-mono">{currentUser.referralCount || 0} Users</span>
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

        {/* Link & Code Bar + Instant Simulation Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Referral Code */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Your Code:</span>
              <span className="font-mono font-bold text-amber-400 tracking-wider">
                {currentUser.referralCode || (currentUser.customUserId ? `EARN-${currentUser.customUserId.replace(/[^A-Za-z0-9]/g, '')}` : 'EARN-BONUS')}
              </span>
              <button
                onClick={() => {
                  const refCode = currentUser.referralCode || (currentUser.customUserId ? `EARN-${currentUser.customUserId.replace(/[^A-Za-z0-9]/g, '')}` : 'EARN-BONUS');
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

            {/* Direct Referral Link */}
            <button
              onClick={() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tubeearn.app';
                const link = `${origin}/?portal=user&ref=${currentUser.referralCode || (currentUser.customUserId ? `EARN-${currentUser.customUserId.replace(/[^A-Za-z0-9]/g, '')}` : 'EARN-BONUS')}`;
                navigator.clipboard.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link (?ref=...)'}</span>
            </button>
          </div>

          {/* Quick Simulation / Test Referral Button */}
          <button
            disabled={simulatingRef}
            onClick={async () => {
              setSimulatingRef(true);
              const testNum = Math.floor(100 + Math.random() * 900);
              const res = await simulateFriendReferral(`Referred User #${testNum}`, `user_${testNum}@example.com`);
              setSimulatingRef(false);
              if (res.success) {
                confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                setRefNotification(res.message);
                setTimeout(() => setRefNotification(null), 4000);
              }
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            title="Simulate a new friend completing onboarding to receive ₹2.00 reward instantly"
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, creators, channels..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Platform Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Platforms' },
            { id: 'youtube', label: 'YouTube', icon: YoutubeIcon },
            { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
            { id: 'facebook', label: 'Facebook', icon: FacebookIcon }
          ].map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedPlatform === p.id
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {p.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Available Discovery Campaigns ({filteredCampaigns.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Guaranteed 1,000+ participant escrow reserve
          </span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No campaigns match your filters</h3>
            <p className="text-xs text-slate-500">Try clearing your search query or selecting "All Platforms"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map(camp => {
              const spotsLeft = camp.requiredParticipants - camp.completedParticipants;
              const percent = Math.min(100, Math.round((camp.completedParticipants / camp.requiredParticipants) * 100));

              return (
                <div
                  key={camp.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-red-500/5 group"
                >
                  <div className="space-y-3">
                    
                    {/* Top Row: Platform & Reward Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {camp.platform === 'youtube' && (
                          <span className="px-2 py-0.5 rounded-md bg-red-600/10 text-red-400 border border-red-500/20 text-[10px] font-bold flex items-center gap-1">
                            <YoutubeIcon className="w-3 h-3" /> YouTube
                          </span>
                        )}
                        {camp.platform === 'instagram' && (
                          <span className="px-2 py-0.5 rounded-md bg-pink-600/10 text-pink-400 border border-pink-500/20 text-[10px] font-bold flex items-center gap-1">
                            <InstagramIcon className="w-3 h-3" /> Instagram
                          </span>
                        )}
                        {camp.platform === 'facebook' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold flex items-center gap-1">
                            <FacebookIcon className="w-3 h-3" /> Facebook
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {camp.taskType.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Reward Badge */}
                      <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono font-bold text-xs flex items-center gap-1 shadow-sm">
                        <span>Reward:</span>
                        <span className="text-sm">₹{camp.userRewardPerTask.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {camp.description}
                      </p>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <img 
                        src={camp.creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(camp.creatorName)}`}
                        alt={camp.creatorName}
                        className="w-5 h-5 rounded-full object-cover border border-slate-700"
                      />
                      <span className="font-medium text-slate-300 text-xs">{camp.creatorName}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-slate-500 font-mono text-[11px]">{camp.channelOrHandle}</span>
                    </div>

                    {/* Minimum 1,000 Participants Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Participants Goal (Min 1,000):</span>
                        <span className="font-mono text-slate-300 font-semibold">
                          {camp.completedParticipants} / {camp.requiredParticipants} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Action Button */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 mt-4">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Min Watch: <span className="text-slate-300 font-mono">{camp.minimumWatchTimeSeconds}s</span>
                    </div>

                    <button
                      onClick={() => startTaskExecution(camp)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start Task (& earn ₹{camp.userRewardPerTask.toFixed(2)})
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Firestore Wallet Transactions Ledger */}
      <div className="pt-4">
        <TransactionLedger userId={currentUser.uid} showHeader={true} />
      </div>

      {/* Task Execution Modal */}
      {activeTaskCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{activeTaskCampaign.title}</h3>
                  <p className="text-[11px] text-slate-400">Authentic Engagement &amp; Feedback Task</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTaskCampaign(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* Destination Card & Timer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Content Destination URL:</span>
                  <a
                    href={activeTaskCampaign.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    Open in {activeTaskCampaign.platform}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Simulated Timer Counter */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${watchSeconds >= activeTaskCampaign.minimumWatchTimeSeconds ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
                    <span className="text-xs text-slate-300 font-medium">Watch Duration Logged:</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-white">
                    {watchSeconds}s / {activeTaskCampaign.minimumWatchTimeSeconds}s required
                  </div>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      watchSeconds >= activeTaskCampaign.minimumWatchTimeSeconds ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (watchSeconds / activeTaskCampaign.minimumWatchTimeSeconds) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Research Questions from Creator */}
              {activeTaskCampaign.verificationPrompts && activeTaskCampaign.verificationPrompts.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-200">
                    Creator's Verification &amp; Comprehension Questions:
                  </label>
                  {activeTaskCampaign.verificationPrompts.map((vp, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs text-slate-400 font-medium">Q{idx+1}: {vp.question}</p>
                      <input
                        type="text"
                        placeholder="Your observation / answer..."
                        value={questionAnswers[vp.question] || ''}
                        onChange={e => setQuestionAnswers({ ...questionAnswers, [vp.question]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Constructive Review Text Area */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Constructive Review / Video Feedback (Minimum 20 characters):
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Share thoughtful feedback on audio, editing pace, content clarity, and what stood out to you..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Gemini 3.5 Flash evaluates authenticity and depth</span>
                  <span>{feedbackText.length} chars</span>
                </div>
              </div>

              {/* Result / Error Notification */}
              {verificationResult?.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verificationResult.error}</span>
                </div>
              )}

              {verificationResult?.score && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    AI Verification Passed! (Quality Score: {verificationResult.score}/100)
                  </div>
                  <p className="text-[11px] text-emerald-300/80">{verificationResult.summary}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Reward: <span className="font-bold text-emerald-400 font-mono">₹{activeTaskCampaign.userRewardPerTask.toFixed(2)}</span>
              </div>

              <button
                onClick={handleSubmitTask}
                disabled={isVerifying || feedbackText.length < 20 || watchSeconds < Math.round(activeTaskCampaign.minimumWatchTimeSeconds * 0.7)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-40 flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <BrainCircuit className="w-4 h-4 animate-spin" />
                    Verifying with Gemini AI...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit &amp; Claim Reward
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
