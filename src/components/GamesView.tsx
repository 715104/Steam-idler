import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Search,
  Plus,
  Check,
  Trash2,
  Loader2,
  Download,
  Layers,
  CheckCheck,
} from 'lucide-react';
import { BotConfig, BotState } from '../types';
import { getGameHeaderUrl, getGameName } from '../data/games';
import { apiFetch } from '../lib/api';
interface GamesViewProps {
  config: BotConfig;
  onChangeConfig: (newConfig: BotConfig) => void;
  botState: BotState;
}
interface OwnedApp {
  appid: number;
  name?: string;
  playtime_forever?: number;
}
export const GamesView: React.FC<GamesViewProps> = ({
  config,
  onChangeConfig,
  botState,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'library' | 'search' | 'manual'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [ownedGames, setOwnedGames] = useState<OwnedApp[]>([]);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [isFetchingOwned, setIsFetchingOwned] = useState(false);
  const [hasFetchedOwned, setHasFetchedOwned] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>(() => {
    if (config.gameIds && config.gameIds.length > 0) return config.gameIds;
    if (botState.activeGames && botState.activeGames.length > 0) return botState.activeGames;
    return [];
  });
  const [customAppIdInput, setCustomAppIdInput] = useState('');
  const [rawAppIdList, setRawAppIdList] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRawAppIdList(selectedGameIds.join(', '));
  }, []);
  useEffect(() => {
    if (botState.status === 'boosting' && !hasFetchedOwned && !isFetchingOwned) {
      handleFetchOwned();
    }
  }, [botState.status, hasFetchedOwned, isFetchingOwned]);
  const handleToggleGame = (appId: number) => {
    setSelectedGameIds((prev) => {
      let updated: number[];
      if (prev.includes(appId)) {
        updated = prev.filter((id) => id !== appId);
      } else {
        if (prev.length >= 32) {
          setFeedbackMsg({ text: 'Maximum limit is 32 games simultaneously.', type: 'error' });
          setTimeout(() => setFeedbackMsg(null), 3000);
          return prev;
        }
        updated = [...prev, appId];
      }
      setRawAppIdList(updated.join(', '));
      return updated;
    });
  };
  const handleApplyGames = async () => {
    setIsApplying(true);
    setError(null);
    try {
      if (botState.status === 'boosting') {
        const res = await apiFetch('/api/bot/update-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameIds: selectedGameIds,
            customGameName: config.customGameName,
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to update live games on Steam');
        }
        onChangeConfig({ ...config, gameIds: selectedGameIds });
        setFeedbackMsg({
          text:
            selectedGameIds.length === 0
              ? 'Applied! Stopped idling all games on Steam.'
              : `Applied! Steam is now idling ${selectedGameIds.length} games.`,
          type: 'success',
        });
      } else {
        onChangeConfig({ ...config, gameIds: selectedGameIds });
        setFeedbackMsg({
          text:
            selectedGameIds.length === 0
              ? 'Cleared all games from configuration.'
              : `Saved ${selectedGameIds.length} games to your configuration.`,
          type: 'success',
        });
      }
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error applying game selection', type: 'error' });
    } finally {
      setIsApplying(false);
    }
  };
  const handleClearSelected = () => {
    setSelectedGameIds([]);
    setRawAppIdList('');
  };
  const handleAddCustomAppId = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(customAppIdInput.trim(), 10);
    if (isNaN(id) || id <= 0) return;
    if (selectedGameIds.includes(id)) {
      setCustomAppIdInput('');
      return;
    }
    if (selectedGameIds.length >= 32) {
      setFeedbackMsg({ text: 'Maximum limit is 32 games.', type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }
    const updated = [...selectedGameIds, id];
    setSelectedGameIds(updated);
    setRawAppIdList(updated.join(', '));
    setCustomAppIdInput('');
  };
  const handleApplyRawCsv = () => {
    const parsed = rawAppIdList
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    const unique: number[] = Array.from(new Set<number>(parsed)).slice(0, 32);
    setSelectedGameIds(unique);
    setFeedbackMsg({ text: `Set selection to ${unique.length} games.`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 2500);
  };
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/steam/search?term=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.items) {
        setSearchResults(data.items);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      setError('Search failed. Check network connection.');
    } finally {
      setIsSearching(false);
    }
  };
  const handleFetchOwned = async () => {
    setIsFetchingOwned(true);
    setError(null);
    try {
      const res = await apiFetch('/api/steam/owned-games');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch library.');
      const apps = data.apps || [];
      setOwnedGames(apps);
      setHasFetchedOwned(true);
      if (apps.length === 0) {
        setError('No games played history found on this account.');
      } else {
        setFeedbackMsg({ text: `Fetched ${apps.length} games from your play history.`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Log in to Steam first to fetch library games.');
    } finally {
      setIsFetchingOwned(false);
    }
  };
  const filteredOwnedGames = ownedGames.filter((g) => {
    if (!libraryFilter.trim()) return true;
    const query = libraryFilter.toLowerCase();
    const matchesId = g.appid.toString().includes(query);
    const matchesName = g.name ? g.name.toLowerCase().includes(query) : false;
    return matchesId || matchesName;
  });
  const getDisplayName = (id: number) => {
    const fromOwned = ownedGames.find((g) => g.appid === id);
    if (fromOwned && fromOwned.name) return fromOwned.name;
    return getGameName(id);
  };
  return (
    <div className="space-y-6 w-full">
      {}
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Gamepad2 className="w-5 h-5 text-white" />
          <h2 className="text-base font-bold text-white">Games Selection</h2>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
            {selectedGameIds.length}/32
          </span>
        </div>
      </div>
      {feedbackMsg && (
        <div
          className={`p-3 rounded text-xs font-medium flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-zinc-900 border border-zinc-700 text-white'
              : 'bg-red-950/40 border border-red-900/60 text-red-300'
          }`}
        >
          <CheckCheck className="w-4 h-4 shrink-0 text-white" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}
      {}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
            {}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSubTab('library')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] ${
                  activeSubTab === 'library'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>All games played</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('search')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] ${
                  activeSubTab === 'search'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Steam Store</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('manual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] ${
                  activeSubTab === 'manual'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Manual AppIDs</span>
              </button>
            </div>
            {}
            {activeSubTab === 'library' && (
              <div className="space-y-4">
                {botState.status !== 'boosting' ? (
                  <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded text-center space-y-2">
                    <p className="text-xs text-zinc-300">
                      Steam account must be logged in to fetch your personal game library.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={libraryFilter}
                        onChange={(e) => setLibraryFilter(e.target.value)}
                        placeholder="Filter your games played..."
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleFetchOwned}
                        disabled={isFetchingOwned}
                        className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isFetchingOwned ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Refresh Games List</span>
                      </button>
                    </div>
                    {error && (
                      <div className="p-2.5 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-300">
                        {error}
                      </div>
                    )}
                    {hasFetchedOwned && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                        {filteredOwnedGames.map((game) => {
                          const isSelected = selectedGameIds.includes(game.appid);
                          return (
                            <div
                              key={game.appid}
                              onClick={() => handleToggleGame(game.appid)}
                              className={`flex flex-col p-2.5 rounded border cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
                                isSelected
                                  ? 'bg-zinc-900 border-white'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-650'
                              }`}
                            >
                              <img
                                src={getGameHeaderUrl(game.appid)}
                                alt={`AppID ${game.appid}`}
                                className="w-full h-20 object-cover rounded bg-zinc-900 mb-2"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex items-start justify-between gap-1 min-w-0">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-white truncate">
                                    {game.name || `AppID ${game.appid}`}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    AppID: {game.appid}
                                  </div>
                                  {typeof game.playtime_forever === 'number' && game.playtime_forever > 0 && (
                                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                                      {(game.playtime_forever / 60).toFixed(1)} hrs total
                                    </div>
                                  )}
                                  {typeof game.playtime_2weeks === 'number' && game.playtime_2weeks > 0 && (
                                    <div className="text-[10px] text-emerald-400 font-mono">
                                      {(game.playtime_2weeks / 60).toFixed(1)} hrs past 2 weeks
                                    </div>
                                  )}
                                </div>
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'bg-white border-white text-black'
                                      : 'border-zinc-700 bg-zinc-900 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {}
            {activeSubTab === 'search' && (
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any game (e.g. Counter-Strike 2, Terraria, Rust, Apex Legends)..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 bg-white text-black font-bold rounded text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:bg-zinc-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Search</span>
                  </button>
                </form>
                {error && (
                  <div className="p-2.5 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-300">
                    {error}
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {searchResults.map((game) => {
                      const isSelected = selectedGameIds.includes(game.id);
                      return (
                        <div
                          key={game.id}
                          onClick={() => handleToggleGame(game.id)}
                          className={`flex flex-col p-2.5 rounded border cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
                            isSelected
                              ? 'bg-zinc-900 border-white'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-650'
                          }`}
                        >
                          <img
                            src={game.tiny_image || getGameHeaderUrl(game.id)}
                            alt={game.name}
                            className="w-full h-20 object-cover rounded bg-zinc-900 mb-2"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex items-start justify-between gap-1 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white truncate">
                                {game.name}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                AppID: {game.id}
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-white border-white text-black'
                                  : 'border-zinc-700 bg-zinc-900 text-transparent'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {}
            {activeSubTab === 'manual' && (
              <div className="space-y-5">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Single AppID
                  </h3>
                  <form onSubmit={handleAddCustomAppId} className="flex gap-2">
                    <input
                      type="number"
                      value={customAppIdInput}
                      onChange={(e) => setCustomAppIdInput(e.target.value)}
                      placeholder="e.g. 730"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                    />
                    <button
                      type="submit"
                      disabled={!customAppIdInput.trim()}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Add to Selection
                    </button>
                  </form>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Bulk Edit / CSV
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Paste a comma or space-separated list of AppIDs here.
                  </p>
                  <textarea
                    rows={4}
                    value={rawAppIdList}
                    onChange={(e) => setRawAppIdList(e.target.value)}
                    placeholder="730, 440, 570, 252490, 105600"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-hidden focus:border-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplyRawCsv}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Parse & Apply to Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {}
        <div className="lg:col-span-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 sticky top-6 flex flex-col h-[calc(100vh-120px)] max-h-[700px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Selected for Idling</h3>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white">
                {selectedGameIds.length}/32
              </span>
            </div>
            {}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              {selectedGameIds.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 py-10">
                  <Layers className="w-8 h-8 opacity-20" />
                  <p className="text-xs text-center px-4">
                    No games selected.<br />Choose up to 32 games from your library, search, or enter AppIDs.
                  </p>
                </div>
              ) : (
                selectedGameIds.map((id) => (
                  <div
                    key={id}
                    className="group flex items-center justify-between p-2 rounded bg-zinc-900/50 border border-zinc-800 hover:border-zinc-650 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-zinc-800 shrink-0 overflow-hidden">
                        <img
                          src={getGameHeaderUrl(id)}
                          alt={String(id)}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate max-w-[140px]" title={getDisplayName(id)}>
                          {getDisplayName(id)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          ID: {id}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGame(id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors cursor-pointer"
                      title="Remove game"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {}
            <div className="pt-4 border-t border-zinc-800 space-y-3 shrink-0">
              <button
                type="button"
                onClick={handleApplyGames}
                disabled={isApplying}
                className={`w-full py-2.5 font-bold text-xs rounded transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                  selectedGameIds.length === 0
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    : 'bg-white hover:bg-zinc-200 text-black'
                }`}
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>
                  {selectedGameIds.length === 0
                    ? (botState.activeGames && botState.activeGames.length > 0 ? 'Apply (Stop Idling All)' : 'Apply Selection (0 games)')
                    : `Apply Selection (${selectedGameIds.length})`}
                </span>
              </button>
              {selectedGameIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="w-full py-2 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded text-[11px] font-semibold transition-all duration-200 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
