import { Campaign, UserProfile, WalletTransaction, WithdrawalRequest, FraudSignalLog, ReferralRecord } from './types';

export const initialCampaigns: Campaign[] = [
  {
    id: 'camp_101',
    creatorId: 'creator_tech_pro',
    creatorName: 'TechVibe India',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    platform: 'youtube',
    taskType: 'video_feedback',
    title: 'Watch & Review: Smartphone Camera Shootout 2026',
    description: 'Watch the first 120 seconds of our blind camera test. Submit constructive feedback on audio equalization, color grading, and which phone sample looked most natural.',
    targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    channelOrHandle: '@TechVibeIndia',
    requiredParticipants: 1500, // Meets >= 1000 minimum
    completedParticipants: 842,
    creatorCostPerTask: 3.0,
    userRewardPerTask: 1.0,
    platformFeePerTask: 2.0,
    totalBudget: 4500.0,
    escrowLocked: 4500.0,
    status: 'active',
    minimumWatchTimeSeconds: 90,
    verificationPrompts: [
      { question: 'Which lighting condition was tested in the first scene?', expectedEvidence: 'Sunset / low light studio' },
      { question: 'What is one concrete improvement for the microphone audio?', expectedEvidence: 'Constructive acoustic note' }
    ],
    createdAt: '2026-09-27T10:00:00Z',
    expiresAt: '2026-10-15T23:59:59Z'
  },
  {
    id: 'camp_102',
    creatorId: 'creator_finance_hub',
    creatorName: 'SmartRupee Insights',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    platform: 'youtube',
    taskType: 'content_discovery',
    title: 'Audience Research: Mutual Funds vs Index Funds Explained',
    description: 'Discover our educational breakdown. Identify the 3 risk factors explained at timestamp 01:45 and answer our brief investor comprehension survey.',
    targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    channelOrHandle: '@SmartRupeeOfficial',
    requiredParticipants: 2000, // Meets >= 1000 minimum
    completedParticipants: 1210,
    creatorCostPerTask: 3.5,
    userRewardPerTask: 1.2,
    platformFeePerTask: 2.3,
    totalBudget: 7000.0,
    escrowLocked: 7000.0,
    status: 'active',
    minimumWatchTimeSeconds: 100,
    verificationPrompts: [
      { question: 'What was the expense ratio benchmark mentioned in slide 2?', expectedEvidence: 'Under 0.25%' },
      { question: 'Who is this video best suited for based on the intro?', expectedEvidence: 'Beginner / retail investors' }
    ],
    createdAt: '2026-09-28T08:30:00Z',
    expiresAt: '2026-10-20T23:59:59Z'
  },
  {
    id: 'camp_103',
    creatorId: 'creator_fitness_guru',
    creatorName: 'FitLife Reels',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    platform: 'instagram',
    taskType: 'audience_survey',
    title: 'Post-Workout Mobility Reel: Form & Clarity Survey',
    description: 'Watch the full 60-second mobility routine reel. Review the clarity of voiceover coaching cues and submit which exercise was easiest to replicate.',
    targetUrl: 'https://instagram.com/reel/sample123',
    channelOrHandle: '@fitlife_daily',
    requiredParticipants: 1000, // Exact minimum 1000
    completedParticipants: 430,
    creatorCostPerTask: 3.0,
    userRewardPerTask: 1.0,
    platformFeePerTask: 2.0,
    totalBudget: 3000.0,
    escrowLocked: 3000.0,
    status: 'active',
    minimumWatchTimeSeconds: 50,
    verificationPrompts: [
      { question: 'What stretch was performed using the doorway?', expectedEvidence: 'Pec / chest opener' },
      { question: 'Rate the tempo of the background audio track', expectedEvidence: 'Appropriate tempo critique' }
    ],
    createdAt: '2026-09-28T14:15:00Z',
    expiresAt: '2026-10-10T23:59:59Z'
  },
  {
    id: 'camp_104',
    creatorId: 'creator_gaming_den',
    creatorName: 'ByteCraft Gaming',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    platform: 'facebook',
    taskType: 'watch_and_review',
    title: 'Indie Game Highlight: Mechanical Gameplay Breakdown',
    description: 'Watch our 3-minute first-look at the newly launched indie puzzle adventure. Provide detailed feedback on whether the commentary was engaging and informative.',
    targetUrl: 'https://facebook.com/watch/bytecraft',
    channelOrHandle: 'ByteCraftGaming',
    requiredParticipants: 1200, // Meets >= 1000 minimum
    completedParticipants: 915,
    creatorCostPerTask: 3.0,
    userRewardPerTask: 1.0,
    platformFeePerTask: 2.0,
    totalBudget: 3600.0,
    escrowLocked: 3600.0,
    status: 'active',
    minimumWatchTimeSeconds: 110,
    verificationPrompts: [
      { question: 'What puzzle mechanic was demonstrated in room 3?', expectedEvidence: 'Gravity shift / light reflection' }
    ],
    createdAt: '2026-09-26T16:00:00Z',
    expiresAt: '2026-10-12T23:59:59Z'
  }
];

