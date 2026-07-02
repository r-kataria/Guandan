// ai/master.ts — the strongest bot. It keeps the Expert's disciplined core (cheap tricks stay
// cheap; control cards are hoarded) and adds surgical upgrades where they win games:
//   - guaranteed run-out detection: when every remaining group is unbeatable, cash out immediately
//   - the safe-finisher technique: shed the vulnerable group first, keep an unbeatable closer
//   - endgame tempo grabs: take a trick with a safe play when it locks a finish path
//   - hard denial: refuses to feed an opponent who is nearly out, on leads and follows
//   - purposeful cooperation: overtakes the partner only to convert a guaranteed win

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
  unseenCanBeatCombo,
  unseenBombPossible,
} from './eval'
import type { AiAction } from './index'

/** Tuning knobs (exported for head-to-head experiments). */
export const MASTER_TUNING = {
  uncW: 0, // extra weight on uncontrolled groups when ranking moves (0 measured best)
  closers: true, // safe-finisher lead planning at <=10 cards
  tempoGrab: true, // take a trick when it locks a run-out
  convert: true, // overtake partner to convert a locked run-out
  denial: true, // starve near-out opponents (lead penalty + forced beats)
}

const partnerOf = (s: Seat): Seat => ((s + 2) % 4) as Seat

interface Ctx {
  state: GameState
  seat: Seat
  hand: Card[]
  level: GameState['level']
  unseen: CardCounts
  oppMin: number
  partnerCards: number | null
  bombRisk: boolean
}

function makeCtx(state: GameState, seat: Seat): Ctx {
  const unseen = computeUnseen(state.hands[seat], state.played, state.level)
  let oppMin = Infinity
  for (const s of [0, 1, 2, 3] as Seat[]) {
    if (teamOf(s) !== teamOf(seat) && !state.finished.includes(s)) {
      oppMin = Math.min(oppMin, state.hands[s].length)
    }
  }
  const p = partnerOf(seat)
  return {
    state,
    seat,
    hand: state.hands[seat],
    level: state.level,
    unseen,
    oppMin,
    partnerCards: state.finished.includes(p) ? null : state.hands[p].length,
    bombRisk: unseenBombPossible(unseen),
  }
}

interface Scored {
  move: Combination
  cost: number // ranking key (includes structural bonuses/penalties)
  raw: number // plain resulting-hand score, comparable with the pre-move baseline
  uncAfter: number
  isSafe: boolean
}

/** Expert-style cost of a move (lower is better), annotated with safety/run-out info. */
function score(ctx: Ctx, m: Combination): Scored {
  const remaining = removeCards(ctx.hand, m.cards)
  const isSafe = !unseenCanBeatCombo(m, ctx.unseen, ctx.level)
  if (remaining.length === 0) return { move: m, cost: -1000, raw: -1000, uncAfter: 0, isSafe }
  const shape = shapeFromUnseen(remaining, ctx.unseen, ctx.level)
  const uncAfter = Math.max(0, shape.plays - shape.control - shape.bombs)
  const raw = scoreHand(shape)
  let cost = raw + uncAfter * MASTER_TUNING.uncW
  if (isBomb(m)) cost += 3
  cost += m.wildCount * 0.6
  cost += m.rank * 0.003
  return { move: m, cost, raw, uncAfter, isSafe }
}

function best(list: Scored[]): Scored | null {
  return list.length === 0 ? null : list.reduce((a, b) => (b.cost < a.cost ? b : a))
}

/** A finish path is locked: every remaining group after this move is unbeatable. */
function locksRunOut(ctx: Ctx, s: Scored): boolean {
  return s.isSafe && s.uncAfter === 0 && (!ctx.bombRisk || ctx.hand.length <= 8)
}

