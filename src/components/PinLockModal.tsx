import React, { useState } from 'react';
import { apiFetch } from '../lib/api';

interface PinLockModalProps {
  onUnlocked: () => void;
}

export function PinLockModal({ onUnlocked }: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
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
        setError(data.error || 'Invalid PIN');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl">
        <h2 className="text-base font-medium text-white text-center mb-4">
          Enter PIN
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            autoFocus
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-400 rounded-lg text-white text-center text-lg font-mono tracking-widest outline-none placeholder:text-zinc-600 transition-colors"
          />

          {error && (
            <p className="text-xs text-red-400 text-center font-mono">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
