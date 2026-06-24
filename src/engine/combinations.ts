// combinations.ts — recognize a set of chosen cards as legal Guandan combination(s).
//
// `recognize(cards, level)` returns EVERY legal interpretation of the exact cards passed
// (empty array => illegal). A set may have several readings (e.g. four spades 3-4-5-6-7 is
// both a `straight` and a `straightflush`; cards with wilds can complete different windows),
// so callers pick the interpretation they want via pickBest()/canBeat().
//
// Wild handling: the cards are split into jokers / wilds (Hearts-of-level) / naturals. Wilds
// fill deficits in whatever shape we are testing; all selected cards must be consumed.

import {
  Card,
  NumberCard,
  NaturalRank,
  Suit,
  SUITS,
  isWild,
  isJoker,
  singleOrderValue,
  LEVEL_CARD_VALUE,
} from './cards'

export type ComboKind =
  | 'single'
  | 'pair'
  | 'triple'
  | 'fullhouse'
  | 'straight'
  | 'tube' // 3 consecutive pairs
  | 'plate' // 2 consecutive triples
  | 'bomb' // n-of-a-kind, 4..10
  | 'straightflush'
  | 'jokerbomb'

export interface Combination {
  readonly kind: ComboKind
  readonly cards: Card[]
  readonly count: number
  /** Comparison key. Same-rank combos use singleOrderValue; sequences use the top natural rank. */
  readonly rank: number
  /** Bomb strength category for cross-type bomb comparison (see compare.ts). Undefined for non-bombs. */
  readonly bombLevel?: number
  /** Number of wild cards spent in this interpretation (for UI / AI cost). */
  readonly wildCount: number
}

const BOMB_LEVELS: Record<number, number> = {
  4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
}
export const STRAIGHT_FLUSH_LEVEL = 5.5
export const JOKER_BOMB_LEVEL = 11

/** Comparison strength of a same-rank group of NaturalRank r at the given level. */
function rankStrength(r: NaturalRank, level: NaturalRank): number {
  return r === level ? LEVEL_CARD_VALUE : r
}

interface Buckets {
  jokers: Card[]
  wilds: NumberCard[]
  naturals: NumberCard[]
}

function bucket(cards: Card[], level: NaturalRank): Buckets {
  const jokers: Card[] = []
  const wilds: NumberCard[] = []
  const naturals: NumberCard[] = []
  for (const c of cards) {
    if (isJoker(c)) jokers.push(c)
    else if (isWild(c, level)) wilds.push(c)
    else naturals.push(c)
  }
  return { jokers, wilds, naturals }
}

function histByRank(naturals: NumberCard[]): Map<NaturalRank, number> {
  const h = new Map<NaturalRank, number>()
  for (const c of naturals) h.set(c.rank, (h.get(c.rank) ?? 0) + 1)
  return h
}

/**
 * Try to read `naturals + W wilds` (no jokers) as a single group of k cards of one rank.
 * Returns the NaturalRank used, or null. All naturals must share a rank (or be all-wild).
 */
function formSameRank(
  naturals: NumberCard[],
  wildCount: number,
  level: NaturalRank,
): NaturalRank | null {
  const ranks = new Set(naturals.map((c) => c.rank))
  if (ranks.size === 0) return wildCount > 0 ? level : null // all-wild => level rank
  if (ranks.size === 1) return [...ranks][0]
  return null
}

interface Window {
  ranks: NaturalRank[]
  top: NaturalRank
}

/** Consecutive rank windows for sequences. A-low only when allowALow (straights/SF). */
function buildWindows(windowLen: number, allowALow: boolean): Window[] {
  const windows: Window[] = []
  // Normal ascending windows ending at most at A(14).
  for (let start = 2; start + windowLen - 1 <= 14; start++) {
    const ranks: NaturalRank[] = []
    for (let i = 0; i < windowLen; i++) ranks.push((start + i) as NaturalRank)
    windows.push({ ranks, top: (start + windowLen - 1) as NaturalRank })
  }
  // A-low: A acts as 1, e.g. A-2-3-4-5 (top = 5).
  if (allowALow) {
    const ranks: NaturalRank[] = [14]
    for (let i = 2; i <= windowLen; i++) ranks.push(i as NaturalRank)
    windows.push({ ranks, top: windowLen as NaturalRank })
  }
  return windows
}

/**
 * Test a single window against the naturals. Returns top rank if the naturals (optionally
 * filtered to one suit) plus exactly `wildCount` wilds tile the window with `perRankNeed`
 * cards per rank and no leftovers.
 */
function tryWindow(
  window: Window,
  naturals: NumberCard[],
  wildCount: number,
  perRankNeed: number,
  suit: Suit | undefined,
): NaturalRank | null {
  const allowed = new Set<NaturalRank>(window.ranks)
  let deficit = 0
  const counts = new Map<NaturalRank, number>()
  for (const c of naturals) {
    if (suit && c.suit !== suit) return null // wrong suit => leftover, not this SF
    if (!allowed.has(c.rank)) return null // outside window => leftover
    counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
  }
  for (const r of window.ranks) {
    const have = counts.get(r) ?? 0
    if (have > perRankNeed) return null
    deficit += perRankNeed - have
  }
  if (deficit !== wildCount) return null
  return window.top
}

function makeCombo(
  kind: ComboKind,
  cards: Card[],
  rank: number,
  wildCount: number,
  bombLevel?: number,
): Combination {
  return { kind, cards, count: cards.length, rank, wildCount, bombLevel }
}

