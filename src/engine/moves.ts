// moves.ts — legal move generation for a hand, and the Hint helper.
//
// Strategy: enumerate candidate card SUBSETS by shape (iterating ranks & windows, never the
// 2^27 power set), then run each subset through recognize() so the resulting Combinations are
// always consistent with the parser. Wilds are spent minimally per shape.

import {
  Card,
  NumberCard,
  NaturalRank,
  Suit,
  SUITS,
  isWild,
  isJoker,
} from './cards'
import { recognize, Combination, ComboKind } from './combinations'
import { canBeat, isBomb } from './compare'

interface HandIndex {
  byRank: Map<NaturalRank, NumberCard[]>
  bySuitRank: Map<string, NumberCard[]>
  wilds: NumberCard[]
  jokers: Card[]
  all: Card[]
}

function indexHand(handCards: Card[], level: NaturalRank): HandIndex {
  const byRank = new Map<NaturalRank, NumberCard[]>()
  const bySuitRank = new Map<string, NumberCard[]>()
  const wilds: NumberCard[] = []
  const jokers: Card[] = []
  for (const c of handCards) {
    if (isJoker(c)) {
      jokers.push(c)
    } else if (isWild(c, level)) {
      wilds.push(c)
    } else {
      const arr = byRank.get(c.rank) ?? []
      arr.push(c)
      byRank.set(c.rank, arr)
      const key = `${c.suit}${c.rank}`
      const sarr = bySuitRank.get(key) ?? []
      sarr.push(c)
      bySuitRank.set(key, sarr)
    }
  }
  return { byRank, bySuitRank, wilds, jokers, all: handCards }
}

const RANKS: NaturalRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

interface Win {
  ranks: NaturalRank[]
}

function windows(len: number, allowALow: boolean): Win[] {
  const wins: Win[] = []
  for (let start = 2; start + len - 1 <= 14; start++) {
    const ranks: NaturalRank[] = []
    for (let i = 0; i < len; i++) ranks.push((start + i) as NaturalRank)
    wins.push({ ranks })
  }
  if (allowALow) {
    const ranks: NaturalRank[] = [14]
    for (let i = 2; i <= len; i++) ranks.push(i as NaturalRank)
    wins.push({ ranks })
  }
  return wins
}

/** Build a same-rank subset of size k for rank r using the fewest wilds possible. */
function sameRankSubset(idx: HandIndex, r: NaturalRank, k: number): Card[] | null {
  const nats = idx.byRank.get(r) ?? []
  const useNat = Math.min(k, nats.length)
  const needWild = k - useNat
  if (needWild < 0 || needWild > idx.wilds.length) return null
  return [...nats.slice(0, useNat), ...idx.wilds.slice(0, needWild)]
}

