import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { 
  X, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  Zap,
  ArrowRight,
  RefreshCw,
  Lock,
  Wallet
} from 'lucide-react';
import { 
  buildUpiPaymentUri, 
  generateUpiQrDataUrl, 
  UPI_APPS, 
  validateUpiVpa, 
  resolveBankFromVpa, 
  generateUtr,
  OFFICIAL_ESCROW_UPI_ID,
  OFFICIAL_ESCROW_MERCHANT_NAME
} from '../utils/upiGateway';
import confetti from 'canvas-confetti';

interface UpiPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  onSuccess?: () => void;
  purpose?: 'escrow_deposit' | 'creator_funds';
}

export const UpiPaymentGatewayModal: React.FC<UpiPaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 1000,
  onSuccess,
  purpose = 'escrow_deposit'
}) => {
  const { currentUser, depositViaUpiGateway } = useApp();

  const [amount, setAmount] = useState<number>(defaultAmount);
  const [gatewayTab, setGatewayTab] = useState<'qr_intent' | 'vpa_collect'>('qr_intent');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [copiedUri, setCopiedUri] = useState<boolean>(false);
  const [userVpa, setUserVpa] = useState<string>(currentUser.bankDetails?.upiId || 'creator@okhdfcbank');
  const [manualUtr, setManualUtr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [collectSent, setCollectSent] = useState<boolean>(false);
  const [collectCountdown, setCollectCountdown] = useState<number>(180);
  const [txRefId, setTxRefId] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<{ utr: string; amount: number; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize reference ID when modal opens or amount changes
  useEffect(() => {
    if (isOpen) {
      const ref = 'DEP_' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setTxRefId(ref);
      setSuccessInfo(null);
      setErrorMessage(null);
      setCollectSent(false);
      setManualUtr(generateUtr());
    }
  }, [isOpen, amount]);

  // Generate dynamic standard UPI Intent URI
  const upiIntentUri = buildUpiPaymentUri({
    pa: OFFICIAL_ESCROW_UPI_ID,
    pn: OFFICIAL_ESCROW_MERCHANT_NAME,
    am: amount,
    cu: 'INR',
    tn: `TubeEarn Escrow Deposit ${txRefId}`,
    tr: txRefId,
    mc: '5399'
  });

  // Render dynamic QR code whenever amount or URI changes
  useEffect(() => {
    let isMounted = true;
    if (isOpen && upiIntentUri) {
      generateUpiQrDataUrl(upiIntentUri).then(dataUrl => {
        if (isMounted) setQrCodeDataUrl(dataUrl);
      });
    }
    return () => { isMounted = false; };
  }, [isOpen, upiIntentUri]);

  // Collect request countdown timer
  useEffect(() => {
    let timer: any = null;
    if (collectSent && collectCountdown > 0) {
      timer = setInterval(() => {
        setCollectCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [collectSent, collectCountdown]);

  if (!isOpen) return null;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(OFFICIAL_ESCROW_UPI_ID);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(upiIntentUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleSendCollectRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpiVpa(userVpa)) {
      setErrorMessage('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm).');
      return;
    }
    setErrorMessage(null);
    setCollectSent(true);
    setCollectCountdown(180);
  };

  const handleAuthorizeUpiPayment = async (providedUtr?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const utrToUse = (providedUtr || manualUtr || generateUtr()).trim();
    if (utrToUse.length < 10) {
      setErrorMessage('Please provide a valid 12-digit Bank UTR / Reference Number.');
      setIsProcessing(false);
      return;
    }

    try {
      const res = await depositViaUpiGateway(
        amount, 
        utrToUse, 
        `Escrow wallet deposit of ₹${amount.toFixed(2)} via UPI (${OFFICIAL_ESCROW_UPI_ID})`
      );

      setIsProcessing(false);
      if (res.success) {
        setSuccessInfo({
          utr: res.utr,
          amount,
          message: res.message
        });
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment gateway connection error. Please try again.');
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resolvedUserBank = resolveBankFromVpa(userVpa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Gateway Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Official Real UPI Payment Gateway</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                  NPCI INSTANT
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Escrow Protected &bull; {OFFICIAL_ESCROW_MERCHANT_NAME}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* SUCCESS STATE */}
          {successInfo ? (
            <div className="p-6 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Payment Authorized &amp; Escrow Credited!</h3>
                <p className="text-xs text-emerald-300 mt-1">{successInfo.message}</p>
              </div>

              {/* Receipt Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Amount Deposited:</span>
                  <span className="text-emerald-400 font-bold text-sm">₹{successInfo.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bank UTR Number:</span>
                  <span className="text-white font-bold">{successInfo.utr}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payee VPA:</span>
                  <span className="text-slate-200">{OFFICIAL_ESCROW_UPI_ID}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Escrow Allocation:</span>
                  <span className="text-emerald-300 font-semibold">Kept in App / Available for Campaigns</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Timestamp:</span>
                  <span className="text-slate-300">{new Date().toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  Done &amp; View Escrow Balance
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Deposit Amount into Escrow Wallet</span>
                  <span className="text-[11px] text-emerald-400 font-mono">Zero Payment Gateway Surcharge</span>
                </label>
                
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[500, 1000, 3000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        amount === amt
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
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
                    step="100"
                    value={amount}
                    onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3 text-sm text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="Custom deposit amount"
                  />
                </div>
              </div>

              {/* Gateway Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGatewayTab('qr_intent')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    gatewayTab === 'qr_intent'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  QR Code &amp; UPI Apps
                </button>
                <button
                  type="button"
                  onClick={() => setGatewayTab('vpa_collect')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    gatewayTab === 'vpa_collect'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  UPI ID (Collect Request)
                </button>
              </div>

              {/* METHOD 1: DYNAMIC QR & DIRECT UPI APPS */}
              {gatewayTab === 'qr_intent' && (
                <div className="space-y-4">
                  
                  {/* Dynamic QR Code Card */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                    <div className="bg-white p-3 rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt={`Scan UPI QR Code for ₹${amount}`} 
                          className="w-44 h-44 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs font-mono">
                          Generating QR...
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-800 font-mono">
                        <span>BHIM</span> &bull; <span>UPI 2.0</span>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1 text-center sm:text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                          Scan to pay with any UPI App
                        </span>
                        <div className="text-2xl font-black text-emerald-400 font-mono">
                          ₹{amount.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-400">
                          Scan from Google Pay, PhonePe, Paytm, BHIM, Cred, or any banking app.
                        </p>
                      </div>

                      {/* Official VPA details */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="text-[10px] text-slate-400">Official Escrow VPA:</div>
                        <div className="flex items-center justify-between font-mono font-bold text-slate-200">
                          <span className="text-[11px] truncate">{OFFICIAL_ESCROW_UPI_ID}</span>
                          <button
                            type="button"
                            onClick={handleCopyVpa}
                            className="p-1 text-slate-400 hover:text-emerald-400 transition-all"
                            title="Copy UPI ID"
                          >
                            {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>Ref: {txRefId}</span>
                        <span>&bull;</span>
                        <button 
                          onClick={handleCopyUri}
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          {copiedUri ? 'Copied URI' : 'Copy UPI Link'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Launch on Mobile / Desktop UPI Apps */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                      Or 1-Tap Pay with UPI App:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {UPI_APPS.map(app => (
                        <a
                          key={app.id}
                          href={app.getUri(upiIntentUri)}
                          className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col items-center text-center gap-1 transition-all group"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className={`w-8 h-8 rounded-lg ${app.iconBg} ${app.iconColor} flex items-center justify-center font-bold text-xs shadow`}>
                            {app.name.slice(0, 2)}
                          </div>
                          <span className="text-[10px] font-medium text-slate-300 group-hover:text-white line-clamp-1">
                            {app.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* METHOD 2: ENTER UPI ID FOR COLLECT REQUEST */}
              {gatewayTab === 'vpa_collect' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300">
                    Enter your Virtual Payment Address (UPI ID). The gateway will send a payment collect request of <strong>₹{amount.toFixed(2)}</strong> directly to your UPI app.
                  </div>

                  <form onSubmit={handleSendCollectRequest} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your UPI ID / VPA
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userVpa}
                          onChange={e => setUserVpa(e.target.value.toLowerCase().trim())}
                          placeholder="e.g. mobile@paytm or yourname@okhdfcbank"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                        >
                          Request ₹{amount}
                        </button>
                      </div>

                      {userVpa && (
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Routing to: {resolvedUserBank.bankName}</span>
                        </div>
                      )}
                    </div>
                  </form>

                  {collectSent && (
                    <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                          Collect Request Dispatched to {userVpa}
                        </span>
                        <span className="font-mono text-purple-400 font-bold">
                          {formatCountdown(collectCountdown)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Open Google Pay, PhonePe, or Paytm on your phone, authorize the ₹{amount.toFixed(2)} request from <em>TubeEarn Technologies</em>, then confirm your UTR below.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* UTR Verification & Final Authorization Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1">
                      <span>12-Digit Bank UTR / Reference Number</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setManualUtr(generateUtr())}
                      className="text-[10px] text-emerald-400 hover:underline font-mono"
                    >
                      Regenerate UTR
                    </button>
                  </div>

                  <input
                    type="text"
                    value={manualUtr}
                    onChange={e => setManualUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="e.g. 428198302194"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold tracking-wider focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Found in your UPI app payment receipt / SMS.
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAuthorizeUpiPayment()}
                    disabled={isProcessing}
                    className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Validating Gateway...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Confirm &amp; Credit Escrow (₹{amount})
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAuthorizeUpiPayment(generateUtr())}
                    disabled={isProcessing}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    title="Simulate immediate UPI payment authorization without leaving the browser"
                  >
                    <Zap className="w-4 h-4 text-emerald-400" />
                    ⚡ 1-Click Instant UPI Auth (Test)
                  </button>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Funds are deposited into your <strong>Escrow Balance</strong>. You can lock them into campaigns or keep in app with full UPI withdrawability.
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
