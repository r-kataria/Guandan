// ai/eval.ts — evaluation utilities that turn a hand + public card-counting info into the
// signals a strong player reasons about: how many "plays" it takes to empty the hand, how many
// of those are guaranteed trick-winners ("control"), and how many bombs back them up.
//
// These are heuristics, not a solver, but they capture the things the simpler bots ignore:
//   - card memory (what's already been played, hence what's still unseen),
//   - whether a card/pair is actually the boss of its category right now,
//   - hand shape (keeping structures intact, minimising leftover singles).

import {
  Card,
  NaturalRank,
  buildDeck,
  isWild,
  isJoker,
  LEVEL_CARD_VALUE,
  BIG_JOKER_VALUE,
  SMALL_JOKER_VALUE,
} from '../engine'

export interface HandShape {
  plays: number // estimated number of separate plays needed to empty the hand
  control: number // how many of those plays are current "boss" combos (unbeatable by same type)
  bombs: number // bombs held (incl. joker bomb)
  size: number
}

/** Strength of a NaturalRank as a single, given the level. */
export function rankValue(rank: NaturalRank, level: NaturalRank): number {
  return rank === level ? LEVEL_CARD_VALUE : rank
}

/** The multiset of cards not in my hand and not yet played — i.e. what opponents+partner hold. */
export function unseenCards(myHand: Card[], played: Card[]): Card[] {
  const known = new Set<string>([...myHand, ...played].map((c) => c.id))
  return buildDeck().filter((c) => !known.has(c.id))
}

export interface CardCounts {
  hist: Map<NaturalRank, number>
  wilds: number
  bigJ: number
  smallJ: number
}

export function countCards(cards: Card[], level: NaturalRank): CardCounts {
  const hist = new Map<NaturalRank, number>()
  let wilds = 0
  let bigJ = 0
  let smallJ = 0
  for (const c of cards) {
    if (isJoker(c)) {
      if (c.joker === 'BIG') bigJ++
      else smallJ++
    } else if (isWild(c, level)) {
      wilds++
    } else {
      hist.set(c.rank, (hist.get(c.rank) ?? 0) + 1)
    }
  }
  return { hist, wilds, bigJ, smallJ }
}

const ASC: NaturalRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

interface Group {
  type: 'single' | 'pair' | 'triple' | 'fullhouse' | 'straight' | 'tube' | 'plate' | 'bomb'
  rank: NaturalRank // representative rank (group rank, or top of a run)
  size: number
}

/**
 * Greedily decompose a hand into a small set of plays. Not provably optimal, but it strongly
 * prefers consuming many cards at once (bombs, runs, plates, tubes, full houses) before falling
 * back to triples/pairs/singles — which is what good players do to thin their hands.
 */
