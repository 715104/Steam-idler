import { SteamBot } from './SteamBot';
import { POPULAR_GAMES_DATABASE } from '../data/games';
export interface PlayedGameItem {
  appid: number;
  name: string;
  playtime_forever: number; 
  playtime_2weeks: number;  
  img_icon_url?: string;
  img_logo_url?: string;
  last_played?: number;     
  source?: string;
}
export class AllPlayedSteamGamesRetriever {
  public static async retrieveAllPlayedGames(bot: SteamBot): Promise<PlayedGameItem[]> {
    if (!bot.client || bot.status !== 'boosting' || !bot.client.steamID) {
      return [];
    }
    const steamID64 = bot.client.steamID.getSteamID64();
    const gamesMap = new Map<number, PlayedGameItem>();
    try {
      const cookies = await bot.getWebCookiesAsync();
      const cookieHeader = cookies && cookies.length > 0 ? cookies.join('; ') : '';
      const fetchHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      };
      if (cookieHeader) {
        fetchHeaders['Cookie'] = cookieHeader;
      }
      const profileUrls = [
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=recent`,
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=all`,
      ];
      let webApiToken: string | null = null;
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
                    const item = typeof data[i] === 'string' ? JSON.parse(data[i]) : data[i];
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
                            const name = g.name ? String(g.name).trim() : '';
                            const foreverMins = typeof g.playtime_forever === 'number' ? g.playtime_forever : 0;
                            const weeksMins = typeof g.playtime_2weeks === 'number' ? g.playtime_2weeks : 0;
                            const existing = gamesMap.get(appid);
                            gamesMap.set(appid, {
                              appid,
                              name: name || existing?.name || '',
                              playtime_forever: Math.max(foreverMins, existing?.playtime_forever || 0),
                              playtime_2weeks: Math.max(weeksMins, existing?.playtime_2weeks || 0),
                              img_icon_url: g.img_icon_url || existing?.img_icon_url,
                              last_played: g.rtime_last_played || existing?.last_played,
                              source: 'ssr_loader_data',
                            });
                          }
                        }
                      }
                    }
                  }
                }
              } catch (parseErr) {}
            }
            const jsonMatches = [
              html.match(/var\s+rgGames\s*=\s*(\[[\s\S]*?\]);\s*(?:var|$)/i),
              html.match(/var\s+rgChangingGames\s*=\s*(\[[\s\S]*?\]);\s*(?:var|$)/i),
              html.match(/g_rgGames\s*=\s*(\[[\s\S]*?\]);\s*/i),
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
                      if (typeof g.hours_forever === 'number') {
                        foreverMins = Math.round(g.hours_forever * 60);
                      } else if (typeof g.hours_forever === 'string') {
                        const num = parseFloat(g.hours_forever.replace(/,/g, ''));
                        if (!isNaN(num)) foreverMins = Math.round(num * 60);
                      } else if (typeof g.playtime_forever === 'number') {
                        foreverMins = g.playtime_forever;
                      }
                      let weeksMins = 0;
                      if (typeof g.hours === 'number') {
                        weeksMins = Math.round(g.hours * 60);
                      } else if (typeof g.hours === 'string') {
                        const num = parseFloat(g.hours.replace(/,/g, ''));
                        if (!isNaN(num)) weeksMins = Math.round(num * 60);
                      } else if (typeof g.playtime_2weeks === 'number') {
                        weeksMins = g.playtime_2weeks;
                      }
                      const name = g.name ? String(g.name).trim() : '';
                      const existing = gamesMap.get(appid);
                      gamesMap.set(appid, {
                        appid,
                        name: name || existing?.name || '',
                        playtime_forever: Math.max(foreverMins, existing?.playtime_forever || 0),
                        playtime_2weeks: Math.max(weeksMins, existing?.playtime_2weeks || 0),
                        img_logo_url: g.logo || existing?.img_logo_url,
                        last_played: g.last_played || existing?.last_played,
                        source: 'community_html',
                      });
                    }
                  }
                } catch (e) {}
              }
            }
          }
        } catch (err) {}
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
                  name: g.name || existing?.name || '',
                  playtime_forever: Math.max(g.playtime_forever || 0, existing?.playtime_forever || 0),
                  playtime_2weeks: Math.max(g.playtime_2weeks || 0, existing?.playtime_2weeks || 0),
                  img_icon_url: g.img_icon_url || existing?.img_icon_url,
                  source: 'webapi_token',
                });
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    try {
      const cookies = bot.webCookies || [];
      const cookieHeader = cookies.length > 0 ? cookies.join('; ') : '';
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      };
      if (cookieHeader) headers['Cookie'] = cookieHeader;
      const xmlUrls = [
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=recent&xml=1`,
        `https://steamcommunity.com/profiles/${steamID64}/games/?tab=all&xml=1`,
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
              let name = '';
              const nameCdata = block.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>/i);
              const nameTag = block.match(/<name>(.*?)<\/name>/i);
              if (nameCdata) name = nameCdata[1].trim();
              else if (nameTag) name = nameTag[1].trim();
              let playtimeForever = 0;
              const foreverMatch = block.match(/<hoursOnRecord>(.*?)<\/hoursOnRecord>/i);
              if (foreverMatch) {
                const hours = parseFloat(foreverMatch[1].replace(/,/g, ''));
                if (!isNaN(hours)) playtimeForever = Math.round(hours * 60);
              }
              let playtime2Weeks = 0;
              const weeksMatch = block.match(/<hoursLast2Weeks>(.*?)<\/hoursLast2Weeks>/i);
              if (weeksMatch) {
                const hours = parseFloat(weeksMatch[1].replace(/,/g, ''));
                if (!isNaN(hours)) playtime2Weeks = Math.round(hours * 60);
              }
              const existing = gamesMap.get(appid);
              gamesMap.set(appid, {
                appid,
                name: name || existing?.name || '',
                playtime_forever: Math.max(playtimeForever, existing?.playtime_forever || 0),
                playtime_2weeks: Math.max(playtime2Weeks, existing?.playtime_2weeks || 0),
                source: 'community_xml',
              });
            }
          }
        } catch (err) {}
      }
    } catch (e) {}
    try {
      if (typeof bot.client.getUserOwnedApps === 'function') {
        const response: any = await bot.client.getUserOwnedApps(bot.client.steamID, {
          includeAppInfo: true,
          includePlayedFreeGames: true,
          includeFreeSub: true,
          skipUnvettedApps: false,
        });
        if (response?.apps && Array.isArray(response.apps)) {
          for (const g of response.apps) {
            const appid = parseInt(String(g.appid), 10);
            if (isNaN(appid) || appid <= 0) continue;
            const existing = gamesMap.get(appid);
            gamesMap.set(appid, {
              appid,
              name: g.name || existing?.name || '',
              playtime_forever: Math.max(g.playtime_forever || 0, existing?.playtime_forever || 0),
              playtime_2weeks: Math.max(g.playtime_2weeks || 0, existing?.playtime_2weeks || 0),
              img_icon_url: g.img_icon_url || existing?.img_icon_url,
              img_logo_url: g.img_logo_url || existing?.img_logo_url,
              source: 'steam_rpc',
            });
          }
        }
      }
    } catch (err) {}
    if (bot.ownedGamesStats && bot.ownedGamesStats.size > 0) {
      bot.ownedGamesStats.forEach((val, appid) => {
        const existing = gamesMap.get(appid);
        gamesMap.set(appid, {
          appid,
          name: val.name || existing?.name || '',
          playtime_forever: Math.max(Math.round(val.playtimeForeverMinutes || 0), existing?.playtime_forever || 0),
          playtime_2weeks: Math.max(Math.round(val.playtime2WeeksMinutes || 0), existing?.playtime_2weeks || 0),
          source: existing?.source || 'bot_cache',
        });
      });
    }
    for (const item of gamesMap.values()) {
      if (!item.name || item.name.trim() === '' || item.name.startsWith('AppID ')) {
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
}
