// cards.ts — Card representation, deck construction, and the level-aware comparators.
//
// The single most important design idea here is the *dual comparator*:
//   - singleOrderValue(): used to rank singles/pairs/triples/full-houses/n-bombs.
//       Jokers are highest, and the current "level" rank is elevated to just below the
//       jokers (above Ace).
//   - sequenceValue(): used INSIDE straights/tubes/plates/straight-flushes, where the
//       level card keeps its NATURAL position (the rule exception).
// Keeping these separate means the rest of the engine never has to special-case the
// level card — it just trusts whichever value the combination kind calls for.

export type Suit = 'S' | 'H' | 'D' | 'C' // Spades, Hearts, Diamonds, Clubs

/** Natural rank ordinal: 2..10 literal, 11=J 12=Q 13=K 14=A. Jokers are NOT here. */
export type NaturalRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export type JokerKind = 'SMALL' | 'BIG'

export interface NumberCard {
  readonly kind: 'number'
  readonly rank: NaturalRank
  readonly suit: Suit
  readonly copy: 0 | 1 // which of the two decks
  readonly id: string
}

export interface JokerCard {
  readonly kind: 'joker'
  readonly joker: JokerKind
  readonly copy: 0 | 1
  readonly id: string
}

export type Card = NumberCard | JokerCard

export const SUITS: Suit[] = ['S', 'H', 'D', 'C']
export const RANKS: NaturalRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

// Strength sentinels for singleOrderValue.
export const BIG_JOKER_VALUE = 100
export const SMALL_JOKER_VALUE = 99
export const LEVEL_CARD_VALUE = 98 // elevated: above A(14), below small joker(99)

const RANK_LABEL: Record<NaturalRank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}

const SUIT_LABEL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }

export function rankLabel(rank: NaturalRank): string {
  return RANK_LABEL[rank]
}

export function suitLabel(suit: Suit): string {
  return SUIT_LABEL[suit]
}

/** Human-readable card name, e.g. "♥10", "Big Joker". */
export function cardLabel(card: Card): string {
  if (card.kind === 'joker') return card.joker === 'BIG' ? 'Big Joker' : 'Small Joker'
  return `${SUIT_LABEL[card.suit]}${RANK_LABEL[card.rank]}`
}

export function isRed(card: Card): boolean {
  if (card.kind === 'joker') return card.joker === 'BIG' // big joker drawn red
  return card.suit === 'H' || card.suit === 'D'
}

/** Build a full 108-card Guandan deck: 2 copies of 52 cards + 2 big + 2 small jokers. */
export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const copy of [0, 1] as const) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ kind: 'number', rank, suit, copy, id: `${suit}${rank}#${copy}` })
      }
    }
    deck.push({ kind: 'joker', joker: 'BIG', copy, id: `JB#${copy}` })
    deck.push({ kind: 'joker', joker: 'SMALL', copy, id: `JS#${copy}` })
  }
  return deck
}

/** Strength of a single card for non-sequence comparisons, given the active level rank. */
export function singleOrderValue(card: Card, level: NaturalRank): number {
  if (card.kind === 'joker') return card.joker === 'BIG' ? BIG_JOKER_VALUE : SMALL_JOKER_VALUE
  if (card.rank === level) return LEVEL_CARD_VALUE
  return card.rank
}

/** Natural sequence position (level card NOT elevated). Jokers are not allowed in sequences. */
export function sequenceValue(card: NumberCard): NaturalRank {
  return card.rank
}

/** True if this card is a wild — a Hearts card of the current level rank. */
export function isWild(card: Card, level: NaturalRank): boolean {
  return card.kind === 'number' && card.suit === 'H' && card.rank === level
}

export function isJoker(card: Card): card is JokerCard {
  return card.kind === 'joker'
}

/** Sort a hand for display: by singleOrderValue ascending, then suit for stability. */
export function sortHand(cards: Card[], level: NaturalRank): Card[] {
  return [...cards].sort((a, b) => {
    const va = singleOrderValue(a, level)
    const vb = singleOrderValue(b, level)
    if (va !== vb) return va - vb
    const sa = a.kind === 'number' ? a.suit : 'Z'
    const sb = b.kind === 'number' ? b.suit : 'Z'
    return sa.localeCompare(sb)
  })
}

/** Remove a set of cards (by id) from a hand, returning a new array. */
export function removeCards(hand: Card[], cards: Card[]): Card[] {
  const ids = new Set(cards.map((c) => c.id))
  return hand.filter((c) => !ids.has(c.id))
}

// ---------------------------------------------------------------------------
// Seedable RNG + shuffle (deterministic for tests/replay). Mulberry32 PRNG.
// ---------------------------------------------------------------------------

export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Convert an arbitrary string seed into a 32-bit integer. */
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h ^= h >>> 16) >>> 0
}

/** Fisher–Yates shuffle using a seeded RNG. Returns a new array. */
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Deal 108 cards into 4 hands of 27. */
export function deal(deck: Card[]): Record<0 | 1 | 2 | 3, Card[]> {
  const hands: Record<0 | 1 | 2 | 3, Card[]> = { 0: [], 1: [], 2: [], 3: [] }
  for (let i = 0; i < deck.length; i++) {
    hands[(i % 4) as 0 | 1 | 2 | 3].push(deck[i])
  }
  return hands
}