/** Enumerate all candidate subsets worth recognizing. */
function candidateSubsets(idx: HandIndex, level: NaturalRank): Card[][] {
  const subs: Card[][] = []

  // Singles: every physical card.
  for (const c of idx.all) subs.push([c])

  // Pairs / triples.
  for (const r of RANKS) {
    for (const k of [2, 3]) {
      const s = sameRankSubset(idx, r, k)
      if (s && s.length === k) subs.push(s)
    }
  }

  // n-of-a-kind bombs, sizes 4..10.
  for (const r of RANKS) {
    const avail = (idx.byRank.get(r)?.length ?? 0) + idx.wilds.length
    for (let k = 4; k <= Math.min(10, avail); k++) {
      const s = sameRankSubset(idx, r, k)
      if (s && s.length === k) subs.push(s)
    }
  }

  // Full houses: triple t + pair p.
  for (const t of RANKS) {
    for (const p of RANKS) {
      if (t === p) continue
      const tri = sameRankSubset(idx, t, 3)
      if (!tri) continue
      const triWild = 3 - Math.min(3, idx.byRank.get(t)?.length ?? 0)
      // pair must use wilds not already taken by the triple
      const pNats = idx.byRank.get(p) ?? []
      const usePNat = Math.min(2, pNats.length)
      const needPWild = 2 - usePNat
      if (triWild + needPWild > idx.wilds.length) continue
      const pair = [...pNats.slice(0, usePNat), ...idx.wilds.slice(triWild, triWild + needPWild)]
      if (pair.length !== 2) continue
      subs.push([...tri, ...pair])
    }
  }

  // Straights (5 singles).
  for (const w of windows(5, true)) {
    const sub: Card[] = []
    let wildNeed = 0
    let ok = true
    for (const r of w.ranks) {
      const nats = idx.byRank.get(r) ?? []
      if (nats.length > 0) sub.push(nats[0])
      else wildNeed++
    }
    if (wildNeed > idx.wilds.length) ok = false
    if (ok) {
      for (let i = 0; i < wildNeed; i++) sub.push(idx.wilds[i])
      if (sub.length === 5) subs.push(sub)
    }
  }

  // Tubes (3 consecutive pairs) and plates (2 consecutive triples).
  pushSequenceGroups(idx, subs, windows(3, false), 2, 6)
  pushSequenceGroups(idx, subs, windows(2, false), 3, 6)

  // Straight flushes.
  for (const suit of SUITS) {
    for (const w of windows(5, true)) {
      const sub: Card[] = []
      let wildNeed = 0
      for (const r of w.ranks) {
        const nats = idx.bySuitRank.get(`${suit}${r}`) ?? []
        if (nats.length > 0) sub.push(nats[0])
        else wildNeed++
      }
      if (wildNeed <= idx.wilds.length) {
        for (let i = 0; i < wildNeed; i++) sub.push(idx.wilds[i])
        if (sub.length === 5) subs.push(sub)
      }
    }
  }

  // Joker bomb.
  const big = idx.jokers.filter((c) => c.kind === 'joker' && c.joker === 'BIG')
  const small = idx.jokers.filter((c) => c.kind === 'joker' && c.joker === 'SMALL')
  if (big.length >= 2 && small.length >= 2) {
    subs.push([big[0], big[1], small[0], small[1]])
  }

  return subs
}

function pushSequenceGroups(
  idx: HandIndex,
  subs: Card[][],
  wins: Win[],
  perRank: number,
  total: number,
): void {
  for (const w of wins) {
    const sub: Card[] = []
    let wildNeed = 0
    for (const r of w.ranks) {
      const nats = idx.byRank.get(r) ?? []
      const take = Math.min(perRank, nats.length)
      for (let i = 0; i < take; i++) sub.push(nats[i])
      wildNeed += perRank - take
    }
    if (wildNeed <= idx.wilds.length) {
      for (let i = 0; i < wildNeed; i++) sub.push(idx.wilds[i])
      if (sub.length === total) subs.push(sub)
    }
  }
}

function comboKey(c: Combination): string {
  return `${c.kind}|${c.cards.map((x) => x.id).sort().join(',')}`
}

/** Every legal combination that could be LED from this hand. */
export function generateLeadMoves(handCards: Card[], level: NaturalRank): Combination[] {
  const idx = indexHand(handCards, level)
  const subs = candidateSubsets(idx, level)
  const seen = new Set<string>()
  const out: Combination[] = []
  for (const sub of subs) {
    for (const combo of recognize(sub, level)) {
      const k = comboKey(combo)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(combo)
      }
    }
  }
  return out
}

/** Every legal combination from this hand that beats `current`. */
export function generateResponses(
  handCards: Card[],
  current: Combination,
  level: NaturalRank,
): Combination[] {
  return generateLeadMoves(handCards, level).filter((m) => canBeat(m, current, level))
}

/**
 * Suggest a move: when leading, the lowest non-bomb (or lowest move at all). When following,
 * the cheapest legal beater — prefer non-bombs, fewest wilds, then lowest rank, then fewest cards.
 */
export function findHint(
  handCards: Card[],
  current: Combination | null,
  level: NaturalRank,
): Combination | null {
  const moves = current
    ? generateResponses(handCards, current, level)
    : generateLeadMoves(handCards, level)
  if (moves.length === 0) return null
  return [...moves].sort((a, b) => byCheapest(a, b))[0]
}

function byCheapest(a: Combination, b: Combination): number {
  const ab = isBomb(a) ? 1 : 0
  const bb = isBomb(b) ? 1 : 0
  if (ab !== bb) return ab - bb // avoid bombs when possible
  if (a.wildCount !== b.wildCount) return a.wildCount - b.wildCount
  if (a.count !== b.count) return a.count - b.count
  return a.rank - b.rank
}

export type { Combination, ComboKind }