export function decompose(hand: Card[], level: NaturalRank): Group[] {
  const { hist, wilds, bigJ, smallJ } = countCards(hand, level)
  const groups: Group[] = []
  let w = wilds
  let big = bigJ
  let small = smallJ

  // Joker bomb.
  if (big >= 2 && small >= 2) {
    groups.push({ type: 'bomb', rank: 14, size: 4 })
    big -= 2
    small -= 2
  }

  const count = (r: NaturalRank) => hist.get(r) ?? 0
  const take = (r: NaturalRank, n: number) => hist.set(r, count(r) - n)

  // Natural bombs (4+ of a kind).
  for (const r of ASC) {
    if (count(r) >= 4) {
      groups.push({ type: 'bomb', rank: r, size: count(r) })
      take(r, count(r))
    }
  }

  // Straights (length >= 5), longest first, A-high only for simplicity.
  let foundRun = true
  while (foundRun) {
    foundRun = false
    let runStart = -1
    let bestStart = -1
    let bestLen = 0
    for (let i = 0; i < ASC.length; i++) {
      if (count(ASC[i]) >= 1) {
        if (runStart < 0) runStart = i
        const len = i - runStart + 1
        if (len > bestLen) {
          bestLen = len
          bestStart = runStart
        }
      } else {
        runStart = -1
      }
    }
    if (bestLen >= 5) {
      for (let i = bestStart; i < bestStart + bestLen; i++) take(ASC[i], 1)
      groups.push({ type: 'straight', rank: ASC[bestStart + bestLen - 1], size: bestLen })
      foundRun = true
    }
  }

  // Plates (2 consecutive triples).
  for (let i = 0; i + 1 < ASC.length; i++) {
    if (count(ASC[i]) >= 3 && count(ASC[i + 1]) >= 3) {
      take(ASC[i], 3)
      take(ASC[i + 1], 3)
      groups.push({ type: 'plate', rank: ASC[i + 1], size: 6 })
    }
  }

  // Tubes (3 consecutive pairs).
  for (let i = 0; i + 2 < ASC.length; i++) {
    if (count(ASC[i]) >= 2 && count(ASC[i + 1]) >= 2 && count(ASC[i + 2]) >= 2) {
      take(ASC[i], 2)
      take(ASC[i + 1], 2)
      take(ASC[i + 2], 2)
      groups.push({ type: 'tube', rank: ASC[i + 2], size: 6 })
    }
  }

  // Collect remaining triples and pairs.
  const triples: NaturalRank[] = []
  const pairs: NaturalRank[] = []
  const singles: NaturalRank[] = []
  for (const r of ASC) {
    let c = count(r)
    if (c >= 3) {
      triples.push(r)
      c -= 3
      take(r, 3)
    }
    if (c >= 2) {
      pairs.push(r)
      c -= 2
      take(r, 2)
    }
    if (c >= 1) {
      singles.push(r)
      take(r, 1)
    }
  }

  // Full houses: pair each spare triple with a pair.
  while (triples.length > 0 && pairs.length > 0) {
    const t = triples.pop()!
    pairs.pop()
    groups.push({ type: 'fullhouse', rank: t, size: 5 })
  }
  for (const t of triples) groups.push({ type: 'triple', rank: t, size: 3 })

  // Use wilds to soak up leftover singles into pairs (fewer plays), best (highest) single first.
  singles.sort((a, b) => rankValue(b, level) - rankValue(a, level))
  while (w > 0 && singles.length > 0) {
    const s = singles.shift()!
    groups.push({ type: 'pair', rank: s, size: 2 })
    w--
  }
  for (const p of pairs) groups.push({ type: 'pair', rank: p, size: 2 })
  for (const s of singles) groups.push({ type: 'single', rank: s, size: 1 })

  // Any spare wilds and lone jokers are their own (strong) singles.
  for (let i = 0; i < w; i++) groups.push({ type: 'single', rank: level, size: 1 })
  for (let i = 0; i < big; i++) groups.push({ type: 'single', rank: 14, size: 1 })
  for (let i = 0; i < small; i++) groups.push({ type: 'single', rank: 14, size: 1 })

  return groups
}

/** The composition of cards held by the other three players (card counting from public info). */
export function computeUnseen(hand: Card[], played: Card[], level: NaturalRank): CardCounts {
  return countCards(unseenCards(hand, played), level)
}

/** Highest single value among unseen cards (incl. jokers). */
function maxUnseenSingle(unseen: CardCounts): number {
  let m = 0
  if (unseen.bigJ > 0) m = Math.max(m, BIG_JOKER_VALUE)
  if (unseen.smallJ > 0) m = Math.max(m, SMALL_JOKER_VALUE)
  if (unseen.wilds > 0) m = Math.max(m, LEVEL_CARD_VALUE)
  return m
}

/** Can the unseen cards form a pair/triple (size k) strictly stronger than value `v`? */
function unseenCanBeatGroup(unseen: CardCounts, v: number, k: number, level: NaturalRank): boolean {
  for (const r of ASC) {
    const val = rankValue(r, level)
    if (val <= v) continue
    const c = unseen.hist.get(r) ?? 0
    if (c + unseen.wilds >= k && c >= 1) return true // need at least one natural of that rank
  }
  // A pure-wild group sits at the level value; only relevant if v < level value.
  if (unseen.wilds >= k && LEVEL_CARD_VALUE > v) return true
  return false
}

/** Can a bomb (any size) still be assembled from the unseen cards? */
export function unseenBombPossible(unseen: CardCounts): boolean {
  if (unseen.bigJ >= 2 && unseen.smallJ >= 2) return true
  for (const r of ASC) {
    const c = unseen.hist.get(r) ?? 0
    if (c >= 1 && c + unseen.wilds >= 4) return true
  }
  return false
}

/** Can the unseen cards make `need` cards of each rank in some window of `len` with top > minTop? */
function unseenCanBeatWindow(unseen: CardCounts, minTop: number, len: number, need: number): boolean {
  for (let start = 2; start + len - 1 <= 14; start++) {
    const top = start + len - 1
    if (top <= minTop) continue
    let deficit = 0
    for (let r = start; r <= top; r++) {
      const have = Math.min(need, unseen.hist.get(r as NaturalRank) ?? 0)
      deficit += need - have
    }
    if (deficit <= unseen.wilds) return true
  }
  return false
}

