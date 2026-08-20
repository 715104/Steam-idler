export interface PresetGame {
  appId: number;
  name: string;
  category: string;
  headerImage?: string;
}
export function getGameHeaderUrl(appId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
}
export function getGameCapsuleUrl(appId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`;
}
export function getGameName(appId: number): string {
  const game = POPULAR_GAMES_DATABASE.find((g) => g.appId === appId);
  return game ? game.name : `Steam App #${appId}`;
}
export const POPULAR_GAMES_DATABASE: PresetGame[] = [
  { appId: 730, name: 'Counter-Strike 2', category: 'Competitive FPS' },
  { appId: 440, name: 'Team Fortress 2', category: 'Hero Shooter' },
  { appId: 570, name: 'Dota 2', category: 'MOBA' },
  { appId: 252490, name: 'Rust', category: 'Survival' },
  { appId: 271590, name: 'Grand Theft Auto V', category: 'Open World' },
  { appId: 105600, name: 'Terraria', category: 'Sandbox' },
  { appId: 431960, name: 'Wallpaper Engine', category: 'Utility' },
  { appId: 1172470, name: 'Apex Legends', category: 'Battle Royale' },
  { appId: 578080, name: 'PUBG: BATTLEGROUNDS', category: 'Battle Royale' },
  { appId: 230410, name: 'Warframe', category: 'Action RPG' },
  { appId: 108600, name: 'Project Zomboid', category: 'Survival' },
  { appId: 359550, name: "Tom Clancy's Rainbow Six Siege", category: 'Tactical FPS' },
  { appId: 1091500, name: 'Cyberpunk 2077', category: 'RPG' },
  { appId: 292030, name: 'The Witcher 3: Wild Hunt', category: 'RPG' },
  { appId: 289070, name: "Sid Meier's Civilization VI", category: 'Strategy' },
  { appId: 346110, name: 'ARK: Survival Evolved', category: 'Survival' },
  { appId: 1172620, name: 'Sea of Thieves', category: 'Adventure' },
  { appId: 892970, name: 'Valheim', category: 'Survival' },
  { appId: 242760, name: 'The Forest', category: 'Survival Horror' },
  { appId: 4000, name: "Garry's Mod", category: 'Sandbox' },
  { appId: 550, name: 'Left 4 Dead 2', category: 'Co-op FPS' },
  { appId: 218620, name: 'PAYDAY 2', category: 'Co-op Action' },
  { appId: 394360, name: 'Hearts of Iron IV', category: 'Grand Strategy' },
  { appId: 281990, name: 'Stellaris', category: 'Grand Strategy' },
];
