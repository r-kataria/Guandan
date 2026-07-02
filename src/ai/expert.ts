// ai/expert.ts — the "Expert" bot. Unlike the heuristic tiers, it reasons about the actual
// consequence of each move: it does 1-ply lookahead on its own hand (scored with card-counting
// awareness of what's still unseen), keeps tempo/control, cooperates with its partner, and
// suppresses opponents who are about to go out.

import {
  GameState,
  Seat,
  teamOf,
  Card,
  Combination,
  removeCards,
  generateLeadMoves,
  generateResponses,
  isBomb,
} from '../engine'
import {
  CardCounts,
  computeUnseen,
  shapeFromUnseen,
  scoreHand,
} from './eval'
import type { AiAction } from './index'

const partnerOf = (s: Seat): Seat => ((s + 2) % 4) as Seat

function minOpponentCards(state: GameState, seat: Seat): number {
  let min = Infinity
  for (const s of [0, 1, 2, 3] as Seat[]) {
    if (teamOf(s) !== teamOf(seat) && !state.finished.includes(s)) {
      min = Math.min(min, state.hands[s].length)
    }
  }
  return min
}

function partnerActiveCards(state: GameState, seat: Seat): number | null {
  const p = partnerOf(seat)
  if (state.finished.includes(p)) return null
  return state.hands[p].length
}

/** Score of the hand that remains after playing `move` (lower is better; win = -1000). */
function evalAfter(
  hand: Card[],
  move: Combination,
  unseen: CardCounts,
  level: GameState['level'],
): number {
  const remaining = removeCards(hand, move.cards)
  if (remaining.length === 0) return -1000
  return scoreHand(shapeFromUnseen(remaining, unseen, level))
}

function chooseLead(state: GameState, seat: Seat, unseen: CardCounts): AiAction {
  const hand = state.hands[seat]
  const level = state.level
  const moves = generateLeadMoves(hand, level)
  if (moves.length === 0) return { type: 'pass' }

  // Win immediately if a single play empties the hand.
  const finisher = moves.find((m) => m.count === hand.length)
  if (finisher) return { type: 'play', combo: finisher }

  // Cost of leading each move: the resulting hand, plus penalties for wasting bombs/wilds and a
  // mild preference for leading low. (Leading away a control card hurts the resulting-hand score,
  // so that's already discouraged.)
  let best = moves[0]
  let bestCost = Infinity
  for (const m of moves) {
    let cost = evalAfter(hand, m, unseen, level)
    if (isBomb(m)) cost += 3
    cost += m.wildCount * 0.6
    cost += m.rank * 0.003 // tie-break: prefer leading lower
    if (cost < bestCost) {
      bestCost = cost
      best = m
    }
  }
  return { type: 'play', combo: best }
}

function chooseFollow(state: GameState, seat: Seat, unseen: CardCounts): AiAction {
  const hand = state.hands[seat]
  const level = state.level
  const current = state.trick.current!
  const responses = generateResponses(hand, current, level)
  if (responses.length === 0) return { type: 'pass' }

  // Going out trumps everything else.
  const finisher = responses.find((m) => m.count === hand.length)
  if (finisher) return { type: 'play', combo: finisher }

  // Cooperate: if our partner currently holds the trick, let them keep it.
  const lastPlayer = state.trick.lastPlayer
  if (lastPlayer !== null && lastPlayer === partnerOf(seat)) {
    // Exception: if the partner played something weak and an opponent is about to finish, we may
    // still want to take over — but normally, pass.
    return { type: 'pass' }
  }

  const baseScore = scoreHand(shapeFromUnseen(hand, unseen, level))
  const oppMin = minOpponentCards(state, seat)
  const partnerCards = partnerActiveCards(state, seat)
  const myCount = hand.length

  // Best non-bomb beater by resulting-hand quality.
  const nonBombs = responses.filter((m) => !isBomb(m))
  let bestNB: Combination | null = null
  let bestNBScore = Infinity
  for (const m of nonBombs) {
    const s = evalAfter(hand, m, unseen, level)
    if (s < bestNBScore) {
      bestNBScore = s
      bestNB = m
    }
  }

  const pressure = oppMin <= 6 // an opponent is getting close to out
  const short = myCount <= 8
  const partnerSafe = partnerCards !== null && partnerCards <= 5 // partner nearly done — keep lead off opponents

  if (bestNB) {
    // Beating costs us if the resulting hand is meaningfully worse than holding (we spent a control
    // card for little). Otherwise, take the cheap trick to keep tempo.
    const wasteful = bestNBScore > baseScore + 0.5
    if (!wasteful || pressure || short || partnerSafe) {
      return { type: 'play', combo: bestNB }
    }
    return { type: 'pass' }
  }

  // Only bombs can beat. Spend one to deny an opponent who's about to finish, to grab tempo when
  // short, or when doing so leaves us dominant; otherwise hold the bomb.
  let bestBomb: Combination | null = null
  let bestBombScore = Infinity
  for (const m of responses) {
    const s = evalAfter(hand, m, unseen, level)
    if (s < bestBombScore) {
      bestBombScore = s
      bestBomb = m
    }
  }
  if (bestBomb) {
    const dominantAfter = bestBombScore <= baseScore - 1 // bombing materially improves our position
    if (oppMin <= 6 || myCount <= 6 || partnerSafe || dominantAfter) {
      return { type: 'play', combo: bestBomb }
    }
  }
  return { type: 'pass' }
}

export function chooseExpertMove(state: GameState, seat: Seat): AiAction {
  const unseen = computeUnseen(state.hands[seat], state.played, state.level)
  if (state.trick.current === null) return chooseLead(state, seat, unseen)
  return chooseFollow(state, seat, unseen)
}