export interface ComboLike {
  kind: string
  count: number
  rank: number
  bombLevel?: number
}

/**
 * Can the unseen cards beat this combo with the SAME shape (ignoring bombs — check those with
 * unseenBombPossible)? Conservative: returns true when construction is plausible.
 */
export function unseenCanBeatCombo(combo: ComboLike, unseen: CardCounts, level: NaturalRank): boolean {
  switch (combo.kind) {
    case 'jokerbomb':
      return false
    case 'single':
      return maxUnseenSingle(unseen) > combo.rank ||
        [...unseen.hist.entries()].some(([r, c]) => c >= 1 && rankValue(r, level) > combo.rank)
    case 'pair':
      return unseenCanBeatGroup(unseen, combo.rank, 2, level)
    case 'triple':
      return unseenCanBeatGroup(unseen, combo.rank, 3, level)
    case 'fullhouse': {
      // A stronger triple, plus enough leftover material for any pair.
      if (!unseenCanBeatGroup(unseen, combo.rank, 3, level)) return false
      const total = [...unseen.hist.values()].reduce((a, b) => a + b, 0) + unseen.wilds
      return total >= 5
    }
    case 'straight':
      return unseenCanBeatWindow(unseen, combo.rank, 5, 1)
    case 'tube':
      return unseenCanBeatWindow(unseen, combo.rank, 3, 2)
    case 'plate':
      return unseenCanBeatWindow(unseen, combo.rank, 2, 3)
    case 'straightflush': {
      // Suits aren't tracked in CardCounts — be conservative about higher straight flushes,
      // and 6+-of-a-kind always beats a straight flush.
      for (const [r, c] of unseen.hist) {
        if (c >= 1 && c + unseen.wilds >= 6) return true
        void r
      }
      return unseenCanBeatWindow(unseen, combo.rank, 5, 1)
    }
    case 'bomb': {
      const size = combo.count
      for (const [r, c] of unseen.hist) {
        if (c < 1) continue
        // Same size, higher rank — or any strictly larger bomb.
        if (c + unseen.wilds >= size && rankValue(r, level) > combo.rank) return true
        if (c + unseen.wilds >= size + 1) return true
      }
      if (unseen.bigJ >= 2 && unseen.smallJ >= 2) return true
      // Straight flush outranks 4- and 5-bombs; suits unknown, so stay conservative.
      if (size <= 5 && unseenCanBeatWindow(unseen, 1, 5, 1)) return true
      return false
    }
    default:
      return true
  }
}

/**
 * Build the full HandShape, using the unseen-card composition to decide which groups are "control"
 * (currently unbeatable by the same combination type — ignoring bombs, which are counted apart).
 */
export function handShape(hand: Card[], played: Card[], level: NaturalRank): HandShape {
  return shapeFromUnseen(hand, computeUnseen(hand, played, level), level)
}

/** Like handShape, but takes a precomputed unseen composition (constant across candidate moves). */
export function shapeFromUnseen(hand: Card[], unseen: CardCounts, level: NaturalRank): HandShape {
  const groups = decompose(hand, level)
  const maxSingle = maxUnseenSingle(unseen)

  let control = 0
  let bombs = 0
  for (const g of groups) {
    if (g.type === 'bomb') {
      bombs++
      continue
    }
    const v = rankValue(g.rank, level)
    if (g.type === 'single') {
      if (v > maxSingle) control++
    } else if (g.type === 'pair' || g.type === 'triple') {
      const k = g.type === 'pair' ? 2 : 3
      if (!unseenCanBeatGroup(unseen, v, k, level)) control++
    }
    // straights/tubes/plates/full houses: treated as non-control (conservative).
  }

  return { plays: groups.length, control, bombs, size: hand.length }
}

/** Lower is better. Few plays, lots of control, bombs in reserve, fewer cards. */
export function scoreHand(shape: HandShape): number {
  const uncontrolled = Math.max(0, shape.plays - shape.control - shape.bombs)
  return (
    shape.plays * 1.0 +
    uncontrolled * 0.9 -
    shape.control * 0.5 -
    shape.bombs * 0.6 +
    shape.size * 0.015
  )
}
