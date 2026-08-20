import SteamUser from 'steam-user';
import SteamTotp from 'steam-totp';
import { LoginSession, EAuthTokenPlatformType } from 'steam-session';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { AllPlayedSteamGamesRetriever } from './AllPlayedSteamGamesRetriever';
export type LogLevel = 'info' | 'warn' | 'error' | 'success';
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}
export class SteamBot extends EventEmitter {
  public client: SteamUser | null = null;
  private loginSession: LoginSession | null = null;
  public status: 'offline' | 'connecting' | 'awaiting_guard_code' | 'awaiting_qr' | 'boosting' | 'error' = 'offline';
  public accountName = '';
  public activeGames: number[] = [];
  public customGameName = '';
  public personaState = 1; 
  public startTime: number | null = null;
  public lastError: string | null = null;
  public logs: LogEntry[] = [];
  public needsCodeType: 'twoFactor' | 'emailGuard' | null = null;
  public qrChallengeUrl: string | null = null;
  public currentRefreshToken: string | null = null;
  public savedRefreshToken: string | null = null;
  public savedAccountName: string = '';
  public webCookies: string[] = [];
  public ownedGamesStats: Map<number, { name: string; playtimeForeverMinutes: number; playtime2WeeksMinutes: number }> = new Map();
  private pendingGuardCallback: ((code: string) => void) | null = null;
  private sessionFilePath: string;
  constructor(userId: string = 'default') {
    super();
    const safeKey = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    this.sessionFilePath = path.join(process.cwd(), safeKey === 'default' ? '.session.json' : `.session_${safeKey}.json`);
    this.loadSavedSession();
    this.log('info', 'Steam Management Engine initialized.');
  }
  private loadSavedSession() {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        const raw = fs.readFileSync(this.sessionFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.refreshToken) {
          this.savedRefreshToken = data.refreshToken;
          this.savedAccountName = data.accountName || '';
          if (Array.isArray(data.gameIds) && data.gameIds.length > 0) {
            this.activeGames = data.gameIds;
          }
          if (data.customGameName) {
            this.customGameName = data.customGameName;
          }
          if (data.personaState !== undefined) {
            this.personaState = data.personaState;
          }
          this.log('info', `Cached login session detected for ${this.savedAccountName || 'Steam user'}.`);
        }
      }
    } catch (e) {
    }
  }
  private persistSession(refreshToken: string, accountName: string) {
    try {
      this.savedRefreshToken = refreshToken;
      this.savedAccountName = accountName;
      const data = {
        accountName,
        refreshToken,
        gameIds: this.activeGames,
        customGameName: this.customGameName,
        personaState: this.personaState,
        lastUpdated: Date.now(),
      };
      fs.writeFileSync(this.sessionFilePath, JSON.stringify(data, null, 2), 'utf-8');
      this.log('info', 'Login session token stored to disk for instant reconnects.');
    } catch (e: any) {
      this.log('warn', `Could not persist session token: ${e.message}`);
    }
  }
  public forgetSession() {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        fs.unlinkSync(this.sessionFilePath);
      }
    } catch (e) {}
    this.savedRefreshToken = null;
    this.savedAccountName = '';
    this.stop();
    this.log('info', 'Saved session token forgotten and removed from disk.');
  }
  public log(level: LogLevel, message: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.emit('log', entry);
    this.emit('stateUpdate');
  }
  public get getState() {
    const elapsedSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const sessionHours = Number((elapsedSeconds / 3600).toFixed(2));
    const gameStats: Record<number, { appId: number; name?: string; sessionSeconds: number; sessionHours: number; baseLifetimeHours: number; totalHours: number }> = {};
    let totalLifetimeHoursAllGames = 0;
    if (this.status === 'boosting') {
      for (const appId of this.activeGames) {
        const stats = this.ownedGamesStats.get(appId);
        const baseMins = stats ? stats.playtimeForeverMinutes : 0;
        const baseLifetimeHours = Number((baseMins / 60).toFixed(1));
        const totalHours = Number((baseLifetimeHours + sessionHours).toFixed(1));
        gameStats[appId] = {
          appId,
          name: stats ? stats.name : undefined,
          sessionSeconds: elapsedSeconds,
          sessionHours,
          baseLifetimeHours,
          totalHours,
        };
      }
      for (const stats of this.ownedGamesStats.values()) {
        totalLifetimeHoursAllGames += stats.playtimeForeverMinutes / 60;
      }
      totalLifetimeHoursAllGames += sessionHours * (this.activeGames.length || 0);
    }
    return {
      status: this.status,
      accountName: this.accountName || this.savedAccountName || '',
      activeGames: this.activeGames,
      customGameName: this.customGameName,
      personaState: this.personaState,
      startTime: this.startTime,
      elapsedSeconds,
      gameStats,
      totalLifetimeHoursAllGames: Number(totalLifetimeHoursAllGames.toFixed(1)),
      lastError: this.lastError,
      needsCodeType: this.needsCodeType,
      qrChallengeUrl: this.qrChallengeUrl,
      refreshToken: this.currentRefreshToken || this.savedRefreshToken || null,
      hasSavedSession: !!this.savedRefreshToken || !!this.currentRefreshToken,
      savedAccountName: this.savedAccountName || this.accountName || '',
      logs: this.logs,
    };
  }
  public async refreshOwnedGamesStats() {
    if (!this.client || this.status !== 'boosting' || !this.client.steamID) return;
    try {
      const allGames = await AllPlayedSteamGamesRetriever.retrieveAllPlayedGames(this);
      for (const item of allGames) {
        this.ownedGamesStats.set(item.appid, {
          name: item.name,
          playtimeForeverMinutes: item.playtime_forever,
          playtime2WeeksMinutes: item.playtime_2weeks,
        });
      }
      this.emit('stateUpdate');
    } catch (e) {
    }
  }
  public async getWebCookiesAsync(): Promise<string[]> {
    if (this.webCookies && this.webCookies.length > 0) {
      return this.webCookies;
    }
    if (!this.client || this.status !== 'boosting') {
      return [];
    }
    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(this.webCookies || []);
        }
      }, 6000);
      this.client!.once('webSession', (sessionID, cookies) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          this.webCookies = cookies;
          resolve(cookies);
        }
      });
      try {
        this.client!.webLogOn();
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(this.webCookies || []);
        }
      }
    });
  }
  public async forceRefresh() {
    if (!this.client || this.status !== 'boosting') return;
    this.log('info', 'Manual refresh triggered. Synchronizing games and Steam status...');
    await this.refreshOwnedGamesStats();
    this.setClientPersona();
    this.emit('stateUpdate');
  }
  private initClient() {
    if (this.client) {
      try {
        this.client.logOff();
        this.client.removeAllListeners();
      } catch (e) {}
    }
    this.client = new SteamUser({ promptSteamGuardCode: false, dataDirectory: null });
    this.client.on('loggedOn', () => {
      this.log('success', `Authenticated to Steam Network as ID64: ${this.client!.steamID?.getSteamID64()}`);
      this.status = 'boosting';
      this.lastError = null;
      this.needsCodeType = null;
      this.qrChallengeUrl = null;
      this.startTime = Date.now();
      this.applyGamesPlayed();
      try {
        this.client!.webLogOn();
      } catch (e) {}
      this.refreshOwnedGamesStats();
      this.emit('stateUpdate');
    });
    this.client.on('webSession', (sessionID: string, cookies: string[]) => {
      this.webCookies = cookies;
      this.log('info', 'Steam Web Session authorized.');
      this.refreshOwnedGamesStats();
    });
    this.client.on('playingState', (blocked: boolean, playingApp: number) => {
      if (blocked) {
        this.log('warn', `Steam reports playtime tracking paused (another session playing AppID ${playingApp}).`);
      } else {
        this.log('success', `Steam server confirmed active hour boosting session.`);
      }
      this.emit('stateUpdate');
    });
    this.client.on('ownershipCached', () => {
      this.refreshOwnedGamesStats();
    });
    this.client.on('refreshToken', (token: string) => {
      this.currentRefreshToken = token;
      this.log('info', 'Steam login session token received.');
      if (this.accountName) {
        this.persistSession(token, this.accountName);
      }
      try {
        if (!this.webCookies || this.webCookies.length === 0) {
          this.client!.webLogOn();
        }
      } catch (e) {}
      this.emit('stateUpdate');
    });
    this.client.on('error', (err: any) => {
      this.log('error', `Steam Network Error: ${err.message}`);
      this.status = 'error';
      this.lastError = err.message;
      this.startTime = null;
      this.needsCodeType = null;
      this.qrChallengeUrl = null;
      this.emit('stateUpdate');
    });
    this.client.on('steamGuard', (domain, callback) => {
      this.log('warn', `Steam Guard authorization required (Email domain: ${domain || 'N/A'})`);
      this.status = 'awaiting_guard_code';
      this.needsCodeType = 'emailGuard';
      this.pendingGuardCallback = callback;
      this.emit('stateUpdate');
    });
    this.client.on('disconnected', (eresult, msg) => {
      this.log('warn', `Disconnected from Steam Network: ${msg || eresult}`);
      if (this.status === 'boosting') {
        this.status = 'offline';
        this.startTime = null;
      }
      this.emit('stateUpdate');
    });
    this.client.on('loggedOff', (eresult, msg) => {
      this.log('warn', `Steam session logged off: EResult ${eresult}.`);
      this.stop();
    });
  }
  private async setClientPersona() {
    if (!this.client || this.status !== 'boosting') return;
    try {
      const stateNum = typeof this.personaState === 'number' ? this.personaState : parseInt(String(this.personaState), 10);
      const validState = isNaN(stateNum) ? 1 : stateNum;
      const EMsg = (SteamUser as any).EMsg;
      if (EMsg && typeof (this.client as any)._send === 'function') {
        (this.client as any)._send(EMsg.ClientChangeStatus, {
          persona_state: validState,
          persona_set_by_user: true,
          high_priority: true,
          need_persona_response: true,
        });
      } else {
        this.client.setPersona(validState);
      }
      const stateNames: Record<number, string> = { 0: 'Offline', 1: 'Online', 2: 'Busy', 3: 'Away', 4: 'Snooze', 7: 'Invisible' };
      this.log('info', `Steam online persona set to ${stateNames[validState] ?? validState}.`);
      const cookies = this.webCookies;
      if (cookies && cookies.length > 0) {
        const sessionCookie = cookies.find((c) => c.startsWith('sessionid='));
        const sessionId = sessionCookie ? sessionCookie.split('=')[1] : '';
        if (sessionId) {
          const formData = new URLSearchParams();
          formData.append('persona_state', validState.toString());
          formData.append('sessionid', sessionId);
          fetch('https://steamcommunity.com/actions/SetPersonaState', {
            method: 'POST',
            headers: {
              Cookie: cookies.join('; '),
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: 'https://steamcommunity.com/chat/',
              Origin: 'https://steamcommunity.com',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            body: formData.toString(),
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      this.log('warn', `Could not update Steam persona: ${e.message}`);
    }
  }
  private async applyGamesPlayed() {
    if (!this.client || this.status !== 'boosting') return;
    const cleanAppIds = (this.activeGames || [])
      .map((id) => parseInt(String(id), 10))
      .filter((id) => !isNaN(id) && id > 0)
      .slice(0, 32);
    if (cleanAppIds.length > 0) {
      try {
        await this.client.requestFreeLicense(cleanAppIds);
      } catch (e) {}
    }
    const gamesToIdle: any[] = [];
    if (this.customGameName && this.customGameName.trim()) {
      gamesToIdle.push({ game_id: '15190414816125648896', game_extra_info: this.customGameName.trim() });
    }
    if (cleanAppIds.length > 0) {
      gamesToIdle.push(...cleanAppIds);
    }
    if (gamesToIdle.length > 0) {
      this.client.gamesPlayed(gamesToIdle, true);
      this.log('info', `Now actively idling ${cleanAppIds.length} games on Steam [${cleanAppIds.join(', ')}].`);
    } else {
      this.client.gamesPlayed([], true);
      this.log('info', 'Connected to Steam. Idle list is empty.');
    }
    this.setClientPersona();
    setTimeout(() => {
      this.setClientPersona();
    }, 1000);
  }
  public submitGuardCode(code: string) {
    if (this.pendingGuardCallback) {
      this.log('info', 'Submitting Steam Guard code...');
      this.pendingGuardCallback(code);
      this.pendingGuardCallback = null;
      this.status = 'connecting';
      this.needsCodeType = null;
      this.emit('stateUpdate');
      return true;
    }
    return false;
  }
  public async startQRLogin(games: number[], customName: string, personaState: number) {
    this.activeGames = games;
    this.customGameName = customName;
    this.personaState = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    this.status = 'awaiting_qr';
    this.lastError = null;
    this.qrChallengeUrl = null;
    this.accountName = 'QR Login';
    this.log('info', 'Generating QR Code login session...');
    this.emit('stateUpdate');
    try {
      this.loginSession = new LoginSession(EAuthTokenPlatformType.SteamClient);
      this.loginSession.on('authenticated', () => {
        this.log('success', 'QR code scanned successfully! Connecting to Steam network...');
        this.accountName = this.loginSession!.accountName || 'QR User';
        this.currentRefreshToken = this.loginSession!.refreshToken;
        if (this.currentRefreshToken && this.accountName) {
          this.persistSession(this.currentRefreshToken, this.accountName);
        }
        this.finishLogin({ refreshToken: this.loginSession!.refreshToken });
      });
      this.loginSession.on('timeout', () => {
        this.log('error', 'QR login session timed out.');
        this.stop();
      });
      this.loginSession.on('error', (err) => {
        this.log('error', `QR login error: ${err.message}`);
        this.stop();
      });
      const res = await this.loginSession.startWithQR();
      this.qrChallengeUrl = res.qrChallengeUrl;
      this.log('info', 'QR Code generated. Waiting for Steam mobile scan...');
      this.emit('stateUpdate');
    } catch (err: any) {
      this.log('error', `Failed to start QR session: ${err.message}`);
      this.status = 'error';
      this.lastError = err.message;
      this.emit('stateUpdate');
    }
  }
  public startCredentialsLogin(accountName: string, password: string, sharedSecret: string, games: number[], customName: string, personaState: number) {
    this.accountName = accountName;
    this.activeGames = games;
    this.customGameName = customName;
    this.personaState = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    this.status = 'connecting';
    this.lastError = null;
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.log('info', `Connecting to Steam as ${accountName}...`);
    this.emit('stateUpdate');
    this.initClient();
    let twoFactorCode = '';
    if (sharedSecret) {
      try {
        twoFactorCode = SteamTotp.generateAuthCode(sharedSecret);
        this.log('info', 'Auto-generated 2FA code from shared secret.');
      } catch (e: any) {
        this.log('error', `Failed to generate 2FA: ${e.message}`);
      }
    }
    this.client!.logOn({ accountName, password, twoFactorCode });
  }
  public startTokenLogin(refreshToken: string, accountName: string, games: number[], customName: string, personaState: number) {
    this.accountName = accountName || this.savedAccountName || this.accountName || 'Token User';
    this.activeGames = games && games.length > 0 ? games : this.activeGames;
    this.customGameName = customName || this.customGameName;
    this.personaState = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    this.currentRefreshToken = refreshToken;
    this.status = 'connecting';
    this.lastError = null;
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.persistSession(refreshToken, this.accountName);
    this.log('info', `Authenticating using stored session token for ${this.accountName}...`);
    this.emit('stateUpdate');
    this.initClient();
    this.client!.logOn({ refreshToken });
  }
  public startSavedSession(games?: number[], customName?: string, personaState?: number) {
    const token = this.savedRefreshToken || this.currentRefreshToken;
    if (!token) {
      this.log('error', 'No saved session token found.');
      return false;
    }
    this.startTokenLogin(
      token,
      this.savedAccountName,
      games || this.activeGames,
      customName || this.customGameName,
      personaState ?? this.personaState
    );
    return true;
  }
  private finishLogin(logOnOptions: any) {
    this.status = 'connecting';
    this.qrChallengeUrl = null;
    this.emit('stateUpdate');
    this.initClient();
    this.client!.logOn(logOnOptions);
  }
  public stop() {
    this.log('info', 'Disconnected from Steam.');
    if (this.client) {
      try {
        this.client.logOff();
        this.client.removeAllListeners();
      } catch (e) {}
      this.client = null;
    }
    if (this.loginSession) {
      try {
        this.loginSession.cancelLoginAttempt();
        this.loginSession.removeAllListeners();
      } catch (e) {}
      this.loginSession = null;
    }
    this.status = 'offline';
    this.startTime = null;
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.emit('stateUpdate');
  }
  public updatePersona(personaState: number, customName?: string) {
    const stateNum = typeof personaState === 'number' ? personaState : parseInt(String(personaState), 10);
    this.personaState = isNaN(stateNum) ? 1 : stateNum;
    const nameChanged = customName !== undefined && customName !== this.customGameName;
    if (customName !== undefined) {
      this.customGameName = customName;
    }
    if (this.savedRefreshToken && this.accountName) {
      this.persistSession(this.savedRefreshToken, this.accountName);
    }
    if (this.client && this.status === 'boosting') {
      this.setClientPersona();
      if (nameChanged) {
        this.applyGamesPlayed();
      }
      this.emit('stateUpdate');
    }
  }
  public updateGames(games: number[], customName?: string) {
    this.activeGames = games.slice(0, 32);
    if (customName !== undefined) {
      this.customGameName = customName;
    }
    if (this.savedRefreshToken && this.accountName) {
      this.persistSession(this.savedRefreshToken, this.accountName);
    }
    if (this.client && this.status === 'boosting') {
      this.applyGamesPlayed();
      this.emit('stateUpdate');
    }
  }
  public clearLogs() {
    this.logs = [];
    this.log('info', 'Logs cleared.');
    this.emit('stateUpdate');
  }
}
