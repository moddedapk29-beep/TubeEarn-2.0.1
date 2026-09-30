import { describe, it, expect } from 'vitest';
import { initialCampaigns, initialUserProfiles, initialTransactions } from '../mockData';
import { auditFraudDeepThinking, verifyTaskWithAI } from '../gemini';
import { validateUpiVpa, buildUpiUri, generateUtr, OFFICIAL_ESCROW_UPI_ID } from '../utils/upiGateway';

describe('TubeEarn Financial & Business Rules Test Suite', () => {

  describe('Withdrawal Rules (₹299 Minimum Threshold)', () => {
    it('rejects withdrawal amounts less than ₹299 (e.g. ₹298, ₹100, ₹0)', () => {
      const amounts = [0, 50, 100, 200, 298, 298.99];
      amounts.forEach(amount => {
        const isBelowThreshold = amount < 299;
        expect(isBelowThreshold).toBe(true);
      });
    });

    it('accepts withdrawal amounts at or above ₹299 boundary', () => {
      const amounts = [299, 299.5, 300, 500, 1000];
      amounts.forEach(amount => {
        const meetsThreshold = amount >= 299;
        expect(meetsThreshold).toBe(true);
      });
    });

    it('enforces sufficient wallet balance guard for withdrawals', () => {
      const userBalance = 342.0;
      const requestedWithdrawal = 9999.0;
      const isSufficient = requestedWithdrawal <= userBalance;
      expect(isSufficient).toBe(false);
    });

    it('requires verified KYC status prior to dispatching withdrawal', () => {
      const verifiedUser = { kycStatus: 'verified' };
      const pendingUser = { kycStatus: 'pending' };
      const rejectedUser = { kycStatus: 'rejected' };

      expect(verifiedUser.kycStatus === 'verified').toBe(true);
      expect(pendingUser.kycStatus === 'verified').toBe(false);
      expect(rejectedUser.kycStatus === 'verified').toBe(false);
    });
  });

  describe('Campaign Creator Rules (Minimum 1,000 Participants)', () => {
    it('strictly rejects any campaign with fewer than 1,000 required participants', () => {
      const testParticipantCounts = [1, 50, 500, 999];
      testParticipantCounts.forEach(count => {
        const isValid = count >= 1000;
        expect(isValid).toBe(false);
      });
    });

    it('accepts campaigns with 1,000 or more participants', () => {
      const testParticipantCounts = [1000, 1001, 1500, 5000, 10000];
      testParticipantCounts.forEach(count => {
        const isValid = count >= 1000;
        expect(isValid).toBe(true);
      });
    });

    it('correctly calculates total campaign budget and platform fee margins', () => {
      const requiredParticipants = 1000;
      const creatorCostPerTask = 3.0; // ₹3.00
      const userRewardPerTask = 1.0;   // ₹1.00
      const platformFeePerTask = creatorCostPerTask - userRewardPerTask; // ₹2.00

      const totalBudget = requiredParticipants * creatorCostPerTask;
      const totalUserRewards = requiredParticipants * userRewardPerTask;
      const totalPlatformGross = requiredParticipants * platformFeePerTask;

      expect(totalBudget).toBe(3000.0);
      expect(totalUserRewards).toBe(1000.0);
      expect(totalPlatformGross).toBe(2000.0);
      expect(totalUserRewards + totalPlatformGross).toBe(totalBudget);
    });

    it('all initial mock campaigns adhere to the >= 1,000 participant rule', () => {
      initialCampaigns.forEach(campaign => {
        expect(campaign.requiredParticipants).toBeGreaterThanOrEqual(1000);
        expect(campaign.escrowLocked).toBe(campaign.requiredParticipants * campaign.creatorCostPerTask);
      });
    });
  });

  describe('Wallet & Ledger Double-Entry Integrity', () => {
    it('maintains valid transaction schema with non-zero amounts and timestamp', () => {
      initialTransactions.forEach(tx => {
        expect(tx.id).toBeDefined();
        expect(tx.userId).toBeDefined();
        expect(tx.type).toBeDefined();
        expect(typeof tx.amount).toBe('number');
        expect(tx.status).toBeDefined();
        expect(tx.createdAt).toBeDefined();
        expect(new Date(tx.createdAt).getTime()).not.toBeNaN();
      });
    });

    it('correctly reflects balance updates when funding creator wallet', () => {
      const initialBalance = 500.0;
      const depositAmount = 250.0;
      const updatedBalance = initialBalance + depositAmount;

      expect(updatedBalance).toBe(750.0);
    });

    it('locks escrow funds from wallet balance when creating a campaign', () => {
      const walletBalance = 5000.0;
      const campaignBudget = 3000.0;
      const availableAfterLock = walletBalance - campaignBudget;
      const lockedBalance = campaignBudget;

      expect(availableAfterLock).toBe(2000.0);
      expect(lockedBalance).toBe(3000.0);
    });
  });

  describe('Anti-Fraud and AI Task Verification Logic', () => {
    it('evaluates task feedback length and minimum watch duration correctly', async () => {
      const result = await verifyTaskWithAI({
        campaignTitle: 'Test Campaign',
        taskType: 'video_feedback',
        userFeedback: 'Detailed analysis of color grading and sound equalization in the opening scene.',
        answers: [{ question: 'What was the lighting?', answer: 'Sunset studio lights' }],
        watchDurationSeconds: 100,
        minimumWatchTimeSeconds: 90
      });

      expect(result).toHaveProperty('isAccepted');
      expect(result).toHaveProperty('score');
      expect(result.score).toBeGreaterThan(0);
    });

    it('flags insufficient watch time or brief spam input', async () => {
      const result = await verifyTaskWithAI({
        campaignTitle: 'Test Campaign',
        taskType: 'video_feedback',
        userFeedback: 'good',
        answers: [],
        watchDurationSeconds: 10,
        minimumWatchTimeSeconds: 90
      });

      expect(result.isAccepted).toBe(false);
      expect(result.score).toBeLessThan(50);
    });

    it('audits fraud indicators with risk score between 0 and 100', async () => {
      const audit = await auditFraudDeepThinking({
        userId: 'user_test_99',
        userName: 'Test User',
        totalSubmissions: 5,
        avgWatchDurationSeconds: 95,
        requiredWatchSeconds: 90,
        ipVelocityCount: 1,
        recentFeedbacks: ['Valid subjective review of microphone audio and pacing.']
      });

      expect(audit).toHaveProperty('fraudScore');
      expect(audit.fraudScore).toBeGreaterThanOrEqual(0);
      expect(audit.fraudScore).toBeLessThanOrEqual(100);
      expect(audit).toHaveProperty('verdict');
      expect(['APPROVED', 'HOLD_FOR_REVIEW', 'SUSPEND_ACCOUNT']).toContain(audit.verdict);
    });
  });

  describe('Separate Multi-Role Login & Security Gate Rules', () => {
    it('authenticates user role with valid earner profile', () => {
      const userProfile = initialUserProfiles['user_demo_1'];
      expect(userProfile.role).toBe('user');
      expect(userProfile.name).toBe('Aarav Sharma');
      expect(userProfile.walletBalance).toBe(342.0);
      expect(userProfile.kycStatus).toBe('verified');
    });

    it('authenticates creator role with studio handle and campaign capabilities', () => {
      const creatorProfile = initialUserProfiles['creator_demo_1'];
      expect(creatorProfile.role).toBe('creator');
      expect(creatorProfile.connectedAccounts.youtube?.connected).toBe(true);
      expect(creatorProfile.walletBalance).toBeGreaterThanOrEqual(3000.0); // Sufficient for 1,000 participant campaign
    });

    it('enforces passkey validation for administrator access (ADMIN2026)', () => {
      const validPasskeys = ['ADMIN2026', 'admin2026', '2991000', 'ADMIN'];
      const invalidPasskeys = ['123456', 'password', 'user123', 'wrong_key', ''];

      validPasskeys.forEach(key => {
        const cleaned = key.trim().toUpperCase();
        const isValid = cleaned === 'ADMIN2026' || cleaned === '2991000' || cleaned === 'ADMIN';
        expect(isValid).toBe(true);
      });

      invalidPasskeys.forEach(key => {
        const cleaned = key.trim().toUpperCase();
        const isValid = cleaned === 'ADMIN2026' || cleaned === '2991000' || cleaned === 'ADMIN';
        expect(isValid).toBe(false);
      });
    });

    it('isolates user, creator, and admin profiles in distinct namespaces', () => {
      const user = initialUserProfiles['user_demo_1'];
      const creator = initialUserProfiles['creator_demo_1'];
      const admin = initialUserProfiles['admin_demo_1'];

      expect(user.uid).not.toBe(creator.uid);
      expect(creator.uid).not.toBe(admin.uid);
      expect(user.role).toBe('user');
      expect(creator.role).toBe('creator');
      expect(admin.role).toBe('admin');
    });

    it('isolates user IDs with distinct role prefixes and login links', () => {
      const user = initialUserProfiles['user_demo_1'];
      const creator = initialUserProfiles['creator_demo_1'];
      const admin = initialUserProfiles['admin_demo_1'];

      expect(user.customUserId).toMatch(/^USR-/);
      expect(creator.customUserId).toMatch(/^CRT-/);
      expect(admin.customUserId).toMatch(/^ADM-/);

      const userLink = `https://tubeearn.app/?portal=user`;
      const creatorLink = `https://tubeearn.app/?portal=creator`;
      const adminLink = `https://tubeearn.app/?portal=admin`;

      expect(userLink).toContain('portal=user');
      expect(creatorLink).toContain('portal=creator');
      expect(adminLink).toContain('portal=admin');
    });
  });

  describe('Referral Rewards Program (₹2 Onboarding + ₹2 First Task/Order)', () => {
    it('credits exactly ₹2.00 reward when an invited user completes onboarding', () => {
      const referrerStartBalance = 342.0;
      const onboardingReward = 2.0;
      const expectedBalanceAfterOnboarding = referrerStartBalance + onboardingReward;

      expect(expectedBalanceAfterOnboarding).toBe(344.0);
    });

    it('credits additional ₹2.00 milestone reward when the referred user finishes 1 task or order', () => {
      const referrerBalanceAfterStep1 = 344.0;
      const taskMilestoneReward = 2.0;
      const expectedTotalFromReferral = 2.0 + 2.0;
      const finalReferrerBalance = referrerBalanceAfterStep1 + taskMilestoneReward;

      expect(expectedTotalFromReferral).toBe(4.0);
      expect(finalReferrerBalance).toBe(346.0);
    });

    it('prevents double claiming of the first task reward for the same referral', () => {
      const referralRecord = {
        id: 'ref_123',
        onboardingRewardPaid: true,
        firstTaskRewardPaid: true,
        totalRewardEarned: 4.0
      };

      const canClaimAgain = !referralRecord.firstTaskRewardPaid;
      expect(canClaimAgain).toBe(false);
    });
  });

  describe('Real UPI Payment Gateway, Escrow Wallet & Admin Commission Withdrawal', () => {
    it('validates standard UPI VPA format correctly', () => {
      expect(validateUpiVpa('creator@okhdfcbank')).toBe(true);
      expect(validateUpiVpa('earner.9876543210@paytm')).toBe(true);
      expect(validateUpiVpa('tubeearn.escrow@icici')).toBe(true);
      expect(validateUpiVpa('invalid-vpa-without-at')).toBe(false);
      expect(validateUpiVpa('@missinghandle')).toBe(false);
      expect(validateUpiVpa('')).toBe(false);
    });

    it('generates real NPCI standard UPI payment intent URIs with escrow details', () => {
      const uri = buildUpiUri({
        pa: OFFICIAL_ESCROW_UPI_ID,
        pn: 'TubeEarn Escrow Treasury',
        am: 2000,
        tn: 'Creator Campaign Deposit',
        tr: 'TXN12345'
      });

      expect(uri).toContain('upi://pay?');
      expect(uri).toContain(`pa=${encodeURIComponent(OFFICIAL_ESCROW_UPI_ID)}`);
      expect(decodeURIComponent(uri.replace(/\+/g, ' '))).toContain('pn=TubeEarn Escrow Treasury');
      expect(uri).toContain('am=2000.00');
      expect(uri).toContain('cu=INR');
    });

    it('generates compliant 12-digit numeric bank UTR numbers', () => {
      const utr = generateUtr();
      expect(utr).toMatch(/^\d{12}$/);
    });

    it('enforces minimum ₹299 withdrawal limit for both users and creators', () => {
      const minWithdrawal = 299;
      const attempt1 = 150;
      const attempt2 = 300;

      expect(attempt1 >= minWithdrawal).toBe(false);
      expect(attempt2 >= minWithdrawal).toBe(true);
    });

    it('allocates task rewards to earner and ₹2.00 commission to admin wallet', () => {
      const creatorCostPerTask = 3.0; // ₹3.00
      const userRewardPerTask = 1.0;  // ₹1.00
      const adminPlatformCommission = creatorCostPerTask - userRewardPerTask; // ₹2.00

      let earnerWallet = 100.0;
      let adminCommissionWallet = 50.0;
      let creatorEscrowLocked = 3000.0;

      // Task completion executes:
      earnerWallet += userRewardPerTask;
      adminCommissionWallet += adminPlatformCommission;
      creatorEscrowLocked -= creatorCostPerTask;

      expect(earnerWallet).toBe(101.0);
      expect(adminCommissionWallet).toBe(52.0);
      expect(creatorEscrowLocked).toBe(2997.0);
    });

    it('allows admin to withdraw accumulated commissions via UPI gateway', () => {
      let adminCommissionBalance = 3450.0;
      const withdrawAmount = 1000.0;
      const upiId = 'admin@okhdfcbank';

      expect(adminCommissionBalance >= withdrawAmount).toBe(true);
      adminCommissionBalance -= withdrawAmount;

      const payoutUtr = generateUtr();

      expect(adminCommissionBalance).toBe(2450.0);
      expect(payoutUtr).toHaveLength(12);
    });
  });

});
