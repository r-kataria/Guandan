# Guandan 掼蛋 — Learn & Play

A browser-based [Guandan](https://en.wikipedia.org/wiki/Guandan) card game built with **Vite +
React + TypeScript**. Play full games against AI opponents, and learn the game from zero to
confident play through a structured set of interactive lessons.

Guandan is a four-player partnership "climbing" card game from Jiangsu, China, played with two
decks (108 cards). It features team levels, hearts wild cards, a tribute system, and nine kinds of
bomb — all of which this project implements in full.

## Features

- **Complete rules engine** (`src/engine/`) — pure TypeScript, no UI dependencies:
  - 108-card deck, team levels 2→A with the elevated level rank, hearts wild cards.
  - Every combination: singles, pairs, triples, full houses, straights, tubes, plates.
  - The full bomb hierarchy: 4–10 of a kind, straight flush, and the four-joker bomb.
  - Tribute / return / anti-tribute between hands, and level-advancement scoring.
  - Legal-move generation (used by both the AI and the in-game Hint).
- **AI opponents** (`src/ai/`):
  - **Easy / Medium / Hard** — heuristic bots that conserve control cards, manage bombs, cooperate
    with their partner, and bomb opponents who are about to finish.
  - **Master** — a much stronger policy that **counts every played card** (so it knows which of its
    own cards are guaranteed winners), **decomposes its hand** to plan the fewest plays to empty it,
    does **1-ply lookahead** scoring the hand it would be left with, hoards control/bombs for tempo,
    and bombs to deny your run. In self-play it beats Hard ~20/20. Expect a real fight.
- **Learn track** (`src/learn/`) — 15 lessons grouped Basics → Combinations → Bombs → Levels &
  Wilds → Strategy. Each lesson ends with an **interactive drill validated by the real engine**, or
  a quiz. Progress is saved in `localStorage`.
- **Live coach** — a panel during play that explains what to think about each turn, plus legal-move
  hints.
- **Rules reference** — every combination, the bomb order, and the tribute/scoring rules in one
  page.
- **Themes** — switch between **Classic** (emerald felt & gold), **Elegant** (clean light), and
  **Futuristic** (neon glass) from the nav; the choice is saved locally. Driven entirely by CSS
  variables (`src/theme.ts` + `[data-theme]` blocks in `src/index.css`).
- **Online multiplayer** (`server/` + `src/net/`) — create or join a room by code and play with
  1–4 real people; empty seats are filled by bots. With two players they're placed on opposite
  teams. A small Node + WebSocket server runs the authoritative game (reusing the same engine and
  bots) and sends each player a redacted view, so no one can ever see another player's hand.

## Getting started

```bash
npm install
npm run dev        # single-player only: Vite dev server (Home/Learn/Play/Reference)
npm run dev:all    # multiplayer too: Vite + the WebSocket game server together
npm run build      # type-check + production build
npm run test       # run the Vitest suite
```

Then open the printed local URL. Start with **Learn** if you're new to Guandan, jump straight into
**Play** vs bots, or open **Online** to play with friends.

### Online multiplayer

For the **Online** tab to work you need the game server running too:

- **Dev:** `npm run dev:all` runs Vite (port 5173) and the server (port 8787) together; Vite
  proxies the WebSocket to the server. Test it with two browser tabs.
- **Production / sharing:** `npm run build:all` then `npm run start:prod` — one Node process
  serves the built client *and* the WebSocket on a single port (`PORT`, default 8787).

## Deploy with Docker / Coolify

The repo ships a multi-stage `Dockerfile` and a `docker-compose.yml`. The image builds the client
and bundles the server into one self-contained Node process (no dev toolchain or `node_modules` in
the runtime image) that serves the static client and the WebSocket on the **same port** — so
WebSocket upgrades work through a reverse proxy with no extra config.

```bash
docker build -t guandan .
docker run -p 8787:8787 guandan          # open http://localhost:8787
# or:
docker compose up --build
```

**Coolify:** create a new resource from this Git repo and choose either build pack:

- **Dockerfile** — Coolify builds the `Dockerfile` as-is. Set the app's port to **8787** (it's the
  `EXPOSE`d port); Coolify's proxy routes HTTP and the WebSocket to it on the same port.
- **Docker Compose** — point Coolify at `docker-compose.yml`.

Optional env vars: `PORT` (listen port), `GD_BOT_DELAY` / `GD_HAND_DELAY` (bot pacing in ms),
`CLIENT_DIR` (override the static-client directory). A `/healthz` endpoint is provided for health
checks. No database or external services are required — rooms are in-memory.

## Project layout

```
server/         Node + WebSocket multiplayer server (thin transport over src/net/room)
src/
  engine/       pure rules engine (cards, combinations, compare, moves, state, tribute, scoring)
  ai/           bots: Easy/Medium/Hard heuristics + the Master tier (eval + master)
  net/          multiplayer: protocol, seating, redaction (view), GameRoom core, useRoom hook
  game/         React hook bridging engine↔UI, plus the coach
  components/   Table, Hand, Card, Controls, panels, overlays, online/ (rooms, lobby, board)
  learn/        lesson content, the drill runner, progress storage
  pages/        Home, Play, Online, Learn, Lesson, Reference
```

## Testing

57 tests cover combination parsing (including wild cards), `canBeat` across every type, full
simulated games played to completion, AI move legality, a head-to-head harness asserting Master
beats Hard, the multiplayer room core (a full 2-human + 2-bot game in-process, seat assignment,
disconnect→bot takeover, and that a player view never leaks another seat's cards), and the React
UI (rendering + a drill solved through the engine + the timer-driven play loop).

```bash
npm run test
```

## Implemented rule decisions

Where the rules have common variants, this project uses standard competitive defaults: fixed
lengths (straight = 5, tube = 3 pairs, plate = 2 triples, straight flush = 5); A-high and A-low
straights but no wrap-around; full houses ranked by the triple; tribute is the highest non-wild
card with a ≤10 return; anti-tribute when the losing side holds both Big Jokers; and winning at
level A requires taking first place.
