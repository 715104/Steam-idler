import { Express, Request } from 'express';
import { botManager } from './BotManager';
import SteamTotp from 'steam-totp';
import { AllPlayedSteamGamesRetriever } from './AllPlayedSteamGamesRetriever';
function getBotForRequest(req: Request) {
  const headerUser = req.headers['x-user-id'];
  const userId =
    (typeof headerUser === 'string' && headerUser.trim()) ||
    (typeof req.query.userId === 'string' && req.query.userId.trim()) ||
    (req.body && typeof req.body.userId === 'string' && req.body.userId.trim()) ||
    'default';
  return botManager.getBot(userId);
}
export function setupRoutes(app: Express) {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });
  app.get('/api/auth/config', (req, res) => {
    const requiredPin = process.env.APP_PIN || process.env.AUTH_PASSWORD || '231530';
    res.json({ requiresAuth: Boolean(requiredPin) });
  });
  app.post('/api/auth/verify', (req, res) => {
    const requiredPin = process.env.APP_PIN || process.env.AUTH_PASSWORD || '231530';
    if (!requiredPin) {
      return res.json({ success: true });
    }
    const { pin } = req.body;
    if (pin && String(pin).trim() === String(requiredPin).trim()) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid security PIN' });
  });
  app.use((req, res, next) => {
    const requiredPin = process.env.APP_PIN || process.env.AUTH_PASSWORD || '231530';
    if (!requiredPin) {
      return next();
    }
    if (req.path === '/api/health' || req.path.startsWith('/api/auth/')) {
      return next();
    }
    const clientPin = req.headers['x-app-pin'] || req.query.pin;
    if (clientPin && String(clientPin).trim() === String(requiredPin).trim()) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Security PIN required' });
  });
  app.get('/api/status', (req, res) => {
    const bot = getBotForRequest(req);
    res.json(bot.getState);
  });
  app.post('/api/bot/start', (req, res) => {
    const bot = getBotForRequest(req);
    let { accountName, password, sharedSecret, personaState = 1, gameIds = [], customGameName = '' } = req.body;
    if (accountName) {
      accountName = accountName.trim();
    }
    if (!accountName || !password) {
      return res.status(400).json({ error: 'Account name and password are required' });
    }
    const stateNum = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    bot.startCredentialsLogin(accountName, password, sharedSecret, gameIds, customGameName, stateNum);
    res.json({ success: true, message: 'Login process started' });
  });
  app.post('/api/bot/start-token', (req, res) => {
    const bot = getBotForRequest(req);
    const { refreshToken, accountName = '', personaState = 1, gameIds = [], customGameName = '' } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Login token is required' });
    }
    const stateNum = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    bot.startTokenLogin(refreshToken, accountName, gameIds, customGameName, stateNum);
    res.json({ success: true, message: 'Login with token started' });
  });
  app.post('/api/bot/start-saved', (req, res) => {
    const bot = getBotForRequest(req);
    const { personaState = 1, gameIds = [], customGameName = '' } = req.body;
    const stateNum = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    const started = bot.startSavedSession(gameIds, customGameName, stateNum);
    if (!started) {
      return res.status(400).json({ error: 'No saved session token found' });
    }
    res.json({ success: true, message: 'Reconnecting with saved session token...' });
  });
  app.post('/api/bot/forget-session', (req, res) => {
    const bot = getBotForRequest(req);
    bot.forgetSession();
    res.json({ success: true, message: 'Saved session token removed' });
  });
  app.post('/api/bot/start-qr', async (req, res) => {
    const bot = getBotForRequest(req);
    const { personaState = 1, gameIds = [], customGameName = '' } = req.body;
    const stateNum = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    await bot.startQRLogin(gameIds, customGameName, stateNum);
    res.json({ success: true, message: 'QR session initiated' });
  });
  app.post('/api/bot/stop', (req, res) => {
    const bot = getBotForRequest(req);
    bot.stop();
    res.json({ success: true, status: 'offline' });
  });
  app.post('/api/bot/update-persona', (req, res) => {
    const bot = getBotForRequest(req);
    const { personaState = 1, customGameName } = req.body;
    const stateNum = typeof personaState === 'number' ? personaState : (parseInt(String(personaState), 10) || 1);
    bot.updatePersona(stateNum, customGameName);
    res.json({ success: true, personaState: stateNum, customGameName });
  });
  app.post('/api/bot/update-games', (req, res) => {
    const bot = getBotForRequest(req);
    const { gameIds = [], customGameName } = req.body;
    bot.updateGames(gameIds, customGameName);
    res.json({ success: true, message: `Updated active games to ${gameIds.length} titles` });
  });
  app.post('/api/bot/refresh-status', async (req, res) => {
    const bot = getBotForRequest(req);
    if (bot.status === 'boosting') {
      await bot.forceRefresh();
    }
    res.json({ success: true });
  });
  app.post('/api/bot/submit-code', (req, res) => {
    const bot = getBotForRequest(req);
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const submitted = bot.submitGuardCode(code);
    res.json({ success: submitted, message: submitted ? 'Code submitted' : 'No code pending' });
  });
  app.post('/api/totp/generate', (req, res) => {
    const { sharedSecret } = req.body;
    if (!sharedSecret) return res.status(400).json({ error: 'Shared secret required' });
    try {
      const code = SteamTotp.generateAuthCode(sharedSecret);
      const timeOffset = SteamTotp.time();
      const secondsRemaining = 30 - (timeOffset % 30);
      res.json({ code, secondsRemaining, timeOffset });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Invalid secret format' });
    }
  });
  app.get('/api/steam/owned-games', async (req, res) => {
    const bot = getBotForRequest(req);
    if (!bot.client || bot.status !== 'boosting') {
      return res.status(400).json({ error: 'Steam account must be logged in to fetch played games.' });
    }
    try {
      const apps = await AllPlayedSteamGamesRetriever.retrieveAllPlayedGames(bot);
      return res.json({ apps });
    } catch (e: any) {
      return res.json({ apps: [] });
    }
  });
  app.get('/api/steam/active-devices', async (req, res) => {
    const bot = getBotForRequest(req);
    if (!bot.client || bot.status !== 'boosting') {
      return res.status(400).json({ error: 'Steam account must be logged in to fetch active devices.' });
    }
    try {
      const currentToken = bot.currentRefreshToken || 'current-session';
      const steamID64 = bot.client.steamID ? bot.client.steamID.getSteamID64() : '';
      const devices = [
        {
          tokenId: currentToken,
          description: `Steam Hour Booster (${bot.accountName || 'Active Session'})`,
          timeUpdated: bot.startTime || Date.now(),
          platformType: 1, 
          loggedIn: true,
          osPlatform: 1, 
          isCurrentDevice: true,
          lastSeen: {
            time: bot.startTime || Date.now(),
            country: 'Active Server',
            state: '',
            city: `SteamID64: ${steamID64}`,
          },
        },
      ];
      return res.json({ devices });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });
  app.post('/api/steam/revoke-device', async (req, res) => {
    const bot = getBotForRequest(req);
    if (!bot.client || bot.status !== 'boosting') {
      return res.status(400).json({ error: 'Steam account must be logged in to revoke devices.' });
    }
    try {
      bot.stop();
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Internal server error' });
    }
  });
  app.get('/api/steam/search', async (req, res) => {
    const term = req.query.term as string;
    if (!term) return res.status(400).json({ error: 'Search term required' });
    try {
      const resp = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post('/api/bot/clear-logs', (req, res) => {
    const bot = getBotForRequest(req);
    bot.clearLogs();
    res.json({ success: true });
  });
}
