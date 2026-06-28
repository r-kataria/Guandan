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

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build
npm run test       # run the Vitest suite
```

Then open the printed local URL. Start with **Learn** if you're new to Guandan, or jump straight
into **Play**.

## Project layout

```
src/
  engine/       pure rules engine (cards, combinations, compare, moves, state, tribute, scoring)
  ai/           heuristic bots (Easy/Medium/Hard)
  game/         React hook bridging engine↔UI, plus the coach
  components/   Table, Hand, Card, Controls, panels, overlays
  learn/        lesson content, the drill runner, progress storage
  pages/        Home, Play, Learn, Lesson, Reference
```

## Testing

43 tests cover combination parsing (including wild cards), `canBeat` across every type, full
simulated games played to completion, AI move legality, and the React UI (rendering + a drill
solved through the engine + the timer-driven play loop).

```bash
npm run test
```

## Implemented rule decisions

Where the rules have common variants, this project uses standard competitive defaults: fixed
lengths (straight = 5, tube = 3 pairs, plate = 2 triples, straight flush = 5); A-high and A-low
straights but no wrap-around; full houses ranked by the triple; tribute is the highest non-wild
card with a ≤10 return; anti-tribute when the losing side holds both Big Jokers; and winning at
level A requires taking first place.
