var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/server/SteamBot.ts
var import_steam_user = __toESM(require("steam-user"), 1);
var import_steam_totp = __toESM(require("steam-totp"), 1);
var import_steam_session = require("steam-session");
var import_events = require("events");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);

// src/data/games.ts
var POPULAR_GAMES_DATABASE = [
  { appId: 730, name: "Counter-Strike 2", category: "Competitive FPS" },
  { appId: 440, name: "Team Fortress 2", category: "Hero Shooter" },
  { appId: 570, name: "Dota 2", category: "MOBA" },
  { appId: 252490, name: "Rust", category: "Survival" },
  { appId: 271590, name: "Grand Theft Auto V", category: "Open World" },
  { appId: 105600, name: "Terraria", category: "Sandbox" },
  { appId: 431960, name: "Wallpaper Engine", category: "Utility" },
  { appId: 1172470, name: "Apex Legends", category: "Battle Royale" },
  { appId: 578080, name: "PUBG: BATTLEGROUNDS", category: "Battle Royale" },
  { appId: 230410, name: "Warframe", category: "Action RPG" },
  { appId: 108600, name: "Project Zomboid", category: "Survival" },
  { appId: 359550, name: "Tom Clancy's Rainbow Six Siege", category: "Tactical FPS" },
  { appId: 1091500, name: "Cyberpunk 2077", category: "RPG" },
  { appId: 292030, name: "The Witcher 3: Wild Hunt", category: "RPG" },
  { appId: 289070, name: "Sid Meier's Civilization VI", category: "Strategy" },
  { appId: 346110, name: "ARK: Survival Evolved", category: "Survival" },
  { appId: 1172620, name: "Sea of Thieves", category: "Adventure" },
  { appId: 892970, name: "Valheim", category: "Survival" },
  { appId: 242760, name: "The Forest", category: "Survival Horror" },
  { appId: 4e3, name: "Garry's Mod", category: "Sandbox" },
  { appId: 550, name: "Left 4 Dead 2", category: "Co-op FPS" },
  { appId: 218620, name: "PAYDAY 2", category: "Co-op Action" },
  { appId: 394360, name: "Hearts of Iron IV", category: "Grand Strategy" },
  { appId: 281990, name: "Stellaris", category: "Grand Strategy" }
];

