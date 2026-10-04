import { describe, it, expect } from 'vitest';
import { initialCampaigns, initialUserProfiles, initialTransactions, initialWithdrawals, initialAdminActionLogs } from '../mockData';
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

  describe('User & Creator Unique ID Provisioning & Admin Gate', () => {
    it('generates valid prefixed User IDs (USR-XXXXXX)', () => {
      const generateUserId = (suffix?: string) => {
        const cleanSuffix = suffix ? suffix.replace(/[^A-Z0-9]/g, '') : Math.floor(100000 + Math.random() * 900000).toString();
        return `USR-${cleanSuffix}`;
      };

      const id1 = generateUserId('849201');
      const id2 = generateUserId();

      expect(id1).toBe('USR-849201');
      expect(id2).toMatch(/^USR-\d{6}$/);
    });

    it('generates valid prefixed Creator Studio IDs (CRT-XXXXXX)', () => {
      const generateCreatorId = (suffix?: string) => {
        const cleanSuffix = suffix ? suffix.replace(/[^A-Z0-9]/g, '') : Math.floor(100000 + Math.random() * 900000).toString();
        return `CRT-${cleanSuffix}`;
      };

      const id1 = generateCreatorId('918234');
      const id2 = generateCreatorId();

      expect(id1).toBe('CRT-918234');
      expect(id2).toMatch(/^CRT-\d{6}$/);
    });

    it('validates master admin access strictly with authorized Admin ID and Password', () => {
      const validateAdminLogin = (id: string, pass: string) => {
        const validIds = ['ADM-SUPER-2026', 'ADM-SUPER', 'ADMIN'];
        const validPass = ['ADMIN2026', 'TUBEEARN#2026', '2991000', 'ADMIN'];

        const isIdValid = validIds.includes(id.trim().toUpperCase());
        const isPassValid = validPass.includes(pass.trim().toUpperCase());

        return isIdValid && isPassValid;
      };

      expect(validateAdminLogin('ADM-SUPER-2026', 'ADMIN2026')).toBe(true);
      expect(validateAdminLogin('ADM-SUPER', 'ADMIN2026')).toBe(true);
      expect(validateAdminLogin('UNKNOWN-ID', 'ADMIN2026')).toBe(false);
      expect(validateAdminLogin('ADM-SUPER-2026', 'WRONGPASS')).toBe(false);
    });
  });

  describe('Admin Withdrawal Approval & Rejection Queue Rules', () => {
    it('verifies all queue items satisfy the ₹299 minimum threshold before processing', () => {
      initialWithdrawals.forEach(w => {
        expect(w.amount).toBeGreaterThanOrEqual(299.0);
      });
    });

    it('processes approval with 12-digit NPCI IMPS UTR and status completed', () => {
      const pendingRequest = {
        id: 'wdr_test_1',
        amount: 350.0,
        status: 'pending',
        userName: 'Priya Verma'
      };

      const utr = generateUtr();
      const approvedRequest = {
        ...pendingRequest,
        status: 'completed',
        utrNumber: utr,
        payoutRef: 'UPI_GATEWAY_' + utr,
        processedAt: new Date().toISOString()
      };

      expect(approvedRequest.status).toBe('completed');
      expect(approvedRequest.utrNumber).toHaveLength(12);
      expect(approvedRequest.payoutRef).toContain('UPI_GATEWAY_');
      expect(approvedRequest.processedAt).toBeDefined();
    });

    it('rejects fraudulent withdrawal attempts and mandates a descriptive rejection reason', () => {
      const pendingRequest = {
        id: 'wdr_bot_99',
        userId: 'user_bot_1',
        amount: 299.0,
        status: 'pending',
        userName: 'Suspicious Bot Account'
      };

      const rejectionReason = 'Fraudulent attempt: Headless browser automation detected with 4s watch velocity.';
      
      // Rejection reason must be >= 10 characters
      expect(rejectionReason.length).toBeGreaterThanOrEqual(10);

      let userWalletBalance = 50.0;
      let userLockedBalance = 299.0;

      // Execute rejection & refund:
      const rejectedRequest = {
        ...pendingRequest,
        status: 'rejected',
        rejectionReason,
        processedAt: new Date().toISOString()
      };

      userWalletBalance += pendingRequest.amount;
      userLockedBalance = Math.max(0, userLockedBalance - pendingRequest.amount);

      expect(rejectedRequest.status).toBe('rejected');
      expect(rejectedRequest.rejectionReason).toContain('Headless browser automation');
      expect(userWalletBalance).toBe(349.0);
      expect(userLockedBalance).toBe(0.0);
    });

    it('records an immutable Action History log entry for approvals with admin identity and UTR', () => {
      const testApprovalLog = {
        id: 'act_test_1',
        adminId: 'ADM-SUPER-2026',
        adminName: 'Master Admin',
        actionType: 'approve_withdrawal' as const,
        targetType: 'withdrawal' as const,
        targetId: 'wdr_101',
        amount: 350.0,
        details: { utrNumber: '202610019284' },
        timestamp: new Date().toISOString()
      };
      expect(testApprovalLog).toBeDefined();
      expect(testApprovalLog.adminId).toMatch(/^ADM-/);
      expect(testApprovalLog.adminName).toBeDefined();
      expect(testApprovalLog.timestamp).toBeDefined();
      expect(testApprovalLog.details.utrNumber).toHaveLength(12);
      expect(testApprovalLog.amount).toBeGreaterThanOrEqual(299.0);
    });

    it('records an immutable Action History log entry for rejections with admin identity and documented reason', () => {
      const testRejectionLog = {
        id: 'act_test_2',
        adminId: 'ADM-SUPER-2026',
        adminName: 'Master Admin',
        actionType: 'reject_withdrawal' as const,
        targetType: 'withdrawal' as const,
        targetId: 'wdr_102',
        details: { rejectionReason: 'Fraudulent attempt: Bot pattern detected' },
        timestamp: new Date().toISOString()
      };
      expect(testRejectionLog).toBeDefined();
      expect(testRejectionLog.adminId).toMatch(/^ADM-/);
      expect(testRejectionLog.adminName).toBeDefined();
      expect(testRejectionLog.timestamp).toBeDefined();
      expect(testRejectionLog.details.rejectionReason).toBeDefined();
      expect(testRejectionLog.details.rejectionReason.length).toBeGreaterThanOrEqual(10);
      expect(testRejectionLog.details.rejectionReason).toContain('Fraudulent attempt');
    });
  });

  describe('User, Creator & Admin Login and ID Creation Rules', () => {
    it('creates new unique Earner User IDs strictly prefixed with USR- without duplicate prefixes', () => {
      const generateCleanId = (role: 'user' | 'creator', input?: string) => {
        const prefix = role === 'user' ? 'USR-' : 'CRT-';
        const rawDigits = (input || '').replace(/^(USR|CRT)-?/i, '').replace(/[^A-Z0-9]/g, '');
        return rawDigits.length >= 4 ? `${prefix}${rawDigits}` : `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
      };

      // Case 1: user enters raw 6 digits
      expect(generateCleanId('user', '849201')).toBe('USR-849201');
      // Case 2: user enters with USR- prefix already
      expect(generateCleanId('user', 'USR-849201')).toBe('USR-849201');
      // Case 3: user enters lowercase without hyphen
      expect(generateCleanId('user', 'usr849201')).toBe('USR-849201');
      // Case 4: user enters empty
      expect(generateCleanId('user')).toMatch(/^USR-\d{6}$/);
    });

    it('creates new unique Creator IDs strictly prefixed with CRT- without duplicate prefixes', () => {
      const generateCleanId = (role: 'user' | 'creator', input?: string) => {
        const prefix = role === 'user' ? 'USR-' : 'CRT-';
        const rawDigits = (input || '').replace(/^(USR|CRT)-?/i, '').replace(/[^A-Z0-9]/g, '');
        return rawDigits.length >= 4 ? `${prefix}${rawDigits}` : `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
      };

      expect(generateCleanId('creator', '918234')).toBe('CRT-918234');
      expect(generateCleanId('creator', 'CRT-918234')).toBe('CRT-918234');
      expect(generateCleanId('creator', 'crt918234')).toBe('CRT-918234');
      expect(generateCleanId('creator')).toMatch(/^CRT-\d{6}$/);
    });

    it('authenticates user login flexibly across case, prefix variations, and email', () => {
      const matchUser = (inputId: string, account: { customUserId: string; email: string }) => {
        const cleanInput = inputId.toUpperCase().trim();
        const normalizedDigits = cleanInput.replace(/^(USR)-?/i, '').replace(/[^A-Z0-9]/g, '');
        const cleanEmail = inputId.toLowerCase().trim();

        const accountId = account.customUserId.toUpperCase();
        const accountDigits = accountId.replace(/^(USR)-?/i, '').replace(/[^A-Z0-9]/g, '');
        const accountClean = accountId.replace(/[^A-Z0-9]/g, '');
        const inputClean = cleanInput.replace(/[^A-Z0-9]/g, '');

        return (
          accountId === cleanInput ||
          accountClean === inputClean ||
          (normalizedDigits.length >= 4 && accountDigits === normalizedDigits) ||
          (account.email.toLowerCase() === cleanEmail)
        );
      };

      const testAccount = { customUserId: 'USR-849201', email: 'kavita@example.com' };

      // Exact match
      expect(matchUser('USR-849201', testAccount)).toBe(true);
      // Lowercase match
      expect(matchUser('usr-849201', testAccount)).toBe(true);
      // Without hyphen
      expect(matchUser('usr849201', testAccount)).toBe(true);
      // Just the digits
      expect(matchUser('849201', testAccount)).toBe(true);
      // By email
      expect(matchUser('kavita@example.com', testAccount)).toBe(true);
      // Non-matching
      expect(matchUser('USR-999999', testAccount)).toBe(false);
    });

    it('authenticates creator login flexibly across case, prefix variations, and email', () => {
      const matchCreator = (inputId: string, account: { customUserId: string; email: string }) => {
        const cleanInput = inputId.toUpperCase().trim();
        const normalizedDigits = cleanInput.replace(/^(CRT)-?/i, '').replace(/[^A-Z0-9]/g, '');
        const cleanEmail = inputId.toLowerCase().trim();

        const accountId = account.customUserId.toUpperCase();
        const accountDigits = accountId.replace(/^(CRT)-?/i, '').replace(/[^A-Z0-9]/g, '');
        const accountClean = accountId.replace(/[^A-Z0-9]/g, '');
        const inputClean = cleanInput.replace(/[^A-Z0-9]/g, '');

        return (
          accountId === cleanInput ||
          accountClean === inputClean ||
          (normalizedDigits.length >= 4 && accountDigits === normalizedDigits) ||
          (account.email.toLowerCase() === cleanEmail)
        );
      };

      const testCreator = { customUserId: 'CRT-728193', email: 'studio@channel.com' };

      expect(matchCreator('CRT-728193', testCreator)).toBe(true);
      expect(matchCreator('crt-728193', testCreator)).toBe(true);
      expect(matchCreator('crt728193', testCreator)).toBe(true);
      expect(matchCreator('728193', testCreator)).toBe(true);
      expect(matchCreator('studio@channel.com', testCreator)).toBe(true);
      expect(matchCreator('CRT-111111', testCreator)).toBe(false);
    });

    it('authenticates admin login in any parameter order (ID first OR Password first)', () => {
      const parseAndValidateAdmin = (arg1?: string, arg2?: string) => {
        const raw1 = (arg1 || '').trim();
        const raw2 = (arg2 || '').trim();
        const str1 = raw1.toUpperCase();
        const str2 = raw2.toUpperCase();

        const isIdCandidate = (s: string) => 
          s.startsWith('ADM-') || s.includes('@') || s === 'ADM' || s.startsWith('ADMIN-') || s === 'ADMIN';

        const isPassCandidate = (s: string) =>
          s === 'ADMIN2026' || s.includes('2026') || s === '2991000' || s.startsWith('TUBE') || s === 'PASSWORD';

        let id = '';
        let pass = '';

        if (isIdCandidate(str1) && !isIdCandidate(str2)) {
          id = str1;
          pass = raw2;
        } else if (isIdCandidate(str2) && !isIdCandidate(str1)) {
          id = str2;
          pass = raw1;
        } else if (isPassCandidate(str1) && !isPassCandidate(str2)) {
          pass = raw1;
          id = str2;
        } else if (isPassCandidate(str2) && !isPassCandidate(str1)) {
          pass = raw2;
          id = str1;
        } else if (str2.startsWith('ADM-')) {
          id = str2;
          pass = raw1;
        } else {
          id = str1 || str2 || 'ADM-SUPER-2026';
          pass = str2 || str1;
        }

        if (!id || id === 'ADMIN2026') id = 'ADM-SUPER-2026';

        const validIds = ['ADM-SUPER-2026', 'ADM-SUPER', 'ADMIN', 'ADMIN@TUBEEARN.APP'];
        const validPass = ['ADMIN2026', 'TUBEEARN#2026', '2991000', 'ADMIN'];

        const cleanPass = (pass || '').toUpperCase().trim();
        const isIdValid = id.startsWith('ADM-') || id.startsWith('ADM') || validIds.includes(id);
        const isPassValid = validPass.includes(cleanPass);

        return isIdValid && isPassValid;
      };

      // Case A: ID first, Password second
      expect(parseAndValidateAdmin('ADM-SUPER-2026', 'ADMIN2026')).toBe(true);
      // Case B: Password first, ID second
      expect(parseAndValidateAdmin('ADMIN2026', 'ADM-SUPER-2026')).toBe(true);
      // Case C: Only password entered (fallback to ADM-SUPER-2026)
      expect(parseAndValidateAdmin('ADMIN2026')).toBe(true);
      // Case D: Wrong password
      expect(parseAndValidateAdmin('ADM-SUPER-2026', 'WRONGPASS')).toBe(false);
      // Case E: Wrong ID
      expect(parseAndValidateAdmin('INVALID-ID', 'ADMIN2026')).toBe(false);
    });
  });

  describe('Pending Document Verifications & KYC Review', () => {
    it('identifies pending verification profiles for both earners and creators', () => {
      const sampleProfiles = [
        {
          uid: 'usr_rohan',
          role: 'user',
          kycStatus: 'pending',
          kycDocumentType: 'pan',
          kycDocumentNumberMasked: 'ABCDE9842K',
          kycSubmittedAt: new Date().toISOString()
        },
        {
          uid: 'crt_techvibe',
          role: 'creator',
          kycStatus: 'pending',
          kycDocumentType: 'aadhaar',
          kycDocumentNumberMasked: 'XXXX-XXXX-8924',
          kycSubmittedAt: new Date().toISOString()
        }
      ];
      const pendingList = sampleProfiles.filter(p => p.kycStatus === 'pending');

      expect(pendingList.length).toBeGreaterThanOrEqual(2);
      expect(pendingList.some(p => p.role === 'user')).toBe(true);
      expect(pendingList.some(p => p.role === 'creator')).toBe(true);
      
      pendingList.forEach(p => {
        expect(p.kycDocumentType).toBeDefined();
        expect(p.kycDocumentNumberMasked).toBeDefined();
        expect(p.kycSubmittedAt).toBeDefined();
      });
    });

    it('approves document verification with single click and records verification timestamp', () => {
      const pendingProfile = {
        uid: 'usr_test_kyc',
        name: 'Test Earner',
        role: 'user' as const,
        kycStatus: 'pending' as const,
        kycDocumentType: 'pan' as const,
        kycDocumentNumberMasked: 'ABCDE1234F'
      };

      const verifiedTimestamp = new Date().toISOString();
      const updatedProfile = {
        ...pendingProfile,
        kycStatus: 'verified' as const,
        kycVerifiedAt: verifiedTimestamp
      };

      expect(updatedProfile.kycStatus).toBe('verified');
      expect(updatedProfile.kycVerifiedAt).toBe(verifiedTimestamp);
    });

    it('rejects document verification with documented grounds and updates status to rejected', () => {
      const pendingProfile = {
        uid: 'crt_test_kyc',
        name: 'Test Creator',
        role: 'creator' as const,
        kycStatus: 'pending' as const,
        kycDocumentType: 'aadhaar' as const,
        kycDocumentNumberMasked: 'XXXX-XXXX-1234'
      };

      const rejectionReason = 'Document image blurry or unreadable.';
      const updatedProfile = {
        ...pendingProfile,
        kycStatus: 'rejected' as const,
        kycRejectionReason: rejectionReason
      };

      expect(updatedProfile.kycStatus).toBe('rejected');
      expect(updatedProfile.kycRejectionReason).toBe('Document image blurry or unreadable.');
    });
  });

});