export const initialUserProfiles: Record<string, UserProfile> = {
  'user_demo_1': {
    uid: 'user_demo_1',
    customUserId: 'USR-AARAV101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    role: 'user',
    kycStatus: 'verified',
    kycDocumentType: 'aadhaar',
    kycDocumentNumberMasked: 'XXXX-XXXX-8921',
    walletBalance: 342.0, // Over ₹299 threshold
    pendingBalance: 12.0,
    lockedBalance: 0.0,
    lifetimeEarned: 1450.0,
    lifetimeSpent: 0.0,
    accountStatus: 'active',
    referralCode: 'EARN-AARAV',
    referralCount: 3,
    referralEarnings: 8.0,
    connectedAccounts: {
      youtube: { connected: true, channelName: 'Aarav Tech Notes', handle: '@aarav_yt', verifiedAt: '2026-09-15' },
      instagram: { connected: true, handle: '@aarav.gram', verifiedAt: '2026-09-18' }
    },
    bankDetails: {
      upiId: 'aarav@okaxis',
      accountHolderName: 'Aarav Sharma',
      bankName: 'HDFC Bank Ltd',
      accountNumberMasked: 'XXXXXX4928',
      ifsc: 'HDFC0001234'
    },
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-29T02:00:00Z'
  },
  'creator_demo_1': {
    uid: 'creator_demo_1',
    customUserId: 'CRT-PRIYA202',
    name: 'Priya Patel (Creator)',
    email: 'priya.patel@creators.com',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    role: 'creator',
    kycStatus: 'verified',
    kycDocumentType: 'pan',
    kycDocumentNumberMasked: 'ABCDE1234F',
    walletBalance: 12450.0,
    escrowBalance: 16950.0, // Total escrow in app (12450 available + 4500 campaign lock)
    pendingBalance: 0.0,
    lockedBalance: 4500.0, // Locked in active campaigns
    lifetimeEarned: 0.0,
    lifetimeSpent: 28500.0,
    accountStatus: 'active',
    referralCode: 'STUDIO-PRIYA',
    referralCount: 4,
    referralEarnings: 12.0,
    bankDetails: {
      upiId: 'priya.creators@okhdfcbank',
      accountHolderName: 'Priya Patel',
      bankName: 'HDFC Bank Ltd',
      accountNumberMasked: 'XXXXXX9821',
      ifsc: 'HDFC0002491'
    },
    connectedAccounts: {
      youtube: { connected: true, channelName: 'Priya Studio Reviews', handle: '@priyastudios', verifiedAt: '2026-08-20' },
      instagram: { connected: true, handle: '@priya_creator', verifiedAt: '2026-08-22' }
    },
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-09-29T01:30:00Z'
  },
  'admin_demo_1': {
    uid: 'admin_demo_1',
    customUserId: 'ADM-SUPER',
    name: 'System Administrator',
    email: 'admin@tubeearn.internal',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    role: 'admin',
    kycStatus: 'verified',
    walletBalance: 98450.0,
    adminCommissionBalance: 14850.0, // Platform commission accumulated & withdrawable via UPI
    pendingBalance: 0.0,
    lockedBalance: 0.0,
    lifetimeEarned: 0.0,
    lifetimeSpent: 0.0,
    accountStatus: 'active',
    referralCode: 'ADMIN-ROOT',
    connectedAccounts: {},
    bankDetails: {
      upiId: 'tubeearn.treasury@icici',
      accountHolderName: 'TubeEarn Technologies Pvt Ltd',
      bankName: 'ICICI Bank Ltd',
      accountNumberMasked: 'XXXXXX5012',
      ifsc: 'ICIC0001092'
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  }
};

export const initialTransactions: WalletTransaction[] = [
  {
    id: 'tx_901',
    userId: 'user_demo_1',
    type: 'task_reward_settled',
    amount: 1.0,
    balanceAfter: 342.0,
    status: 'completed',
    referenceId: 'camp_101',
    description: 'Reward settled: Smartphone Camera Review feedback',
    createdAt: '2026-09-28T18:40:00Z'
  },
  {
    id: 'tx_902',
    userId: 'user_demo_1',
    type: 'task_reward_settled',
    amount: 1.2,
    balanceAfter: 341.0,
    status: 'completed',
    referenceId: 'camp_102',
    description: 'Reward settled: Mutual Funds vs Index Funds Research',
    createdAt: '2026-09-28T15:10:00Z'
  },
  {
    id: 'tx_903',
    userId: 'creator_demo_1',
    type: 'deposit',
    amount: 10000.0,
    balanceAfter: 16950.0,
    status: 'completed',
    referenceId: 'pay_rzp_894318',
    description: 'Creator wallet deposit via UPI / NetBanking',
    paymentMethod: 'UPI (Razorpay Gateway)',
    createdAt: '2026-09-27T09:15:00Z'
  },
  {
    id: 'tx_904',
    userId: 'creator_demo_1',
    type: 'campaign_budget_lock',
    amount: -4500.0,
    balanceAfter: 12450.0,
    status: 'completed',
    referenceId: 'camp_101',
    description: 'Escrow lock for 1,500 participants @ ₹3.00/task',
    createdAt: '2026-09-27T10:00:00Z'
  }
];

export const initialWithdrawals: WithdrawalRequest[] = [
  {
    id: 'wdr_501',
    userId: 'user_demo_1',
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@example.com',
    amount: 320.0, // >= ₹299
    method: 'upi',
    upiId: 'aarav@okaxis',
    status: 'completed',
    payoutRef: 'UPI_RR_98321049281',
    createdAt: '2026-09-25T11:20:00Z',
    processedAt: '2026-09-25T12:05:00Z'
  },
  {
    id: 'wdr_502',
    userId: 'user_demo_2',
    userName: 'Rohan Mehra',
    userEmail: 'rohan.m@example.com',
    amount: 450.0, // >= ₹299
    method: 'bank_transfer',
    bankAccountNumber: '0984102948192',
    ifsc: 'SBIN0004921',
    accountHolderName: 'Rohan Mehra',
    status: 'pending',
    createdAt: '2026-09-29T01:10:00Z'
  }
];

export const initialFraudSignals: FraudSignalLog[] = [
  {
    id: 'fs_001',
    userId: 'user_flagged_99',
    userName: 'FastBot Syndicate #4',
    riskScore: 92,
    signals: [
      'Impossible watch time: 4s logged for 120s required video',
      'Identical 38-character feedback text submitted across 14 accounts',
      'Same fingerprint IP 103.21.58.* within 2 minutes'
    ],
    deepThinkingAudit: 'Forensic evaluation confirms automated headless script submission with duplicate IP velocity. Payout held permanently.',
    actionTaken: 'account_suspended',
    timestamp: '2026-09-28T22:15:00Z'
  },
  {
    id: 'fs_002',
    userId: 'user_demo_1',
    userName: 'Aarav Sharma',
    riskScore: 8,
    signals: ['Human-paced watch duration', 'High lexical variation in feedback'],
    actionTaken: 'auto_approved',
    timestamp: '2026-09-28T18:40:00Z'
  }
];

export const initialReferrals: ReferralRecord[] = [
  {
    id: 'ref_101',
    referrerId: 'user_demo_1',
    referrerName: 'Aarav Sharma',
    referredUserId: 'usr_friend_1',
    referredUserName: 'Vikram Joshi',
    referredUserEmail: 'vikram.j@example.com',
    status: 'first_task_completed',
    onboardingRewardPaid: true,
    firstTaskRewardPaid: true,
    totalRewardEarned: 4.0, // ₹2 onboarding + ₹2 first task
    createdAt: '2026-09-26T10:15:00Z',
    firstTaskCompletedAt: '2026-09-26T14:30:00Z'
  },
  {
    id: 'ref_102',
    referrerId: 'user_demo_1',
    referrerName: 'Aarav Sharma',
    referredUserId: 'usr_friend_2',
    referredUserName: 'Sneha Rao',
    referredUserEmail: 'sneha.r@example.com',
    status: 'first_task_completed',
    onboardingRewardPaid: true,
    firstTaskRewardPaid: true,
    totalRewardEarned: 4.0,
    createdAt: '2026-09-27T12:00:00Z',
    firstTaskCompletedAt: '2026-09-28T09:45:00Z'
  },
  {
    id: 'ref_103',
    referrerId: 'user_demo_1',
    referrerName: 'Aarav Sharma',
    referredUserId: 'usr_friend_3',
    referredUserName: 'Manish Kumar',
    referredUserEmail: 'manish.k@example.com',
    status: 'onboarding_completed',
    onboardingRewardPaid: true,
    firstTaskRewardPaid: false,
    totalRewardEarned: 2.0, // ₹2 for onboarding, waiting for 1st task
    createdAt: '2026-09-29T15:20:00Z'
  },
  {
    id: 'ref_201',
    referrerId: 'creator_demo_1',
    referrerName: 'Priya Patel (Creator)',
    referredUserId: 'usr_creator_fan_1',
    referredUserName: 'Arjun Verma',
    referredUserEmail: 'arjun.v@example.com',
    status: 'first_task_completed',
    onboardingRewardPaid: true,
    firstTaskRewardPaid: true,
    totalRewardEarned: 4.0,
    createdAt: '2026-09-25T08:00:00Z',
    firstTaskCompletedAt: '2026-09-25T11:00:00Z'
  }
];
