import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Layers,
  Sparkles,
  User,
  Activity,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  AlertTriangle,
  RotateCcw,
  Timer,
  Flame,
  Award,
} from 'lucide-react';
import { BotState } from '../types';
import { getGameHeaderUrl, getGameName } from '../data/games';
interface DashboardViewProps {
  botState: BotState;
  onStart: () => void;
  onStartQR: () => void;
  onStop: () => void;
  onClearLogs: () => void;
  onSwitchToGames: () => void;
  onSwitchToAccount: () => void;
}
export const DashboardView: React.FC<DashboardViewProps> = ({
  botState,
  onStart,
  onClearLogs,
  onSwitchToGames,
}) => {
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'success'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedLog, setCopiedLog] = useState(false);
  const terminalBoxRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = botState.status === 'boosting';
  useEffect(() => {
    if (autoScroll && terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [botState.logs, autoScroll]);
  const [localSeconds, setLocalSeconds] = useState(botState.elapsedSeconds || 0);
  useEffect(() => {
    setLocalSeconds(botState.elapsedSeconds || 0);
  }, [botState.elapsedSeconds]);
  useEffect(() => {
    if (isLoggedIn && botState.startTime) {
      const timer = setInterval(() => {
        const secs = Math.floor((Date.now() - botState.startTime!) / 1000);
        setLocalSeconds(secs >= 0 ? secs : 0);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn, botState.startTime]);
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  const gameCount = botState.activeGames?.length || 0;
  const elapsedHours = localSeconds / 3600;
  const totalCombinedBoostedHours = (elapsedHours * gameCount).toFixed(2);
  const perGameSessionHoursDecimal = elapsedHours.toFixed(2);
  const [activeGamesPage, setActiveGamesPage] = useState(1);
  const GAMES_PER_PAGE = 6;
  const totalGamePages = Math.ceil(gameCount / GAMES_PER_PAGE) || 1;
  const paginatedGames = (botState.activeGames || []).slice(
    (activeGamesPage - 1) * GAMES_PER_PAGE,
    activeGamesPage * GAMES_PER_PAGE
  );
  useEffect(() => {
    if (activeGamesPage > totalGamePages) {
      setActiveGamesPage(1);
    }
  }, [totalGamePages, activeGamesPage]);
  let totalCumulativeLifetimeHours = 0;
  if (botState.activeGames && botState.activeGames.length > 0) {
    for (const appId of botState.activeGames) {
      const stat = botState.gameStats?.[appId];
      if (stat && stat.totalHours > 0) {
        totalCumulativeLifetimeHours += stat.totalHours;
      } else {
        totalCumulativeLifetimeHours += elapsedHours;
      }
    }
  }
  const getPersonaLabel = (state: number) => {
    switch (state) {
      case 1:
        return { label: 'Online', color: 'text-zinc-200 bg-zinc-800 border-zinc-700' };
      case 2:
        return { label: 'Busy', color: 'text-zinc-200 bg-zinc-800 border-zinc-700' };
      case 3:
        return { label: 'Away', color: 'text-zinc-200 bg-zinc-800 border-zinc-700' };
      case 4:
        return { label: 'Snooze', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
      case 7:
        return { label: 'Invisible', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
      default:
        return { label: 'Online', color: 'text-zinc-200 bg-zinc-800 border-zinc-700' };
    }
  };
  const personaInfo = getPersonaLabel(botState.personaState);
  const filteredLogs = botState.logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });
  const handleCopyLogs = () => {
    const text = botState.logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };
  return (
    <div className="space-y-6 w-full">
      {}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-xs relative overflow-hidden w-full">
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {}
          <div className="space-y-2 border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0 md:pr-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Steam Account</span>
            </div>
            {isLoggedIn ? (
              <>
                <div className="text-xl font-bold text-white truncate">
                  {botState.accountName}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${personaInfo.color}`}>
                    {personaInfo.label}
                  </span>
                  {botState.customGameName && (
                    <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded truncate max-w-[150px]">
                      "{botState.customGameName}"
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-zinc-400">Not Connected</div>
                <p className="text-xs text-zinc-600">Log in on the Accounts tab to begin.</p>
              </>
            )}
          </div>
          {}
          <div className="space-y-2 border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0 md:pr-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Session Duration</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white tracking-wider">
              {formatTime(localSeconds)}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-zinc-400">
                {isLoggedIn ? 'Server Idling Active (24/7)' : 'Offline'}
              </p>
            </div>
          </div>
          {}
          <div className="space-y-2 border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0 md:pr-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Idling Games</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{gameCount}</span>
              <span className="text-zinc-500 font-medium text-sm">/ 32 max</span>
            </div>
            <div className="w-full bg-zinc-900 border border-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${(gameCount / 32) * 100}%` }}
              />
            </div>
          </div>
          {}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Boosted This Session</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white">+{totalCombinedBoostedHours}</span>
              <span className="text-xs text-zinc-500 font-semibold uppercase">hrs total</span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5 flex-wrap">
              <Flame className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <span>{gameCount} {gameCount === 1 ? 'game' : 'games'} active</span>
              <span className="text-zinc-600 font-bold">·</span>
              <span className="text-emerald-400 font-mono font-semibold">+{gameCount}.0 hrs/hr</span>
            </div>
          </div>
        </div>
        {}
        {botState.lastError && (
          <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 rounded flex items-center justify-between text-xs text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span><strong>Last Error:</strong> {botState.lastError}</span>
            </div>
            <button
              onClick={onStart}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 ml-2 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
      {}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-zinc-300" />
              <h3 className="font-bold text-base text-white">Active Games ({gameCount})</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {totalGamePages > 1 && (
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
                <button
                  type="button"
                  onClick={() => setActiveGamesPage((p) => Math.max(1, p - 1))}
                  disabled={activeGamesPage <= 1}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono text-zinc-400">
                  {activeGamesPage} / {totalGamePages}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveGamesPage((p) => Math.min(totalGamePages, p + 1))}
                  disabled={activeGamesPage >= totalGamePages}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={onSwitchToGames}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Manage Games ({gameCount})</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
        {gameCount === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-lg">
            <Gamepad2 className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-400">No games currently configured for boosting</p>
            <p className="text-xs text-zinc-500 mt-1">Select games from the Games tab to start clocking playtime hours.</p>
            <button
              onClick={onSwitchToGames}
              className="mt-4 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded text-xs font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            >
              Configure Games
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedGames.map((appId) => {
              const gameName = getGameName(appId);
              const gameStat = botState.gameStats?.[appId];
              const gameSeconds = gameStat ? gameStat.sessionSeconds : localSeconds;
              const formattedDuration = formatTime(gameSeconds);
              const sessionBoostedHours = gameStat ? gameStat.sessionHours.toFixed(2) : perGameSessionHoursDecimal;
              const baseHours = gameStat?.baseLifetimeHours ? gameStat.baseLifetimeHours.toFixed(1) : '0.0';
              const totalGameHours = gameStat?.totalHours 
                ? gameStat.totalHours.toFixed(2) 
                : (Number(baseHours) + Number(sessionBoostedHours)).toFixed(2);
              return (
                <div
                  key={appId}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-650 rounded-lg p-4 transition-all duration-300 hover:scale-[1.03] active:scale-[0.99] flex flex-col justify-between space-y-3 group shadow-lg"
                >
                  {}
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-11 rounded bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700/60 relative">
                      <img
                        src={getGameHeaderUrl(appId)}
                        alt={gameName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isLoggedIn && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-black" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate" title={gameName}>
                          {gameName}
                        </h4>
                        <a
                          href={`https://store.steampowered.com/app/${appId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors shrink-0"
                          title="View on Steam Store"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        AppID: {appId}
                      </div>
                    </div>
                  </div>
                  {}
                  <div className="bg-black/60 border border-zinc-800 rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-zinc-300" />
                        <span>Total Game Hours</span>
                      </div>
                      <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1 mt-0.5">
                        <span>{totalGameHours}</span>
                        <span className="text-xs text-zinc-400 font-semibold">hrs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-emerald-400">
                        Session Gain
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                        +{sessionBoostedHours} hrs
                      </div>
                    </div>
                  </div>
                  {}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950/70 border border-zinc-800/80 rounded p-2.5 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-500">
                        Idling Time
                      </div>
                      <div className="font-mono font-medium text-zinc-200 mt-0.5">
                        {formattedDuration}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-500">
                        Prior Baseline
                      </div>
                      <div className="font-mono font-medium text-zinc-400 mt-0.5">
                        {baseHours} hrs
                      </div>
                    </div>
                  </div>
                  {}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLoggedIn ? 'bg-emerald-400' : 'bg-zinc-600'
                        }`}
                      />
                      <span className="text-zinc-300">
                        {isLoggedIn ? 'Active Idling' : 'Queued'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalGamePages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400">
              <span className="font-mono">
                Showing {(activeGamesPage - 1) * GAMES_PER_PAGE + 1} - {Math.min(activeGamesPage * GAMES_PER_PAGE, gameCount)} of {gameCount} active games
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveGamesPage((p) => Math.max(1, p - 1))}
                  disabled={activeGamesPage <= 1}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded flex items-center gap-1 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="px-2.5 font-mono text-zinc-300 font-bold">
                  Page {activeGamesPage} of {totalGamePages}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveGamesPage((p) => Math.min(totalGamePages, p + 1))}
                  disabled={activeGamesPage >= totalGamePages}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded flex items-center gap-1 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
      {}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h3 className="font-bold text-sm text-white">Live Activity Stream</h3>
          </div>
          {}
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
            {(['all', 'info', 'warn', 'error', 'success'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                  logFilter === filter
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[380px]">
          {}
          <div className="bg-zinc-900/80 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="text-[11px] font-mono text-zinc-500 ml-2">steam-client.log</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLogs}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                title="Copy terminal logs"
              >
                {copiedLog ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLog ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={onClearLogs}
                className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                title="Clear terminal logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          {}
          <div
            ref={terminalBoxRef}
            className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 bg-black/90 select-text"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-20 italic">
                No log entries recorded yet.
              </div>
            ) : (
              filteredLogs.map((log) => {
                let color = 'text-zinc-300';
                if (log.level === 'error') color = 'text-red-400';
                if (log.level === 'warn') color = 'text-yellow-400';
                if (log.level === 'success') color = 'text-emerald-400';
                return (
                  <div key={log.id} className="leading-relaxed flex items-start gap-2 break-all">
                    <span className="text-zinc-600 select-none shrink-0">[{log.timestamp}]</span>
                    <span
                      className={`uppercase text-[10px] px-1 py-0.2 rounded shrink-0 border ${
                        log.level === 'error'
                          ? 'border-red-900 bg-red-950/50 text-red-400'
                          : log.level === 'warn'
                          ? 'border-yellow-900 bg-yellow-950/50 text-yellow-400'
                          : log.level === 'success'
                          ? 'border-emerald-900 bg-emerald-950/50 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className={`${color} flex-1`}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