// src/server/AllPlayedSteamGamesRetriever.ts
var AllPlayedSteamGamesRetriever = class {
  static async retrieveAllPlayedGames(bot) {
    if (!bot.client || bot.status !== "boosting" || !bot.client.steamID) {
      return [];
    }
    const steamID64 = bot.client.steamID.getSteamID64();
    const gamesMap = /* @__PURE__ */ new Map();
    try {
      const cookies = await bot.getWebCookiesAsync();
      const cookieHeader = cookies && cookies.length > 0 ? cookies.join("; ") : "";
      const fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      };
      if (cookieHeader) {
        fetchHeaders["Cookie"] = cookieHeader;
      }
      const profileUrls = [
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=recent`,
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=all`
      ];
      let webApiToken = null;
      for (const url of profileUrls) {
        try {
          const res = await fetch(url, { headers: fetchHeaders });
          if (res.ok) {
            const html = await res.text();
            const loaderMatches = html.matchAll(/loaderData\s*=\s*([\s\S]*?);/gi);
            for (const lm of loaderMatches) {
              try {
                const data = JSON.parse(lm[1]);
                if (Array.isArray(data)) {
                  for (let i = 0; i < data.length; i++) {
                    const item = typeof data[i] === "string" ? JSON.parse(data[i]) : data[i];
                    if (item.strWebAPIToken && !webApiToken) {
                      webApiToken = item.strWebAPIToken;
                    }
                    if (item.listData) {
                      const list = item.listData;
                      const candidateLists = [list.rgRecentlyPlayedGames, list.rgGames];
                      for (const cl of candidateLists) {
                        if (Array.isArray(cl)) {
                          for (const g of cl) {
                            const appid = parseInt(String(g.appid), 10);
                            if (isNaN(appid) || appid <= 0) continue;
                            const name = g.name ? String(g.name).trim() : "";
                            const foreverMins = typeof g.playtime_forever === "number" ? g.playtime_forever : 0;
                            const weeksMins = typeof g.playtime_2weeks === "number" ? g.playtime_2weeks : 0;
                            const existing = gamesMap.get(appid);
                            gamesMap.set(appid, {
                              appid,
                              name: name || existing?.name || "",
                              playtime_forever: Math.max(foreverMins, existing?.playtime_forever || 0),
                              playtime_2weeks: Math.max(weeksMins, existing?.playtime_2weeks || 0),
                              img_icon_url: g.img_icon_url || existing?.img_icon_url,
                              last_played: g.rtime_last_played || existing?.last_played,
                              source: "ssr_loader_data"
                            });
                          }
                        }
                      }
                    }
                  }
                }
              } catch (parseErr) {
              }
            }
            const jsonMatches = [
              html.match(/var\s+rgGames\s*=\s*(\[[\s\S]*?\]);\s*(?:var|$)/i),
              html.match(/var\s+rgChangingGames\s*=\s*(\[[\s\S]*?\]);\s*(?:var|$)/i),
              html.match(/g_rgGames\s*=\s*(\[[\s\S]*?\]);\s*/i)
            ];
            for (const match of jsonMatches) {
              if (match && match[1]) {
                try {
                  const parsed = JSON.parse(match[1]);
                  if (Array.isArray(parsed)) {
                    for (const g of parsed) {
                      const appid = parseInt(String(g.appid), 10);
                      if (isNaN(appid) || appid <= 0) continue;
                      let foreverMins = 0;
                      if (typeof g.hours_forever === "number") {
                        foreverMins = Math.round(g.hours_forever * 60);
                      } else if (typeof g.hours_forever === "string") {
                        const num = parseFloat(g.hours_forever.replace(/,/g, ""));
                        if (!isNaN(num)) foreverMins = Math.round(num * 60);
                      } else if (typeof g.playtime_forever === "number") {
                        foreverMins = g.playtime_forever;
                      }
                      let weeksMins = 0;
                      if (typeof g.hours === "number") {
                        weeksMins = Math.round(g.hours * 60);
                      } else if (typeof g.hours === "string") {
                        const num = parseFloat(g.hours.replace(/,/g, ""));
                        if (!isNaN(num)) weeksMins = Math.round(num * 60);
                      } else if (typeof g.playtime_2weeks === "number") {
                        weeksMins = g.playtime_2weeks;
                      }
                      const name = g.name ? String(g.name).trim() : "";
                      const existing = gamesMap.get(appid);
                      gamesMap.set(appid, {
                        appid,
                        name: name || existing?.name || "",
                        playtime_forever: Math.max(foreverMins, existing?.playtime_forever || 0),
                        playtime_2weeks: Math.max(weeksMins, existing?.playtime_2weeks || 0),
                        img_logo_url: g.logo || existing?.img_logo_url,
                        last_played: g.last_played || existing?.last_played,
                        source: "community_html"
                      });
                    }
                  }
                } catch (e) {
                }
              }
            }
          }
        } catch (err) {
        }
      }
      if (webApiToken) {
        try {
          const recentUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?access_token=${webApiToken}`;
          const res = await fetch(recentUrl);
          if (res.ok) {
            const json = await res.json();
            if (json?.response?.games && Array.isArray(json.response.games)) {
              for (const g of json.response.games) {
                const appid = parseInt(String(g.appid), 10);
                if (isNaN(appid) || appid <= 0) continue;
                const existing = gamesMap.get(appid);
                gamesMap.set(appid, {
                  appid,
                  name: g.name || existing?.name || "",
                  playtime_forever: Math.max(g.playtime_forever || 0, existing?.playtime_forever || 0),
                  playtime_2weeks: Math.max(g.playtime_2weeks || 0, existing?.playtime_2weeks || 0),
                  img_icon_url: g.img_icon_url || existing?.img_icon_url,
                  source: "webapi_token"
                });
              }
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
    }
    try {
      const cookies = bot.webCookies || [];
      const cookieHeader = cookies.length > 0 ? cookies.join("; ") : "";
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      };
      if (cookieHeader) headers["Cookie"] = cookieHeader;
      const xmlUrls = [
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=recent&xml=1`,
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=all&xml=1`
      ];
      for (const url of xmlUrls) {
        try {
          const resp = await fetch(url, { headers });
          if (resp.ok) {
            const xmlText = await resp.text();
            const gameMatches = xmlText.matchAll(/<game>([\s\S]*?)<\/game>/gi);
            for (const match of gameMatches) {
              const block = match[1];
              const appIdMatch = block.match(/<appID>(\d+)<\/appID>/i);
              if (!appIdMatch) continue;
              const appid = parseInt(appIdMatch[1], 10);
              if (isNaN(appid) || appid <= 0) continue;
              let name = "";
              const nameCdata = block.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>/i);
              const nameTag = block.match(/<name>(.*?)<\/name>/i);
              if (nameCdata) name = nameCdata[1].trim();
              else if (nameTag) name = nameTag[1].trim();
              let playtimeForever = 0;
              const foreverMatch = block.match(/<hoursOnRecord>(.*?)<\/hoursOnRecord>/i);
              if (foreverMatch) {
                const hours = parseFloat(foreverMatch[1].replace(/,/g, ""));
                if (!isNaN(hours)) playtimeForever = Math.round(hours * 60);
              }
              let playtime2Weeks = 0;
              const weeksMatch = block.match(/<hoursLast2Weeks>(.*?)<\/hoursLast2Weeks>/i);
              if (weeksMatch) {
                const hours = parseFloat(weeksMatch[1].replace(/,/g, ""));
                if (!isNaN(hours)) playtime2Weeks = Math.round(hours * 60);
              }
              const existing = gamesMap.get(appid);
              gamesMap.set(appid, {
                appid,
                name: name || existing?.name || "",
                playtime_forever: Math.max(playtimeForever, existing?.playtime_forever || 0),
                playtime_2weeks: Math.max(playtime2Weeks, existing?.playtime_2weeks || 0),
                source: "community_xml"
              });
            }
          }
        } catch (err) {
        }
      }
    } catch (e) {
    }
    try {
      if (typeof bot.client.getUserOwnedApps === "function") {
        const response = await bot.client.getUserOwnedApps(bot.client.steamID, {
          includeAppInfo: true,
          includePlayedFreeGames: true,
          includeFreeSub: true,
          skipUnvettedApps: false
        });
        if (response?.apps && Array.isArray(response.apps)) {
          for (const g of response.apps) {
            const appid = parseInt(String(g.appid), 10);
            if (isNaN(appid) || appid <= 0) continue;
            const existing = gamesMap.get(appid);
            gamesMap.set(appid, {
              appid,
              name: g.name || existing?.name || "",
              playtime_forever: Math.max(g.playtime_forever || 0, existing?.playtime_forever || 0),
              playtime_2weeks: Math.max(g.playtime_2weeks || 0, existing?.playtime_2weeks || 0),
              img_icon_url: g.img_icon_url || existing?.img_icon_url,
              img_logo_url: g.img_logo_url || existing?.img_logo_url,
              source: "steam_rpc"
            });
          }
        }
      }
    } catch (err) {
    }
    if (bot.ownedGamesStats && bot.ownedGamesStats.size > 0) {
      bot.ownedGamesStats.forEach((val, appid) => {
        const existing = gamesMap.get(appid);
        gamesMap.set(appid, {
          appid,
          name: val.name || existing?.name || "",
          playtime_forever: Math.max(Math.round(val.playtimeForeverMinutes || 0), existing?.playtime_forever || 0),
          playtime_2weeks: Math.max(Math.round(val.playtime2WeeksMinutes || 0), existing?.playtime_2weeks || 0),
          source: existing?.source || "bot_cache"
        });
      });
    }
    for (const item of gamesMap.values()) {
      if (!item.name || item.name.trim() === "" || item.name.startsWith("AppID ")) {
        const found = POPULAR_GAMES_DATABASE.find((p) => p.appId === item.appid);
        if (found) {
          item.name = found.name;
        } else {
          item.name = `AppID ${item.appid}`;
        }
      }
    }
    const allPlayed = Array.from(gamesMap.values());
    allPlayed.sort((a, b) => {
      if ((b.playtime_2weeks || 0) !== (a.playtime_2weeks || 0)) {
        return (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0);
      }
      return (b.playtime_forever || 0) - (a.playtime_forever || 0);
    });
    return allPlayed;
  }
};

// src/server/SteamBot.ts
var SteamBot = class extends import_events.EventEmitter {
  constructor(userId = "default") {
    super();
    this.client = null;
    this.loginSession = null;
    this.status = "offline";
    this.accountName = "";
    this.activeGames = [];
    this.customGameName = "";
    this.personaState = 1;
    this.startTime = null;
    this.lastError = null;
    this.logs = [];
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.currentRefreshToken = null;
    this.savedRefreshToken = null;
    this.savedAccountName = "";
    this.webCookies = [];
    this.ownedGamesStats = /* @__PURE__ */ new Map();
    this.pendingGuardCallback = null;
    const safeKey = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    this.sessionFilePath = import_path.default.join(process.cwd(), safeKey === "default" ? ".session.json" : `.session_${safeKey}.json`);
    this.loadSavedSession();
    this.log("info", "Steam Management Engine initialized.");
  }
  loadSavedSession() {
    try {
      if (import_fs.default.existsSync(this.sessionFilePath)) {
        const raw = import_fs.default.readFileSync(this.sessionFilePath, "utf-8");
        const data = JSON.parse(raw);
        if (data.refreshToken) {
          this.savedRefreshToken = data.refreshToken;
          this.savedAccountName = data.accountName || "";
          if (Array.isArray(data.gameIds) && data.gameIds.length > 0) {
            this.activeGames = data.gameIds;
          }
          if (data.customGameName) {
            this.customGameName = data.customGameName;
          }
          if (data.personaState !== void 0) {
            this.personaState = data.personaState;
          }
          this.log("info", `Cached login session detected for ${this.savedAccountName || "Steam user"}.`);
        }
      }
    } catch (e) {
    }
  }
  persistSession(refreshToken, accountName) {
    try {
      this.savedRefreshToken = refreshToken;
      this.savedAccountName = accountName;
      const data = {
        accountName,
        refreshToken,
        gameIds: this.activeGames,
        customGameName: this.customGameName,
        personaState: this.personaState,
        lastUpdated: Date.now()
      };
      import_fs.default.writeFileSync(this.sessionFilePath, JSON.stringify(data, null, 2), "utf-8");
      this.log("info", "Login session token stored to disk for instant reconnects.");
    } catch (e) {
      this.log("warn", `Could not persist session token: ${e.message}`);
    }
  }
  forgetSession() {
    try {
      if (import_fs.default.existsSync(this.sessionFilePath)) {
        import_fs.default.unlinkSync(this.sessionFilePath);
      }
    } catch (e) {
    }
    this.savedRefreshToken = null;
    this.savedAccountName = "";
    this.stop();
    this.log("info", "Saved session token forgotten and removed from disk.");
  }
  log(level, message) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      level,
      message
    };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.emit("log", entry);
    this.emit("stateUpdate");
  }
  get getState() {
    const elapsedSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1e3) : 0;
    const sessionHours = Number((elapsedSeconds / 3600).toFixed(2));
    const gameStats = {};
    let totalLifetimeHoursAllGames = 0;
    if (this.status === "boosting") {
      for (const appId of this.activeGames) {
        const stats = this.ownedGamesStats.get(appId);
        const baseMins = stats ? stats.playtimeForeverMinutes : 0;
        const baseLifetimeHours = Number((baseMins / 60).toFixed(1));
        const totalHours = Number((baseLifetimeHours + sessionHours).toFixed(1));
        gameStats[appId] = {
          appId,
          name: stats ? stats.name : void 0,
          sessionSeconds: elapsedSeconds,
          sessionHours,
          baseLifetimeHours,
          totalHours
        };
      }
      for (const stats of this.ownedGamesStats.values()) {
        totalLifetimeHoursAllGames += stats.playtimeForeverMinutes / 60;
      }
      totalLifetimeHoursAllGames += sessionHours * (this.activeGames.length || 0);
    }
    return {
      status: this.status,
      accountName: this.accountName || this.savedAccountName || "",
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
      savedAccountName: this.savedAccountName || this.accountName || "",
      logs: this.logs
    };
  }
  async refreshOwnedGamesStats() {
    if (!this.client || this.status !== "boosting" || !this.client.steamID) return;
    try {
      const allGames = await AllPlayedSteamGamesRetriever.retrieveAllPlayedGames(this);
      for (const item of allGames) {
        this.ownedGamesStats.set(item.appid, {
          name: item.name,
          playtimeForeverMinutes: item.playtime_forever,
          playtime2WeeksMinutes: item.playtime_2weeks
        });
      }
      this.emit("stateUpdate");
    } catch (e) {
    }
  }
  async getWebCookiesAsync() {
    if (this.webCookies && this.webCookies.length > 0) {
      return this.webCookies;
    }
    if (!this.client || this.status !== "boosting") {
      return [];
    }
    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(this.webCookies || []);
        }
      }, 6e3);
      this.client.once("webSession", (sessionID, cookies) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          this.webCookies = cookies;
          resolve(cookies);
        }
      });
      try {
        this.client.webLogOn();
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(this.webCookies || []);
        }
      }
    });
  }
  async forceRefresh() {
    if (!this.client || this.status !== "boosting") return;
    this.log("info", "Manual refresh triggered. Synchronizing games and Steam status...");
    await this.refreshOwnedGamesStats();
    this.setClientPersona();
    this.emit("stateUpdate");
  }
  initClient() {
    if (this.client) {
      try {
        this.client.logOff();
        this.client.removeAllListeners();
      } catch (e) {
      }
    }
    this.client = new import_steam_user.default({ promptSteamGuardCode: false, dataDirectory: null });
    this.client.on("loggedOn", () => {
      this.log("success", `Authenticated to Steam Network as ID64: ${this.client.steamID?.getSteamID64()}`);
      this.status = "boosting";
      this.lastError = null;
      this.needsCodeType = null;
      this.qrChallengeUrl = null;
      this.startTime = Date.now();
      this.applyGamesPlayed();
      try {
        this.client.webLogOn();
      } catch (e) {
      }
      this.refreshOwnedGamesStats();
      this.emit("stateUpdate");
    });
    this.client.on("webSession", (sessionID, cookies) => {
      this.webCookies = cookies;
      this.log("info", "Steam Web Session authorized.");
      this.refreshOwnedGamesStats();
    });
    this.client.on("playingState", (blocked, playingApp) => {
      if (blocked) {
        this.log("warn", `Steam reports playtime tracking paused (another session playing AppID ${playingApp}).`);
      } else {
        this.log("success", `Steam server confirmed active hour boosting session.`);
      }
      this.emit("stateUpdate");
    });
    this.client.on("ownershipCached", () => {
      this.refreshOwnedGamesStats();
    });
    this.client.on("refreshToken", (token) => {
      this.currentRefreshToken = token;
      this.log("info", "Steam login session token received.");
      if (this.accountName) {
        this.persistSession(token, this.accountName);
      }
      try {
        if (!this.webCookies || this.webCookies.length === 0) {
          this.client.webLogOn();
        }
      } catch (e) {
      }
      this.emit("stateUpdate");
    });
    this.client.on("error", (err) => {
      this.log("error", `Steam Network Error: ${err.message}`);
      this.status = "error";
      this.lastError = err.message;
      this.startTime = null;
      this.needsCodeType = null;
      this.qrChallengeUrl = null;
      this.emit("stateUpdate");
    });
    this.client.on("steamGuard", (domain, callback) => {
      this.log("warn", `Steam Guard authorization required (Email domain: ${domain || "N/A"})`);
      this.status = "awaiting_guard_code";
      this.needsCodeType = "emailGuard";
      this.pendingGuardCallback = callback;
      this.emit("stateUpdate");
    });
    this.client.on("disconnected", (eresult, msg) => {
      this.log("warn", `Disconnected from Steam Network: ${msg || eresult}`);
      if (this.status === "boosting") {
        this.status = "offline";
        this.startTime = null;
      }
      this.emit("stateUpdate");
    });
    this.client.on("loggedOff", (eresult, msg) => {
      this.log("warn", `Steam session logged off: EResult ${eresult}.`);
      this.stop();
    });
  }
  async setClientPersona() {
    if (!this.client || this.status !== "boosting") return;
    try {
      const stateNum = typeof this.personaState === "number" ? this.personaState : parseInt(String(this.personaState), 10);
      const validState = isNaN(stateNum) ? 1 : stateNum;
      const EMsg = import_steam_user.default.EMsg;
      if (EMsg && typeof this.client._send === "function") {
        this.client._send(EMsg.ClientChangeStatus, {
          persona_state: validState,
          persona_set_by_user: true,
          high_priority: true,
          need_persona_response: true
        });
      } else {
        this.client.setPersona(validState);
      }
      const stateNames = { 0: "Offline", 1: "Online", 2: "Busy", 3: "Away", 4: "Snooze", 7: "Invisible" };
      this.log("info", `Steam online persona set to ${stateNames[validState] ?? validState}.`);
      const cookies = this.webCookies;
      if (cookies && cookies.length > 0) {
        const sessionCookie = cookies.find((c) => c.startsWith("sessionid="));
        const sessionId = sessionCookie ? sessionCookie.split("=")[1] : "";
        if (sessionId) {
          const formData = new URLSearchParams();
          formData.append("persona_state", validState.toString());
          formData.append("sessionid", sessionId);
          fetch("https://steamcommunity.com/actions/SetPersonaState", {
            method: "POST",
            headers: {
              Cookie: cookies.join("; "),
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Referer: "https://steamcommunity.com/chat/",
              Origin: "https://steamcommunity.com",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            },
            body: formData.toString()
          }).catch(() => {
          });
        }
      }
    } catch (e) {
      this.log("warn", `Could not update Steam persona: ${e.message}`);
    }
  }
  async applyGamesPlayed() {
    if (!this.client || this.status !== "boosting") return;
    const cleanAppIds = (this.activeGames || []).map((id) => parseInt(String(id), 10)).filter((id) => !isNaN(id) && id > 0).slice(0, 32);
    if (cleanAppIds.length > 0) {
      try {
        await this.client.requestFreeLicense(cleanAppIds);
      } catch (e) {
      }
    }
    const gamesToIdle = [];
    if (this.customGameName && this.customGameName.trim()) {
      gamesToIdle.push({ game_id: "15190414816125648896", game_extra_info: this.customGameName.trim() });
    }
    if (cleanAppIds.length > 0) {
      gamesToIdle.push(...cleanAppIds);
    }
    if (gamesToIdle.length > 0) {
      this.client.gamesPlayed(gamesToIdle, true);
      this.log("info", `Now actively idling ${cleanAppIds.length} games on Steam [${cleanAppIds.join(", ")}].`);
    } else {
      this.client.gamesPlayed([], true);
      this.log("info", "Connected to Steam. Idle list is empty.");
    }
    this.setClientPersona();
    setTimeout(() => {
      this.setClientPersona();
    }, 1e3);
  }
  submitGuardCode(code) {
    if (this.pendingGuardCallback) {
      this.log("info", "Submitting Steam Guard code...");
      this.pendingGuardCallback(code);
      this.pendingGuardCallback = null;
      this.status = "connecting";
      this.needsCodeType = null;
      this.emit("stateUpdate");
      return true;
    }
    return false;
  }
  async startQRLogin(games, customName, personaState) {
    this.activeGames = games;
    this.customGameName = customName;
    this.personaState = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    this.status = "awaiting_qr";
    this.lastError = null;
    this.qrChallengeUrl = null;
    this.accountName = "QR Login";
    this.log("info", "Generating QR Code login session...");
    this.emit("stateUpdate");
    try {
      this.loginSession = new import_steam_session.LoginSession(import_steam_session.EAuthTokenPlatformType.SteamClient);
      this.loginSession.on("authenticated", () => {
        this.log("success", "QR code scanned successfully! Connecting to Steam network...");
        this.accountName = this.loginSession.accountName || "QR User";
        this.currentRefreshToken = this.loginSession.refreshToken;
        if (this.currentRefreshToken && this.accountName) {
          this.persistSession(this.currentRefreshToken, this.accountName);
        }
        this.finishLogin({ refreshToken: this.loginSession.refreshToken });
      });
      this.loginSession.on("timeout", () => {
        this.log("error", "QR login session timed out.");
        this.stop();
      });
      this.loginSession.on("error", (err) => {
        this.log("error", `QR login error: ${err.message}`);
        this.stop();
      });
      const res = await this.loginSession.startWithQR();
      this.qrChallengeUrl = res.qrChallengeUrl;
      this.log("info", "QR Code generated. Waiting for Steam mobile scan...");
      this.emit("stateUpdate");
    } catch (err) {
      this.log("error", `Failed to start QR session: ${err.message}`);
      this.status = "error";
      this.lastError = err.message;
      this.emit("stateUpdate");
    }
  }
  startCredentialsLogin(accountName, password, sharedSecret, games, customName, personaState) {
    this.accountName = accountName;
    this.activeGames = games;
    this.customGameName = customName;
    this.personaState = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    this.status = "connecting";
    this.lastError = null;
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.log("info", `Connecting to Steam as ${accountName}...`);
    this.emit("stateUpdate");
    this.initClient();
    let twoFactorCode = "";
    if (sharedSecret) {
      try {
        twoFactorCode = import_steam_totp.default.generateAuthCode(sharedSecret);
        this.log("info", "Auto-generated 2FA code from shared secret.");
      } catch (e) {
        this.log("error", `Failed to generate 2FA: ${e.message}`);
      }
    }
    this.client.logOn({ accountName, password, twoFactorCode });
  }
  startTokenLogin(refreshToken, accountName, games, customName, personaState) {
    this.accountName = accountName || this.savedAccountName || this.accountName || "Token User";
    this.activeGames = games && games.length > 0 ? games : this.activeGames;
    this.customGameName = customName || this.customGameName;
    this.personaState = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    this.currentRefreshToken = refreshToken;
    this.status = "connecting";
    this.lastError = null;
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.persistSession(refreshToken, this.accountName);
    this.log("info", `Authenticating using stored session token for ${this.accountName}...`);
    this.emit("stateUpdate");
    this.initClient();
    this.client.logOn({ refreshToken });
  }
  startSavedSession(games, customName, personaState) {
    const token = this.savedRefreshToken || this.currentRefreshToken;
    if (!token) {
      this.log("error", "No saved session token found.");
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
  finishLogin(logOnOptions) {
    this.status = "connecting";
    this.qrChallengeUrl = null;
    this.emit("stateUpdate");
    this.initClient();
    this.client.logOn(logOnOptions);
  }
  stop() {
    this.log("info", "Disconnected from Steam.");
    if (this.client) {
      try {
        this.client.logOff();
        this.client.removeAllListeners();
      } catch (e) {
      }
      this.client = null;
    }
    if (this.loginSession) {
      try {
        this.loginSession.cancelLoginAttempt();
        this.loginSession.removeAllListeners();
      } catch (e) {
      }
      this.loginSession = null;
    }
    this.status = "offline";
    this.startTime = null;
    this.needsCodeType = null;
    this.qrChallengeUrl = null;
    this.emit("stateUpdate");
  }
  updatePersona(personaState, customName) {
    const stateNum = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10);
    this.personaState = isNaN(stateNum) ? 1 : stateNum;
    const nameChanged = customName !== void 0 && customName !== this.customGameName;
    if (customName !== void 0) {
      this.customGameName = customName;
    }
    if (this.savedRefreshToken && this.accountName) {
      this.persistSession(this.savedRefreshToken, this.accountName);
    }
    if (this.client && this.status === "boosting") {
      this.setClientPersona();
      if (nameChanged) {
        this.applyGamesPlayed();
      }
      this.emit("stateUpdate");
    }
  }
  updateGames(games, customName) {
    this.activeGames = games.slice(0, 32);
    if (customName !== void 0) {
      this.customGameName = customName;
    }
    if (this.savedRefreshToken && this.accountName) {
      this.persistSession(this.savedRefreshToken, this.accountName);
    }
    if (this.client && this.status === "boosting") {
      this.applyGamesPlayed();
      this.emit("stateUpdate");
    }
  }
  clearLogs() {
    this.logs = [];
    this.log("info", "Logs cleared.");
    this.emit("stateUpdate");
  }
};

// src/server/BotManager.ts
var BotManager = class {
  constructor() {
    this.bots = /* @__PURE__ */ new Map();
  }
  getBot(userId) {
    const key = userId && userId.trim() ? userId.trim() : "default";
    if (!this.bots.has(key)) {
      const newBot = new SteamBot();
      this.bots.set(key, newBot);
      newBot.log("info", `Dedicated server idler allocated for user session: ${key}`);
    }
    return this.bots.get(key);
  }
  getAllActiveBots() {
    const list = [];
    for (const [userId, bot] of this.bots.entries()) {
      list.push({ userId, bot });
    }
    return list;
  }
};
var botManager = new BotManager();

// src/server/routes.ts
var import_steam_totp2 = __toESM(require("steam-totp"), 1);
function getBotForRequest(req) {
  const headerUser = req.headers["x-user-id"];
  const userId = typeof headerUser === "string" && headerUser.trim() || typeof req.query.userId === "string" && req.query.userId.trim() || req.body && typeof req.body.userId === "string" && req.body.userId.trim() || "default";
  return botManager.getBot(userId);
}
function setupRoutes(app) {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app.get("/api/status", (req, res) => {
    const bot = getBotForRequest(req);
    res.json(bot.getState);
  });
  app.post("/api/bot/start", (req, res) => {
    const bot = getBotForRequest(req);
    let { accountName, password, sharedSecret, personaState = 1, gameIds = [], customGameName = "" } = req.body;
    if (accountName) {
      accountName = accountName.trim();
    }
    if (!accountName || !password) {
      return res.status(400).json({ error: "Account name and password are required" });
    }
    const stateNum = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    bot.startCredentialsLogin(accountName, password, sharedSecret, gameIds, customGameName, stateNum);
    res.json({ success: true, message: "Login process started" });
  });
  app.post("/api/bot/start-token", (req, res) => {
    const bot = getBotForRequest(req);
    const { refreshToken, accountName = "", personaState = 1, gameIds = [], customGameName = "" } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Login token is required" });
    }
    const stateNum = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    bot.startTokenLogin(refreshToken, accountName, gameIds, customGameName, stateNum);
    res.json({ success: true, message: "Login with token started" });
  });
  app.post("/api/bot/start-saved", (req, res) => {
    const bot = getBotForRequest(req);
    const { personaState = 1, gameIds = [], customGameName = "" } = req.body;
    const stateNum = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    const started = bot.startSavedSession(gameIds, customGameName, stateNum);
    if (!started) {
      return res.status(400).json({ error: "No saved session token found" });
    }
    res.json({ success: true, message: "Reconnecting with saved session token..." });
  });
  app.post("/api/bot/forget-session", (req, res) => {
    const bot = getBotForRequest(req);
    bot.forgetSession();
    res.json({ success: true, message: "Saved session token removed" });
  });
  app.post("/api/bot/start-qr", async (req, res) => {
    const bot = getBotForRequest(req);
    const { personaState = 1, gameIds = [], customGameName = "" } = req.body;
    const stateNum = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    await bot.startQRLogin(gameIds, customGameName, stateNum);
    res.json({ success: true, message: "QR session initiated" });
  });
  app.post("/api/bot/stop", (req, res) => {
    const bot = getBotForRequest(req);
    bot.stop();
    res.json({ success: true, status: "offline" });
  });
  app.post("/api/bot/update-persona", (req, res) => {
    const bot = getBotForRequest(req);
    const { personaState = 1, customGameName } = req.body;
    const stateNum = typeof personaState === "number" ? personaState : parseInt(String(personaState), 10) || 1;
    bot.updatePersona(stateNum, customGameName);
    res.json({ success: true, personaState: stateNum, customGameName });
  });
  app.post("/api/bot/update-games", (req, res) => {
    const bot = getBotForRequest(req);
    const { gameIds = [], customGameName } = req.body;
    bot.updateGames(gameIds, customGameName);
    res.json({ success: true, message: `Updated active games to ${gameIds.length} titles` });
  });
  app.post("/api/bot/refresh-status", async (req, res) => {
    const bot = getBotForRequest(req);
    if (bot.status === "boosting") {
      await bot.forceRefresh();
    }
    res.json({ success: true });
  });
  app.post("/api/bot/submit-code", (req, res) => {
    const bot = getBotForRequest(req);
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }
    const submitted = bot.submitGuardCode(code);
    res.json({ success: submitted, message: submitted ? "Code submitted" : "No code pending" });
  });
  app.post("/api/totp/generate", (req, res) => {
    const { sharedSecret } = req.body;
    if (!sharedSecret) return res.status(400).json({ error: "Shared secret required" });
    try {
      const code = import_steam_totp2.default.generateAuthCode(sharedSecret);
      const timeOffset = import_steam_totp2.default.time();
      const secondsRemaining = 30 - timeOffset % 30;
      res.json({ code, secondsRemaining, timeOffset });
    } catch (e) {
      res.status(500).json({ error: e.message || "Invalid secret format" });
    }
  });
  app.get("/api/steam/owned-games", async (req, res) => {
    const bot = getBotForRequest(req);
    if (!bot.client || bot.status !== "boosting") {
      return res.status(400).json({ error: "Steam account must be logged in to fetch played games." });
    }
    try {
      const apps = await AllPlayedSteamGamesRetriever.retrieveAllPlayedGames(bot);
      return res.json({ apps });
    } catch (e) {
      return res.json({ apps: [] });
    }
  });
  app.get("/api/steam/active-devices", async (req, res) => {
    const bot = getBotForRequest(req);
    if (!bot.client || bot.status !== "boosting") {
      return res.status(400).json({ error: "Steam account must be logged in to fetch active devices." });
    }
    try {
      const currentToken = bot.currentRefreshToken || "current-session";
      const steamID64 = bot.client.steamID ? bot.client.steamID.getSteamID64() : "";
      const devices = [
        {
          tokenId: currentToken,
          description: `Steam Hour Booster (${bot.accountName || "Active Session"})`,
          timeUpdated: bot.startTime || Date.now(),
          platformType: 1,
          loggedIn: true,
          osPlatform: 1,
          isCurrentDevice: true,
          lastSeen: {
            time: bot.startTime || Date.now(),
            country: "Active Server",
            state: "",
            city: `SteamID64: ${steamID64}`
          }
        }
      ];
      return res.json({ devices });
    } catch (e) {
      return res.status(500).json({ error: e.message || "Internal server error" });
    }
  });
  app.post("/api/steam/revoke-device", async (req, res) => {
    const bot = getBotForRequest(req);
    if (!bot.client || bot.status !== "boosting") {
      return res.status(400).json({ error: "Steam account must be logged in to revoke devices." });
    }
    try {
      bot.stop();
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message || "Internal server error" });
    }
  });
  app.get("/api/steam/search", async (req, res) => {
    const term = req.query.term;
    if (!term) return res.status(400).json({ error: "Search term required" });
    try {
      const resp = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/bot/clear-logs", (req, res) => {
    const bot = getBotForRequest(req);
    bot.clearLogs();
    res.json({ success: true });
  });
}

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const server = import_http.default.createServer(app);
  app.use(import_express.default.json());
  setupRoutes(app);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: {
          server
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch(console.error);
//# sourceMappingURL=server.cjs.map
