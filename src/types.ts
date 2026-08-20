export interface SteamGame {
  appId: number;
  name: string;
  category?: string;
  headerImage?: string;
}
export interface BotLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}
export type BotStatus =
  | 'offline'
  | 'connecting'
  | 'awaiting_2fa'
  | 'awaiting_guard_code'
  | 'awaiting_qr'
  | 'boosting'
  | 'error'
  | 'disconnected';
export interface GameStatRecord {
  appId: number;
  name?: string;
  sessionSeconds: number;
  sessionHours: number;
  baseLifetimeHours: number;
  totalHours: number;
  startedAt?: number;
}
export interface BotState {
  status: BotStatus;
  accountName?: string;
  personaState: number;
  personaName?: string;
  activeGames: number[];
  customGameName?: string;
  startTime?: number | null;
  elapsedSeconds: number;
  lastError?: string | null;
  needsCodeType?: 'twoFactor' | 'emailGuard' | null;
  qrChallengeUrl?: string | null;
  gameStats?: Record<number, GameStatRecord>;
  totalLifetimeHoursAllGames?: number;
  hasSavedSession?: boolean;
  savedAccountName?: string;
  refreshToken?: string | null;
  logs: BotLogEntry[];
}
export interface BotConfig {
  accountName: string;
  password?: string;
  twoFactorCode?: string;
  sharedSecret?: string;
  personaState: number;
  gameIds: number[];
  customGameName?: string;
}
