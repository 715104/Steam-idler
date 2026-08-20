import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface PinLockModalProps {
  onUnlocked: () => void;
}

export function PinLockModal({ onUnlocked }: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your security PIN.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('steam_booster_pin', pin.trim());
        onUnlocked();
      } else {
        setError(data.error || 'Invalid security PIN.');
      }
    } catch {
      setError('Failed to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b13]/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-md bg-[#0e1626]/90 border border-cyan-500/20 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Protected Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Enter your private security PIN or password to unlock this Steam Hour Booster session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <KeyRound className="w-5 h-5 text-cyan-400/70" />
            </div>
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Security PIN / Password"
              autoFocus
              className="w-full pl-11 pr-11 py-3 bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-slate-100 text-center tracking-wider text-lg font-mono placeholder:text-slate-500 placeholder:text-sm placeholder:font-sans outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
          <span>Configured via Render Environment (`APP_PIN`)</span>
        </div>
      </div>
    </div>
  );
}
