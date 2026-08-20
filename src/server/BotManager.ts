import { SteamBot } from './SteamBot';
export class BotManager {
  private bots: Map<string, SteamBot> = new Map();
  public getBot(userId: string): SteamBot {
    const key = userId && userId.trim() ? userId.trim() : 'default';
    if (!this.bots.has(key)) {
      const newBot = new SteamBot();
      this.bots.set(key, newBot);
      newBot.log('info', `Dedicated server idler allocated for user session: ${key}`);
    }
    return this.bots.get(key)!;
  }
  public getAllActiveBots(): { userId: string; bot: SteamBot }[] {
    const list: { userId: string; bot: SteamBot }[] = [];
    for (const [userId, bot] of this.bots.entries()) {
      list.push({ userId, bot });
    }
    return list;
  }
}
export const botManager = new BotManager();
