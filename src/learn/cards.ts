// learn/cards.ts — build concrete engine Cards from short specs, for lesson examples & drills.
//   "S7" "H10" "DA" "CK" -> number cards   |   "JB" big joker, "JS" small joker
// Repeated specs auto-increment the deck copy so ids stay unique within a hand.

import { Card, NumberCard, NaturalRank, Suit } from '../engine'

const RANK_MAP: Record<string, NaturalRank> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, T: 10,
  J: 11, Q: 12, K: 13, A: 14,
}

function one(spec: string, copy: 0 | 1): Card {
  if (spec === 'JB') return { kind: 'joker', joker: 'BIG', copy, id: `JB#${copy}` }
  if (spec === 'JS') return { kind: 'joker', joker: 'SMALL', copy, id: `JS#${copy}` }
  const suit = spec[0] as Suit
  const rank = RANK_MAP[spec.slice(1)]
  if (!rank || !'SHDC'.includes(suit)) throw new Error(`bad card spec: ${spec}`)
  const c: NumberCard = { kind: 'number', rank, suit, copy, id: `${suit}${rank}#${copy}` }
  return c
}

export function buildCards(specs: string[]): Card[] {
  const seen = new Map<string, number>()
  return specs.map((spec) => {
    const n = seen.get(spec) ?? 0
    seen.set(spec, n + 1)
    return one(spec, (n % 2) as 0 | 1)
  })
}
