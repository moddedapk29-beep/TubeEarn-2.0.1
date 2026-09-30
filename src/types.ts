export type UserRole = 'user' | 'creator' | 'admin';

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  uid: string;
  customUserId?: string; // e.g. USR-AARAV101 or CRT-PRIYA202
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  kycStatus: KycStatus;
  kycDocumentType?: 'aadhaar' | 'pan' | 'voter_id';
  kycDocumentNumberMasked?: string;
  walletBalance: number; // ₹ available
  pendingBalance: number; // ₹ in settlement review
  lockedBalance: number; // ₹ locked for campaigns/withdrawal
  lifetimeEarned: number;
  lifetimeSpent: number;
  escrowBalance?: number; // ₹ held in creator escrow or keep in app
  adminCommissionBalance?: number; // ₹ platform commission accumulated for admin
  accountStatus: 'active' | 'flagged' | 'suspended';
  referralCode?: string; // unique referral code
  referredBy?: string; // who referred this user
  referralCount?: number;
  referralEarnings?: number; // total ₹ earned from referrals
  connectedAccounts: {
    youtube?: { connected: boolean; channelName?: string; handle?: string; verifiedAt?: string };
    instagram?: { connected: boolean; handle?: string; verifiedAt?: string };
    facebook?: { connected: boolean; profileName?: string; verifiedAt?: string };
  };
  bankDetails?: {
    upiId?: string;
    accountNumberMasked?: string;
    ifsc?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PlatformType = 'youtube' | 'instagram' | 'facebook';

export type TaskType = 
  | 'content_discovery' // Discover video, identify key takeaway
  | 'video_feedback'    // Constructive feedback on production/audio/editing
  | 'watch_and_review'  // Watch specified segment and write thoughtful review
  | 'audience_survey'   // Answer creator's 3 research questions
  | 'community_qa';     // Participate in community discussion

export interface Campaign {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  platform: PlatformType;
  taskType: TaskType;
  title: string;
  description: string;
  targetUrl: string;
  channelOrHandle: string;
  requiredParticipants: number; // Minimum 1,000 participants
  completedParticipants: number;
  creatorCostPerTask: number; // e.g. ₹3.00
  userRewardPerTask: number; // e.g. ₹1.00
  platformFeePerTask: number; // e.g. ₹2.00
  totalBudget: number; // requiredParticipants * creatorCostPerTask
  escrowLocked: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  verificationPrompts: {
    question: string;
    expectedEvidence: string;
  }[];
  minimumWatchTimeSeconds: number;
  createdAt: string;
  expiresAt: string;
}

export interface TaskSubmission {
  id: string;
  campaignId: string;
  campaignTitle: string;
  creatorId: string;
  userId: string;
  userName: string;
  userEmail: string;
  platform: PlatformType;
  submissionData: {
    watchDurationSeconds: number;
    feedbackText: string;
    answers: { question: string; answer: string }[];
    connectedSocialHandle: string;
    deviceFingerprint: string;
  };
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'flagged_review';
  rewardAmount: number;
  fraudScore: number; // 0 to 100
  fraudSignals: string[];
  aiVerificationNotes?: string;
  submittedAt: string;
  settledAt?: string;
}

export type TransactionType =
  | 'deposit'
  | 'escrow_deposit'
  | 'campaign_budget_lock'
  | 'campaign_refund'
  | 'task_reward_pending'
  | 'task_reward_settled'
  | 'admin_commission'
  | 'admin_commission_withdrawal'
  | 'withdrawal_request'
  | 'withdrawal_payout'
  | 'withdrawal_refund'
  | 'creator_withdrawal'
  | 'referral_onboarding_reward'
  | 'referral_task_reward';

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  status: 'onboarding_completed' | 'first_task_completed';
  onboardingRewardPaid: boolean; // ₹2.00 paid
  firstTaskRewardPaid: boolean;   // ₹2.00 paid
  totalRewardEarned: number;      // ₹2.00 or ₹4.00
  createdAt: string;
  firstTaskCompletedAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive or negative
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  referenceId: string; // Campaign ID, Withdrawal ID, or Payment Order ID
  description: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userRole?: UserRole;
  userName: string;
  userEmail: string;
  amount: number; // Minimum ₹299
  method: 'upi' | 'bank_transfer';
  upiId?: string;
  bankAccountNumber?: string;
  ifsc?: string;
  accountHolderName?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  payoutRef?: string;
  utrNumber?: string; // 12-digit Bank/NPCI UPI UTR
  gatewayProvider?: string; // e.g. 'UPI Payout Gateway (NPCI IMPS)'
  isCommissionWithdrawal?: boolean; // Admin commission payout
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface EscrowSummary {
  totalCreatorDeposits: number;
  totalActiveEscrowLocked: number;
  totalAvailableInApp: number;
  totalEarnersPaid: number;
  totalAdminCommissionEarned: number;
  totalAdminCommissionWithdrawn: number;
  currentAdminCommissionBalance: number;
}

export interface FraudSignalLog {
  id: string;
  userId: string;
  userName: string;
  riskScore: number;
  signals: string[];
  submissionId?: string;
  deepThinkingAudit?: string;
  actionTaken: 'auto_approved' | 'sent_to_review' | 'account_flagged' | 'account_suspended';
  timestamp: string;
}
