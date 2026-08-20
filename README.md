# Steam Hour Booster

A high-performance, web-based Steam playtime booster and idle management dashboard. Boost multiple Steam games simultaneously (up to 32 games), manage custom status presences, handle Steam Guard authentication (QR code, 2FA TOTP, email codes), and monitor real-time session statistics.

---

## Architecture Overview

```
+-----------------------------------------------------------------------+
|                             WEB INTERFACE                             |
|    [Dashboard View]     [Games Selection]     [Steam Status & Title]  |
|    - 6-Game Pagination  - SSR Play History    - Live Persona Control  |
|    - Session Rate/Hour  - 32-Game Selector    - Dual-Protocol Sync    |
+-----------------------------------+-----------------------------------+
                                    | REST API & Real-time State
+-----------------------------------v-----------------------------------+
|                         EXPRESS BACKEND SERVER                        |
|                                                                       |
|   +--------------------------+    +-------------------------------+   |
|   |   SteamBot Controller    |    |  AllPlayedGames Retriever     |   |
|   |  - CM Connection Manager |    |  - SSR loaderData Parser      |   |
|   |  - Session Persistence   |    |  - WebAPI Token Extraction    |   |
|   |  - Free-License Binding  |    |  - Multi-source Aggregator    |   |
|   +------------+-------------+    +---------------+---------------+   |
+----------------|----------------------------------|-------------------+
                 | Encrypted Steam Protocol         | HTTPS Web Session
+----------------v----------------------------------v-------------------+
|                            VALVE STEAM NETWORK                        |
|   - Coordinator (CM)   - Community Profile SSR   - WebAPI Services    |
+-----------------------------------------------------------------------+
```

---

## Features

- **Simultaneous Multi-Game Idling**: Boost up to 32 Steam games in parallel. Accumulate hours across all titles at `+N.0 hrs/hr` combined rate.
- **SSR Profile Play History Retriever**: Scrapes and parses modern Steam Community React SSR `window.SSR.loaderData` to retrieve all games ever played (including Free-to-Play titles like CS2, Apex Legends, Team Fortress 2, and Dota 2).
- **Free License Auto-Acquisition**: Automatically acquires licenses for free-to-play games (`requestFreeLicense`) so Steam reliably records playtime without manual store activation.
- **Dual-Protocol Online Persona Control**:
  - Direct Steam CM Coordinator packet dispatch (`EMsg.ClientChangeStatus`) with explicit `persona_set_by_user` flags.
  - Authenticated Steam Community Chat (`SetPersonaState`) sync.
  - Real-time status switching: **Online**, **Invisible**, **Away**, **Busy**, and **Snooze**.
- **Flexible Authentication**:
  - **Instant QR Code Scan**: Login using the Steam Mobile app without typing passwords.
  - **Account Credentials + Auto-2FA**: Username, password, and Steam Guard Shared Secret TOTP support.
  - **Persistent Session Token**: Reconnect effortlessly without re-entering credentials.
- **Dashboard & Real-Time Metrics**:
  - Live session duration counter with zero jitter.
  - Active games display with **6-game pagination**.
  - Total combined playtime gained and session rate indicators.
  - Live terminal activity log stream with severity filtering (All, Info, Success, Warn, Error).
- **Zero Simulation / Pure Steam Authenticity**:
  - All playtime, baseline hours, and game metadata are retrieved directly from live Steam RPCs and official endpoints.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Reactive component architecture |
| **Styling & Design** | Vanilla CSS + Tailwind CSS v4 | Dark-mode interface with glassmorphism |
| **Animations** | Motion (Framer Motion) | Smooth UI transitions and pagination |
| **Icons** | Lucide React | Clean interface iconography |
| **Backend Server** | Node.js + Express + TypeScript (`tsx`) | REST API and Steam bot controller |
| **Steam Protocol** | `steam-user` + `steam-totp` + `steam-session` | Encrypted CM socket connection & 2FA |
| **Bundler & Tooling** | Vite 6 + ESBuild | Ultra-fast HMR and production bundling |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### Installation

1. **Clone or extract the repository:**
   ```bash
   git clone <repo-url>
   cd steam-hour-boosting
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Configure environment:**
   ```bash
   cp .env.example .env
   ```

---

## Running the Application

### Development Mode
Starts both the Express API backend and Vite frontend with Hot Module Replacement (HMR) on port `3000`:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### Production Build
Builds the static client assets and bundles the backend server:
```bash
npm run build
npm start
```

### Type Checking
Verify TypeScript types across the entire codebase:
```bash
npm run lint
```

---

## Directory Structure

```
steam-hour-boosting/
├── dist/                          # Compiled production bundles
├── src/
│   ├── components/                # React UI components
│   │   ├── AccountView.tsx        # Authentication & Steam Status controls
│   │   ├── ConfirmModal.tsx       # Disconnect & action confirmations
│   │   ├── DashboardView.tsx      # Metrics, session timer & active games grid
│   │   ├── DevicesView.tsx        # Session & device management
│   │   ├── GamesView.tsx          # 32-game selector, search & play history
│   │   ├── Header.tsx             # Navigation bar & live bot badge
│   │   └── SteamGuardModal.tsx    # 2FA code input dialog
│   ├── data/                      # Popular games database & fallbacks
│   ├── lib/                       # API utilities & HTTP helpers
│   ├── server/                    # Backend server & Steam bot logic
│   │   ├── AllPlayedSteamGamesRetriever.ts  # Multi-tier SSR game retriever
│   │   ├── BotManager.ts          # Multi-user bot instance manager
│   │   ├── routes.ts              # Express API endpoints
│   │   └── SteamBot.ts            # Core Steam client lifecycle & idling
│   ├── App.tsx                    # Root application component & state router
│   ├── main.tsx                   # Frontend entry point
│   ├── index.css                  # Core design tokens & styles
│   └── types.ts                   # Shared TypeScript interfaces
├── index.html                     # HTML shell
├── package.json                   # Project dependencies & scripts
├── server.ts                      # Express + Vite development server entry
├── tsconfig.json                  # TypeScript compiler configuration
└── vite.config.ts                 # Vite bundler & watch settings
```

---

## API Reference

### Bot & Session Management
- `GET /api/status` — Retrieves live connection state, elapsed time, persona, and active games.
- `POST /api/bot/start` — Initiates login via username, password, and optional 2FA secret.
- `POST /api/bot/start-qr` — Starts a passwordless QR login challenge for Steam Mobile.
- `POST /api/bot/start-saved` — Reconnects using the persisted refresh token.
- `POST /api/bot/stop` — Gracefully disconnects and logs off from the Steam network.
- `POST /api/bot/forget-session` — Purges stored login tokens from disk.

### Playtime Idling & Persona
- `POST /api/bot/update-games` — Updates active idling game list (up to 32 titles) or stops idling if empty (`[]`).
- `POST /api/bot/update-persona` — Updates persona online state and custom non-Steam title live without session resets.
- `POST /api/bot/refresh-status` — Synchronizes live account stats and ownership cache.
- `GET /api/steam/owned-games` — Retrieves play history using the multi-tier SSR extractor.
- `GET /api/steam/search?term=<name>` — Searches the Steam Store for titles and AppIDs.

---

## Security & Privacy

- **No Plaintext Password Storage**: Passwords and 2FA shared secrets exist solely in volatile memory during the login handshake and are never saved to disk.
- **Tokenized Sessions**: Session persistence utilizes Steam's official OAuth refresh token architecture stored locally in `.session.json`.
- **Direct Valve Connections**: All Steam network communications connect directly to Valve's official Connection Manager (CM) servers over encrypted TLS sockets.