/** All legal interpretations of `cards` at the given level. Empty => illegal selection. */
export function recognize(cards: Card[], level: NaturalRank): Combination[] {
  const n = cards.length
  if (n === 0) return []
  const { jokers, wilds, naturals } = bucket(cards, level)
  const W = wilds.length
  const out: Combination[] = []

  // ----- Single -----
  if (n === 1) {
    out.push(makeCombo('single', cards, singleOrderValue(cards[0], level), W))
    return out
  }

  // ----- Joker bomb (exactly the four jokers) -----
  if (n === 4 && jokers.length === 4) {
    const big = jokers.filter((c) => c.kind === 'joker' && c.joker === 'BIG').length
    const small = jokers.filter((c) => c.kind === 'joker' && c.joker === 'SMALL').length
    if (big === 2 && small === 2) {
      out.push(makeCombo('jokerbomb', cards, Infinity, 0, JOKER_BOMB_LEVEL))
    }
    return out // four jokers can be nothing else
  }

  // Everything below forbids jokers (they only live in singles & the joker bomb).
  if (jokers.length > 0) return out

  // ----- Same-rank groups: pair / triple / n-bomb -----
  if (n === 2 || n === 3) {
    const r = formSameRank(naturals, W, level)
    if (r !== null) {
      out.push(makeCombo(n === 2 ? 'pair' : 'triple', cards, rankStrength(r, level), W))
    }
  }
  if (n >= 4 && n <= 10) {
    const r = formSameRank(naturals, W, level)
    if (r !== null) {
      out.push(makeCombo('bomb', cards, rankStrength(r, level), W, BOMB_LEVELS[n]))
    }
  }

  // ----- Full house (n=5): triple + pair, distinct ranks -----
  if (n === 5) {
    const hist = histByRank(naturals)
    const candidateRanks = new Set<NaturalRank>([...hist.keys(), level])
    for (const t of candidateRanks) {
      for (const p of candidateRanks) {
        if (t === p) continue
        const ct = hist.get(t) ?? 0
        const cp = hist.get(p) ?? 0
        if (ct > 3 || cp > 2) continue
        // every natural must belong to t or p
        if (naturals.some((c) => c.rank !== t && c.rank !== p)) continue
        const need = 3 - ct + (2 - cp)
        if (need === W && ct <= 3 && cp <= 2) {
          out.push(makeCombo('fullhouse', cards, rankStrength(t, level), W))
        }
      }
    }
  }

  // ----- Sequences: straight (5), tube (3 pairs), plate (2 triples), straight flush (5) -----
  if (n === 5) {
    for (const w of buildWindows(5, true)) {
      const top = tryWindow(w, naturals, W, 1, undefined)
      if (top !== null) out.push(makeCombo('straight', cards, top, W))
    }
    for (const suit of SUITS) {
      for (const w of buildWindows(5, true)) {
        const top = tryWindow(w, naturals, W, 1, suit)
        if (top !== null) {
          out.push(makeCombo('straightflush', cards, top, W, STRAIGHT_FLUSH_LEVEL))
        }
      }
    }
  }
  if (n === 6) {
    for (const w of buildWindows(3, false)) {
      const top = tryWindow(w, naturals, W, 2, undefined)
      if (top !== null) out.push(makeCombo('tube', cards, top, W))
    }
    for (const w of buildWindows(2, false)) {
      const top = tryWindow(w, naturals, W, 3, undefined)
      if (top !== null) out.push(makeCombo('plate', cards, top, W))
    }
  }

  return dedupe(out)
}

function comboKey(c: Combination): string {
  return `${c.kind}|${c.rank}|${c.bombLevel ?? ''}|${c.cards.map((x) => x.id).sort().join(',')}`
}

function dedupe(combos: Combination[]): Combination[] {
  const seen = new Set<string>()
  const out: Combination[] = []
  for (const c of combos) {
    const k = comboKey(c)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(c)
    }
  }
  return out
}

/**
 * Pick a single canonical interpretation. When leading, prefer a non-bomb (don't waste a
 * bomb) of lowest rank and fewest wilds; when a specific kind is desired, filter first.
 */
export function pickBest(combos: Combination[], preferKind?: ComboKind): Combination | null {
  if (combos.length === 0) return null
  let pool = preferKind ? combos.filter((c) => c.kind === preferKind) : combos
  if (pool.length === 0) pool = combos
  const isBombKind = (k: ComboKind) =>
    k === 'bomb' || k === 'straightflush' || k === 'jokerbomb'
  return [...pool].sort((a, b) => {
    const ab = isBombKind(a.kind) ? 1 : 0
    const bb = isBombKind(b.kind) ? 1 : 0
    if (ab !== bb) return ab - bb // non-bombs first
    if (a.wildCount !== b.wildCount) return a.wildCount - b.wildCount
    return a.rank - b.rank
  })[0]
}

const KIND_LABEL: Record<ComboKind, string> = {
  single: 'Single',
  pair: 'Pair',
  triple: 'Triple',
  fullhouse: 'Full House',
  straight: 'Straight',
  tube: 'Tube (3 pairs)',
  plate: 'Plate (2 triples)',
  bomb: 'Bomb',
  straightflush: 'Straight Flush',
  jokerbomb: 'Four Jokers',
}

export function comboKindLabel(kind: ComboKind): string {
  return KIND_LABEL[kind]
}
