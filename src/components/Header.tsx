import React from 'react';
import { Play, Square, Shield, Terminal, Settings, Flame, QrCode, Gamepad2, LogOut, User as UserIcon } from 'lucide-react';
import { BotStatus } from '../types';
import { motion } from 'motion/react';
interface HeaderProps {
  status: BotStatus;
  accountName?: string;
  activeTab: 'account' | 'games' | 'devices' | 'dashboard';
  setActiveTab: (tab: 'account' | 'games' | 'devices' | 'dashboard') => void;
  onStart: () => void;
  onStop: () => void;
  onRequestDisconnect?: () => void;
  isLoading: boolean;
}
export const Header: React.FC<HeaderProps> = ({
  status,
  accountName,
  activeTab,
  setActiveTab,
  onStart,
  onStop,
  onRequestDisconnect,
  isLoading,
}) => {
  const isConnected = status === 'boosting';
  const handleDisconnectClick = () => {
    if (onRequestDisconnect) {
      onRequestDisconnect();
    } else {
      onStop();
    }
  };
  const getStatusBadge = () => {
    switch (status) {
      case 'boosting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>Logged In</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-medium">
            <span className="animate-spin h-2 w-2 border-2 border-zinc-400 border-t-transparent rounded-full"></span>
            <span>Connecting</span>
          </div>
        );
      case 'awaiting_qr':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-medium">
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR</span>
          </div>
        );
      case 'awaiting_2fa':
      case 'awaiting_guard_code':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Steam Guard</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-zinc-500"></span>
            <span>Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-zinc-600"></span>
            <span>Offline</span>
          </div>
        );
    }
  };
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-white flex items-center justify-center">
              <Flame className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">Steam Hour Booster</span>
          </div>
          {}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-md border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('account')}
              className={`relative flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer z-10 ${
                activeTab === 'account'
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeTab === 'account' && (
                <motion.div
                  layoutId="activeTabIndicatorDesktop"
                  className="absolute inset-0 bg-zinc-800 rounded -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Settings className="w-3.5 h-3.5" />
              <span>Accounts</span>
            </button>
            {isConnected && (
              <>
                <button
                  onClick={() => setActiveTab('games')}
                  className={`relative flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer z-10 ${
                    activeTab === 'games'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {activeTab === 'games' && (
                    <motion.div
                      layoutId="activeTabIndicatorDesktop"
                      className="absolute inset-0 bg-zinc-800 rounded -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Games</span>
                </button>
                <button
                  onClick={() => setActiveTab('devices')}
                  className={`relative flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer z-10 ${
                    activeTab === 'devices'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {activeTab === 'devices' && (
                    <motion.div
                      layoutId="activeTabIndicatorDesktop"
                      className="absolute inset-0 bg-zinc-800 rounded -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Shield className="w-3.5 h-3.5" />
                  <span>Devices</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`relative flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer z-10 ${
                    activeTab === 'dashboard'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {activeTab === 'dashboard' && (
                    <motion.div
                      layoutId="activeTabIndicatorDesktop"
                      className="absolute inset-0 bg-zinc-800 rounded -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
          </div>
        </div>
        {}
        {isConnected && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-800">
            <button
              onClick={() => setActiveTab('account')}
              className={`relative flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer z-10 ${
                activeTab === 'account' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {activeTab === 'account' && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  className="absolute inset-0 bg-zinc-800 rounded -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Settings className="w-3.5 h-3.5" />
              <span>Accounts</span>
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`relative flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer z-10 ${
                activeTab === 'games' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {activeTab === 'games' && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  className="absolute inset-0 bg-zinc-800 rounded -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Games</span>
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`relative flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer z-10 ${
                activeTab === 'devices' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {activeTab === 'devices' && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  className="absolute inset-0 bg-zinc-800 rounded -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Shield className="w-3.5 h-3.5" />
              <span>Devices</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`relative flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer z-10 ${
                activeTab === 'dashboard' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {activeTab === 'dashboard' && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  className="absolute inset-0 bg-zinc-800 rounded -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Terminal className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
