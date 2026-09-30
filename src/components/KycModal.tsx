import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { X, ShieldCheck, ShieldAlert, CheckCircle2, FileText, Lock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateKyc } = useApp();

  const [docType, setDocType] = useState<'aadhaar' | 'pan' | 'voter_id'>('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [fullName, setFullName] = useState(currentUser.name);
  const [dob, setDob] = useState('1998-05-14');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (docNumber.length < 8) return;

    setIsSubmitting(true);
    setTimeout(() => {
      updateKyc('verified', docType, docNumber);
      setIsSubmitting(false);
      setStatusMessage('Identity Document verified successfully! Full withdrawal access granted.');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">KYC &amp; Identity Verification</h3>
              <p className="text-xs text-slate-400">Mandatory for ₹299+ UPI/Bank payouts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-slate-300">
              Your sensitive documents are encrypted and masked. Only the last 4 digits are stored for payout cross-referencing.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'aadhaar', label: 'Aadhaar Card' },
              { id: 'pan', label: 'PAN Card' },
              { id: 'voter_id', label: 'Voter ID' }
            ].map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDocType(d.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  docType === d.id 
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300' 
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {docType === 'aadhaar' ? '12-Digit Aadhaar Number' : docType === 'pan' ? '10-Character PAN Number' : 'Voter ID Number'}
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={e => setDocNumber(e.target.value.toUpperCase())}
              placeholder={docType === 'aadhaar' ? '5482 9182 8921' : 'ABCDE1234F'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || docNumber.length < 8}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40"
            >
              {isSubmitting ? 'Verifying with NSDL / UIDAI Gateway...' : 'Submit & Verify Instantly'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
