// testHelpers.ts — tiny builders to make engine tests readable.

import { Card, NumberCard, NaturalRank, Suit } from './cards'

const RANK_MAP: Record<string, NaturalRank> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10, '10': 10,
  J: 11, Q: 12, K: 13, A: 14,
}

let copyCounter = new Map<string, number>()

/**
 * Build a card from a short spec:
 *   "H10" / "S5" / "DA" / "CK"  -> number card of that suit+rank
 *   "JB" -> big joker, "JS" -> small joker
 * Repeated specs auto-increment the deck copy (0 then 1) so ids stay unique.
 */
export function card(spec: string): Card {
  const seen = copyCounter.get(spec) ?? 0
  copyCounter.set(spec, seen + 1)
  const copy = (seen % 2) as 0 | 1

  if (spec === 'JB') return { kind: 'joker', joker: 'BIG', copy, id: `JB#${copy}` }
  if (spec === 'JS') return { kind: 'joker', joker: 'SMALL', copy, id: `JS#${copy}` }

  const suit = spec[0] as Suit
  const rankStr = spec.slice(1)
  const rank = RANK_MAP[rankStr]
  if (!rank || !'SHDC'.includes(suit)) throw new Error(`bad card spec: ${spec}`)
  const c: NumberCard = { kind: 'number', rank, suit, copy, id: `${suit}${rank}#${copy}` }
  return c
}

export function hand(...specs: string[]): Card[] {
  return specs.map(card)
}

/** Reset the copy counter between tests so ids are deterministic. */
export function resetCardCounter(): void {
  copyCounter = new Map<string, number>()
}
