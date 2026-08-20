import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  LogOut,
  CheckCircle2,
  QrCode,
  Layers,
  Check,
  User,
  ArrowLeft,
  ChevronRight,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BotConfig, BotStatus } from '../types';
interface AccountViewProps {
  config: BotConfig;
  onChangeConfig: (newConfig: BotConfig) => void;
  onSaveAndStart: (tempPassword?: string, tempSharedSecret?: string) => void;
  onStartQR: () => void;
  onStartSaved?: () => void;
  onForgetSession?: () => void;
  onStopBot: () => void;
  onRequestDisconnect?: () => void;
  onUpdatePersona: (personaState: number, customName: string) => Promise<void>;
  isLoading: boolean;
  botStatus: BotStatus;
  botPersonaState?: number;
  hasSavedSession?: boolean;
  savedAccountName?: string;
  qrChallengeUrl?: string | null;
  lastError?: string | null;
  onRefreshStatus?: () => Promise<void>;
}
type LoginMethod = 'menu' | 'password' | 'qr' | 'shared_secret';
const PERSONA_OPTIONS = [
  { state: 1, label: 'Online' },
  { state: 7, label: 'Invisible' },
  { state: 3, label: 'Away' },
  { state: 2, label: 'Busy' },
  { state: 4, label: 'Snooze' },
];
export const AccountView: React.FC<AccountViewProps> = ({
  config,
  onChangeConfig,
  onSaveAndStart,
  onStartQR,
  onStartSaved,
  onForgetSession,
  onStopBot,
  onRequestDisconnect,
  onUpdatePersona,
  isLoading,
  botStatus,
  botPersonaState,
  hasSavedSession,
  savedAccountName,
  qrChallengeUrl,
  lastError,
  onRefreshStatus,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<LoginMethod>('menu');
  const [showPassword, setShowPassword] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState(false);
  const [isApplyingPersona, setIsApplyingPersona] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [localPersonaState, setLocalPersonaState] = useState<number>(() => botPersonaState ?? config.personaState ?? 1);
  const [localCustomGameName, setLocalCustomGameName] = useState<string>(config.customGameName || '');
  useEffect(() => {
    if (botPersonaState !== undefined && botStatus === 'boosting') {
      setLocalPersonaState(botPersonaState);
    }
  }, [botStatus]);
  const [sessionPassword, setSessionPassword] = useState('');
  const [sessionSharedSecret, setSessionSharedSecret] = useState('');
  const handleUpdate = (fields: Partial<BotConfig>) => {
    onChangeConfig({ ...config, ...fields });
  };
  const handlePersonaSelect = (state: number) => {
    setLocalPersonaState(state);
  };
  const handleCustomNameChange = (val: string) => {
    setLocalCustomGameName(val);
  };
  const handleConfirmPersona = async () => {
    setIsApplyingPersona(true);
    try {
      await onUpdatePersona(localPersonaState, localCustomGameName);
      setPersonaSuccess(true);
      setTimeout(() => setPersonaSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsApplyingPersona(false);
    }
  };
  useEffect(() => {
    if (selectedMethod === 'qr' && botStatus === 'offline' && !isLoading) {
      onStartQR();
    }
  }, [selectedMethod, botStatus, isLoading, onStartQR]);
  const handleRefreshStatus = async () => {
    if (!onRefreshStatus) return;
    setIsRefreshingStatus(true);
    try {
      await onRefreshStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingStatus(false);
    }
  };
  const isSteamConnected = botStatus === 'boosting';
  const handleDisconnectClick = () => {
    if (onRequestDisconnect) {
      onRequestDisconnect();
    } else {
      onStopBot();
    }
  };
  const getPersonaBadge = (state: number) => {
    const found = PERSONA_OPTIONS.find((p) => p.state === state);
    return found ? found.label : 'Online';
  };
  return (
    <div className="space-y-6 w-full">
      {}
      {isSteamConnected ? (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-6 h-6 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white">
                    {config.accountName || 'Connected Steam Account'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-zinc-800 border border-zinc-600 text-xs font-semibold text-white">
                    {getPersonaBadge(config.personaState)}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDisconnectClick}
              disabled={isLoading}
              className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 hover:text-red-100 rounded text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
          {}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-white">Steam Status & Title</h3>
              </div>
              <div className="flex items-center gap-3">
                {onRefreshStatus && (
                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    disabled={isRefreshingStatus}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh Status from Steam"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                  </button>
                )}
                {personaSuccess && (
                  <span className="text-xs text-white font-medium flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Applied
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Online Status
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {PERSONA_OPTIONS.map((item) => (
                    <button
                      key={item.state}
                      type="button"
                      onClick={() => handlePersonaSelect(item.state)}
                      className={`py-2 px-2 rounded border text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${
                        localPersonaState === item.state
                          ? 'bg-white text-black font-bold border-white shadow-xs'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Custom Game Title
                </label>
                <input
                  type="text"
                  value={localCustomGameName}
                  onChange={(e) => handleCustomNameChange(e.target.value)}
                  placeholder="e.g. Boosting Playtime"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                />
              </div>
            </div>
            {}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmPersona}
                disabled={isApplyingPersona}
                className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                {isApplyingPersona ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Apply Status</span>
              </button>
              {personaSuccess && (
                <span className="text-xs text-zinc-400 animate-in fade-in">
                  Updated
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {}
          {hasSavedSession && onStartSaved && (
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {savedAccountName || config.accountName || 'Saved Steam Account'}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      Session Token Cached
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    1-click instant login. No passwords or QR codes needed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onStartSaved}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Quick Reconnect</span>
                </button>
                {onForgetSession && (
                  <button
                    type="button"
                    onClick={onForgetSession}
                    disabled={isLoading}
                    className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 rounded text-xs font-medium transition-colors cursor-pointer"
                    title="Remove saved session token from disk"
                  >
                    Forget
                  </button>
                )}
              </div>
            </div>
          )}
          {}
          {selectedMethod === 'menu' ? (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">Steam Login</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select authentication method.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {}
                <div
                  onClick={() => setSelectedMethod('password')}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg p-5 cursor-pointer transition-all duration-200 hover:bg-zinc-900/50 flex flex-col justify-between group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 flex items-center justify-center text-white transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-zinc-200">
                        Password
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Sign in with username and password.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-semibold text-zinc-300 group-hover:text-white">
                    <span>Select</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                {}
                <div
                  onClick={() => {
                    setSelectedMethod('qr');
                    onStartQR();
                  }}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg p-5 cursor-pointer transition-all duration-200 hover:bg-zinc-900/50 flex flex-col justify-between group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 flex items-center justify-center text-white transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-zinc-200">
                        QR Code
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Scan with the Steam Mobile app.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-semibold text-zinc-300 group-hover:text-white">
                    <span>Scan QR</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                {}
                <div
                  onClick={() => setSelectedMethod('shared_secret')}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg p-5 cursor-pointer transition-all duration-200 hover:bg-zinc-900/50 flex flex-col justify-between group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 flex items-center justify-center text-white transition-colors">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-zinc-200">
                        Shared Secret
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Auto 2FA with Steam Guard shared secret.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-semibold text-zinc-300 group-hover:text-white">
                    <span>Select</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-5">
              {}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    if (botStatus === 'awaiting_qr' || botStatus === 'connecting') {
                      onStopBot();
                    }
                    setSelectedMethod('menu');
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <div className="text-xs text-zinc-500 font-medium">
                  {selectedMethod === 'password' && 'Username & Password'}
                  {selectedMethod === 'qr' && 'QR Code'}
                  {selectedMethod === 'shared_secret' && 'Shared Secret'}
                </div>
              </div>
              {}
              {selectedMethod === 'password' && (
                <div className="space-y-4 max-w-xl">
                  {botStatus === 'error' && lastError && (
                    <div className="p-4 bg-red-950/40 border border-red-900/60 rounded space-y-2 text-xs text-red-300">
                      <div className="font-semibold">
                        Wrong password or login error: {lastError}
                      </div>
                      {lastError.toLowerCase().includes('ratelimit') && (
                        <p className="text-zinc-300 leading-relaxed font-normal">
                          Steam has temporarily rate-limited password logins on this server's IP address. 
                          <strong className="block mt-1.5 text-yellow-400">Solution: Simply switch to the "QR Code" login method! It is instantaneous and completely bypasses credential rate limits.</strong>
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Steam Account Name
                    </label>
                    <input
                      type="text"
                      value={config.accountName}
                      onChange={(e) => handleUpdate({ accountName: e.target.value })}
                      placeholder="Username"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Steam Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={sessionPassword}
                        onChange={(e) => setSessionPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded pl-3.5 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    If you are uncomfortable putting your Steam password, kindly just use the QR code login.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onSaveAndStart(sessionPassword, undefined)}
                      disabled={isLoading || !config.accountName || !sessionPassword}
                      className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded text-xs flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{isLoading ? 'Logging In...' : 'Log In'}</span>
                    </button>
                  </div>
                </div>
              )}
              {/* Method 2: QR */}
              {selectedMethod === 'qr' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Left: QR Code Display Frame */}
                    <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                      <div className="bg-white p-3.5 rounded-lg shadow-xl flex items-center justify-center">
                        {qrChallengeUrl ? (
                          <QRCodeSVG value={qrChallengeUrl} size={190} level="H" />
                        ) : (
                          <div className="w-[190px] h-[190px] flex flex-col items-center justify-center gap-2 text-zinc-700">
                            <Loader2 className="w-7 h-7 animate-spin text-zinc-800" />
                            <span className="text-[11px] font-medium text-zinc-500">
                              Loading QR...
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onStartQR}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                        {(botStatus === 'awaiting_qr' || botStatus === 'connecting') && (
                          <button
                            type="button"
                            onClick={onStopBot}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Right: Step-by-Step Instructions & Persona */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">Scan with Steam App</h4>
                      </div>
                      <div className="space-y-2 text-xs text-zinc-300">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center font-mono font-bold text-[11px] text-white shrink-0">
                            1
                          </span>
                          <span>Open Steam Mobile App</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center font-mono font-bold text-[11px] text-white shrink-0">
                            2
                          </span>
                          <span>Tap Steam Guard shield icon</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center font-mono font-bold text-[11px] text-white shrink-0">
                            3
                          </span>
                          <span>Scan this QR Code & confirm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Method 3: Shared Secret */}
              {selectedMethod === 'shared_secret' && (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Steam Account Name
                    </label>
                    <input
                      type="text"
                      value={config.accountName}
                      onChange={(e) => handleUpdate({ accountName: e.target.value })}
                      placeholder="Username"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Steam Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={sessionPassword}
                        onChange={(e) => setSessionPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded pl-3.5 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Shared Secret (Base64)
                    </label>
                    <input
                      type="text"
                      value={sessionSharedSecret}
                      onChange={(e) => setSessionSharedSecret(e.target.value)}
                      placeholder="e.g. jdfk93284sjf=="
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onSaveAndStart(sessionPassword, sessionSharedSecret)}
                      disabled={isLoading || !config.accountName || !sessionPassword || !sessionSharedSecret}
                      className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded text-xs flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{isLoading ? 'Logging In...' : 'Log In'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
