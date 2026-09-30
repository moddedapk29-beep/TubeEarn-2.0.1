import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { X, Share2, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, FacebookIcon } from './SocialIcons';
import confetti from 'canvas-confetti';

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialAccountsModal: React.FC<SocialAccountsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, connectSocialAccount } = useApp();

  const [ytHandle, setYtHandle] = useState(currentUser.connectedAccounts.youtube?.handle || '@aarav_yt');
  const [ytChannel, setYtChannel] = useState(currentUser.connectedAccounts.youtube?.channelName || 'Aarav Tech Notes');
  const [igHandle, setIgHandle] = useState(currentUser.connectedAccounts.instagram?.handle || '@aarav.gram');
  const [fbName, setFbName] = useState(currentUser.connectedAccounts.facebook?.profileName || 'Aarav Sharma');

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = (p: 'youtube' | 'instagram' | 'facebook', handle: string, channelName?: string) => {
    setConnectingPlatform(p);
    setTimeout(() => {
      connectSocialAccount(p, handle, channelName);
      setConnectingPlatform(null);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connected Social Accounts</h3>
              <p className="text-xs text-slate-400">Enables cross-platform task assignment &amp; anti-fraud verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* YouTube */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <YoutubeIcon className="w-5 h-5 text-red-500" />
                <span className="text-xs font-bold text-white">YouTube Google Account</span>
              </div>
              {currentUser.connectedAccounts.youtube?.connected ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Not Linked</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Channel Name"
                value={ytChannel}
                onChange={e => setYtChannel(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Handle (@name)"
                value={ytHandle}
                onChange={e => setYtHandle(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>

            <button
              onClick={() => handleConnect('youtube', ytHandle, ytChannel)}
              disabled={connectingPlatform === 'youtube'}
              className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all"
            >
              {connectingPlatform === 'youtube' ? 'Authorizing OAuth...' : currentUser.connectedAccounts.youtube?.connected ? 'Update YouTube Connection' : 'Connect via Google OAuth'}
            </button>
          </div>

          {/* Instagram */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <InstagramIcon className="w-5 h-5 text-pink-500" />
                <span className="text-xs font-bold text-white">Instagram Profile</span>
              </div>
              {currentUser.connectedAccounts.instagram?.connected ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Not Linked</span>
              )}
            </div>

            <input
              type="text"
              placeholder="Instagram Handle (@username)"
              value={igHandle}
              onChange={e => setIgHandle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
            />

            <button
              onClick={() => handleConnect('instagram', igHandle)}
              disabled={connectingPlatform === 'instagram'}
              className="w-full py-2 bg-pink-600/10 hover:bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded-lg text-xs font-bold transition-all"
            >
              {connectingPlatform === 'instagram' ? 'Connecting...' : currentUser.connectedAccounts.instagram?.connected ? 'Update Instagram' : 'Connect Instagram'}
            </button>
          </div>

          {/* Facebook */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FacebookIcon className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold text-white">Facebook Account</span>
              </div>
              {currentUser.connectedAccounts.facebook?.connected ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Not Linked</span>
              )}
            </div>

            <input
              type="text"
              placeholder="Facebook Profile / Page Name"
              value={fbName}
              onChange={e => setFbName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
            />

            <button
              onClick={() => handleConnect('facebook', fbName)}
              disabled={connectingPlatform === 'facebook'}
              className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
            >
              {connectingPlatform === 'facebook' ? 'Connecting...' : currentUser.connectedAccounts.facebook?.connected ? 'Update Facebook' : 'Connect Facebook'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
