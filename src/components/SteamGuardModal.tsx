import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight, X } from 'lucide-react';
import { motion } from 'motion/react';
interface SteamGuardModalProps {
  isOpen: boolean;
  needsCodeType: 'twoFactor' | 'emailGuard' | null;
  onSubmitCode: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}
export const SteamGuardModal: React.FC<SteamGuardModalProps> = ({
  isOpen,
  needsCodeType,
  onSubmitCode,
  onCancel,
  isLoading,
}) => {
  const [code, setCode] = useState('');
  if (!isOpen || !needsCodeType) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmitCode(code.trim());
      setCode('');
    }
  };
  const isEmail = needsCodeType === 'emailGuard';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-all hover:scale-110 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-500/10 border border-zinc-500/30 flex items-center justify-center text-zinc-400">
            {isEmail ? <Shield className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              {isEmail ? 'Steam Guard Email Code' : 'Steam 2FA Authenticator Code'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isEmail
                ? 'Check your account email inbox for the Steam verification code'
                : 'Enter the 5-digit code from your Steam Mobile Authenticator'}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Verification Code
            </label>
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={isEmail ? 'e.g. 5H92K' : 'e.g. G8T9K'}
              maxLength={7}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-zinc-300 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 uppercase transition-all"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-sm font-medium transition-all shadow-md shadow-zinc-950/40 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Submit Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