function chooseLead(ctx: Ctx): AiAction {
  const moves = generateLeadMoves(ctx.hand, ctx.level)
  if (moves.length === 0) return { type: 'pass' }

  const finisher = moves.find((m) => m.count === ctx.hand.length)
  if (finisher) return { type: 'play', combo: finisher }

  const scored = moves.map((m) => score(ctx, m))

  // Guaranteed run-out: everything left is unbeatable — start cashing out.
  const runouts = scored.filter((s) => locksRunOut(ctx, s))
  if (runouts.length > 0) return { type: 'play', combo: best(runouts)!.move }

  // Safe-finisher endgame: lead the vulnerable group now, keep an unbeatable closer.
  if (MASTER_TUNING.closers && ctx.hand.length <= 10) {
    const closers = scored.filter((s) => s.uncAfter === 0)
    if (closers.length > 0) return { type: 'play', combo: best(closers)!.move }
  }

  // Denial: an opponent is nearly out — don't lead anything they can fit under.
  if (MASTER_TUNING.denial && ctx.oppMin <= 2) {
    for (const s of scored) {
      if (s.move.count <= ctx.oppMin && !s.isSafe) s.cost += 4
    }
  }

  return { type: 'play', combo: best(scored)!.move }
}

function chooseFollow(ctx: Ctx): AiAction {
  const state = ctx.state
  const current = state.trick.current!
  const responses = generateResponses(ctx.hand, current, ctx.level)
  if (responses.length === 0) return { type: 'pass' }

  const finisher = responses.find((m) => m.count === ctx.hand.length)
  if (finisher) return { type: 'play', combo: finisher }

  const scored = responses.map((m) => score(ctx, m))
  const nonBombs = scored.filter((s) => !isBomb(s.move))
  const lastPlayer = state.trick.lastPlayer
  const partnerWinning = lastPlayer !== null && lastPlayer === partnerOf(ctx.seat)

  // Partner holds the trick: only take over to convert a locked, guaranteed run-out.
  if (partnerWinning) {
    if (MASTER_TUNING.convert) {
      const convert = nonBombs.filter((s) => locksRunOut(ctx, s))
      if (convert.length > 0) return { type: 'play', combo: best(convert)!.move }
    }
    return { type: 'pass' }
  }

  // Endgame tempo grab: winning this trick locks a guaranteed finish — take it.
  if (MASTER_TUNING.tempoGrab) {
    const locking = nonBombs.filter((s) => locksRunOut(ctx, s))
    if (locking.length > 0) return { type: 'play', combo: best(locking)!.move }
  }

  const baseShape = shapeFromUnseen(ctx.hand, ctx.unseen, ctx.level)
  const baseScore = scoreHand(baseShape)
  const myCount = ctx.hand.length
  const pressure = ctx.oppMin <= 6
  const short = myCount <= 8
  const partnerSafe = ctx.partnerCards !== null && ctx.partnerCards <= 5

  const bestNB = best(nonBombs)

  // An opponent nearly out is winning the trick: deny with the cheapest beater, bomb if needed.
  if (MASTER_TUNING.denial && ctx.oppMin <= 3) {
    if (bestNB) return { type: 'play', combo: bestNB.move }
    const denialBomb = best(scored)
    if (denialBomb) return { type: 'play', combo: denialBomb.move }
  }

  if (bestNB) {
    const wasteful = bestNB.raw > baseScore + 0.5
    if (!wasteful || pressure || short || partnerSafe) {
      return { type: 'play', combo: bestNB.move }
    }
    return { type: 'pass' }
  }

  // Only bombs can answer. Spend one to deny, to seize tempo when short, when the partner is
  // nearly out, when it materially improves the hand — or when it locks a run-out.
  const bombs = scored.filter((s) => isBomb(s.move))
  const bestBomb = best(bombs)
  if (bestBomb) {
    const dominantAfter = bestBomb.raw <= baseScore - 1
    const locks = bestBomb.uncAfter === 0 && !ctx.bombRisk
    if (ctx.oppMin <= 6 || myCount <= 6 || partnerSafe || dominantAfter || locks) {
      return { type: 'play', combo: bestBomb.move }
    }
  }
  return { type: 'pass' }
}

export function chooseMasterMove(state: GameState, seat: Seat): AiAction {
  const ctx = makeCtx(state, seat)
  if (state.trick.current === null) return chooseLead(ctx)
  return chooseFollow(ctx)
}
