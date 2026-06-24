// ai/index.ts — heuristic Guandan bots (Easy / Medium / Hard). Pure: depends only on the
// engine. Each bot returns the action to take for the seat whose turn it is.
//
// Design: all difficulties share one decision skeleton (go out if you can, don't overtake your
// partner, lead low & keep bombs, bomb to stop an opponent who's about to finish). Difficulty
// is a small set of knobs controlling how greedily control cards are spent and how eagerly bombs
// are used.

import {
  Card,
  NaturalRank,
  GameState,
  Seat,
  teamOf,
  Combination,
  generateLeadMoves,
  generateResponses,
  isBomb,
  isJoker,
  isWild,
  singleOrderValue,
} from '../engine'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type AiAction =
  | { type: 'play'; combo: Combination }
  | { type: 'pass' }

interface Knobs {
  /** Conserve high "control" cards instead of always playing the cheapest beater. */
  conserve: boolean
  /** Bomb to stop an opponent when their hand size is at or below this (0 = never). */
  bombStop: number
  /** Cooperate: don't overtake a partner who is currently winning the trick. */
  cooperate: boolean
  /** Avoid breaking pairs/triples to lead a lone-ish single. */
  keepShape: boolean
}

const KNOBS: Record<Difficulty, Knobs> = {
  easy: { conserve: false, bombStop: 0, cooperate: true, keepShape: false },
  medium: { conserve: true, bombStop: 4, cooperate: true, keepShape: true },
  hard: { conserve: true, bombStop: 7, cooperate: true, keepShape: true },
}

const CONTROL_VALUE = 13 // King and above are "control" cards worth conserving

function rankCountInHand(hand: Card[], card: Card): number {
  if (isJoker(card)) return hand.filter((c) => isJoker(c) && c.kind === 'joker' && card.kind === 'joker' && c.joker === card.joker).length
  return hand.filter((c) => c.kind === 'number' && card.kind === 'number' && c.rank === card.rank).length
}

function minOpponentCards(state: GameState, seat: Seat): number {
  let min = Infinity
  for (const s of [0, 1, 2, 3] as Seat[]) {
    if (teamOf(s) !== teamOf(seat) && !state.finished.includes(s)) {
      min = Math.min(min, state.hands[s].length)
    }
  }
  return min
}

function partnerOf(seat: Seat): Seat {
  return ((seat + 2) % 4) as Seat
}

function emptiesHand(combo: Combination, handSize: number): boolean {
  return combo.count === handSize
}

function cheapest(a: Combination, b: Combination): number {
  if (isBomb(a) !== isBomb(b)) return isBomb(a) ? 1 : -1
  if (a.wildCount !== b.wildCount) return a.wildCount - b.wildCount
  if (a.count !== b.count) return a.count - b.count
  return a.rank - b.rank
}

/** Choose a lead (trick is open). */
function chooseLead(state: GameState, seat: Seat, k: Knobs): AiAction {
  const hand = state.hands[seat]
  const level = state.level
  const moves = generateLeadMoves(hand, level)
  if (moves.length === 0) return { type: 'pass' } // shouldn't happen while holding cards

  // If we can dump the whole hand at once, do it.
  const finisher = moves.filter((m) => emptiesHand(m, hand.length)).sort(cheapest)[0]
  if (finisher) return { type: 'play', combo: finisher }

  const nonBombs = moves.filter((m) => !isBomb(m))
  if (nonBombs.length === 0) {
    // Only bombs available — lead the smallest one.
    return { type: 'play', combo: [...moves].sort(cheapest)[0] }
  }

  let candidates = nonBombs
  if (k.keepShape) {
    // Don't lead a single that breaks a pair/triple, and don't fritter away control singles.
    candidates = nonBombs.filter((m) => {
      if (m.kind !== 'single') return true
      const c = m.cards[0]
      if (isJoker(c) || isWild(c, level)) return false // keep jokers & wilds
      if (singleOrderValue(c, level) >= CONTROL_VALUE) return false // keep big singles
      return rankCountInHand(hand, c) === 1 // only lead genuinely lone singles
    })
    if (candidates.length === 0) candidates = nonBombs
  }

  // Prefer to lead low; for shape-keepers, prefer multi-card structures of low rank to thin the hand.
  const sorted = [...candidates].sort((a, b) => {
    if (k.conserve && a.rank !== b.rank) return a.rank - b.rank
    if (a.wildCount !== b.wildCount) return a.wildCount - b.wildCount
    if (a.rank !== b.rank) return a.rank - b.rank
    return b.count - a.count
  })
  return { type: 'play', combo: sorted[0] }
}

/** Choose a response (there is a combo to beat). */
function chooseFollow(state: GameState, seat: Seat, k: Knobs): AiAction {
  const hand = state.hands[seat]
  const level = state.level
  const current = state.trick.current!
  const responses = generateResponses(hand, current, level)
  if (responses.length === 0) return { type: 'pass' }

  // Going out beats every other consideration.
  const finisher = responses.filter((m) => emptiesHand(m, hand.length)).sort(cheapest)[0]
  if (finisher) return { type: 'play', combo: finisher }

  // Don't overtake a partner who is winning (unless we could go out, handled above).
  const lastPlayer = state.trick.lastPlayer
  const partnerWinning =
    k.cooperate && lastPlayer !== null && lastPlayer === partnerOf(seat)
  if (partnerWinning) return { type: 'pass' }

  const nonBombs = responses.filter((m) => !isBomb(m)).sort(cheapest)
  const oppMin = minOpponentCards(state, seat)
  const myCount = hand.length

  if (nonBombs.length > 0) {
    const best = nonBombs[0]
    // Conserve control cards: if the cheapest beater spends a big card on a small trick and
    // nothing urgent is happening, hold back.
    if (
      k.conserve &&
      best.rank >= CONTROL_VALUE &&
      current.rank < CONTROL_VALUE &&
      oppMin > 5 &&
      myCount > 6
    ) {
      return { type: 'pass' }
    }
    return { type: 'play', combo: best }
  }

  // Only bombs can beat. Bomb to stop an opponent who is about to finish, or when we are short
  // and want to seize the lead; otherwise conserve the bomb.
  if (k.bombStop > 0 && (oppMin <= k.bombStop || myCount <= 6)) {
    const smallestBomb = [...responses].sort(cheapest)[0]
    return { type: 'play', combo: smallestBomb }
  }
  return { type: 'pass' }
}

/** Decide the action for whichever seat must act now. */
export function chooseMove(
  state: GameState,
  seat: Seat,
  difficulty: Difficulty,
): AiAction {
  const k = KNOBS[difficulty]
  if (state.trick.current === null) return chooseLead(state, seat, k)
  return chooseFollow(state, seat, k)
}

export type { NaturalRank }
