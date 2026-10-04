import { Campaign, UserProfile, WalletTransaction, WithdrawalRequest, FraudSignalLog, ReferralRecord, AdminActionLog } from './types';

// Clean initial campaigns: empty, live campaigns are pulled from Firestore or created by creators
export const initialCampaigns: Campaign[] = [];

// Profile fixtures for validation & type contracts
export const initialUserProfiles: Record<string, UserProfile> = {
  'user_demo_1': {
    uid: 'user_demo_1',
    customUserId: 'USR-AARAV101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    role: 'user',
    kycStatus: 'verified',
    walletBalance: 342.0,
    pendingBalance: 0.0,
    lockedBalance: 0.0,
    lifetimeEarned: 840.0,
    lifetimeSpent: 0.0,
    accountStatus: 'active',
    referralCode: 'EARN-AARAV',
    connectedAccounts: {
      youtube: { connected: true, channelName: 'Aarav Tech', handle: '@aaravtech' }
    },
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  },
  'creator_demo_1': {
    uid: 'creator_demo_1',
    customUserId: 'CRT-PRIYA202',
    name: 'Priya Patel (Creator)',
    email: 'priya.patel@creators.com',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    role: 'creator',
    kycStatus: 'verified',
    walletBalance: 5000.0,
    escrowBalance: 5000.0,
    pendingBalance: 0.0,
    lockedBalance: 0.0,
    lifetimeEarned: 0.0,
    lifetimeSpent: 0.0,
    accountStatus: 'active',
    referralCode: 'STUDIO-PRIYA',
    connectedAccounts: {
      youtube: { connected: true, channelName: 'Priya Tech Studio', handle: '@priyatech' }
    },
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  },
  'admin_demo_1': {
    uid: 'admin_master_1',
    customUserId: 'ADM-SUPER-2026',
    name: 'Master Platform Administrator',
    email: 'admin@tubeearn.app',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    role: 'admin',
    kycStatus: 'verified',
    walletBalance: 0.0,
    adminCommissionBalance: 0.0,
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
    updatedAt: '2026-10-01T00:00:00Z'
  }
};

// Clean transaction ledger: no sample transactions
export const initialTransactions: WalletTransaction[] = [];

// Clean withdrawal queue: no sample withdrawals
export const initialWithdrawals: WithdrawalRequest[] = [];

// Clean fraud logs
export const initialFraudLogs: FraudSignalLog[] = [];
export const initialFraudSignals: FraudSignalLog[] = [];

// Clean referrals
export const initialReferrals: ReferralRecord[] = [];

// Clean action history
export const initialAdminActionLogs: AdminActionLog[] = [];
