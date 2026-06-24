// tribute.ts — tribute / return-tribute / anti-tribute resolution between hands.
//
// Rules implemented (standard competitive defaults):
//   - The tribute card is a player's highest NON-WILD card by single strength (a Big Joker is
//     the highest and must be paid).
//   - Single loss (1-3 / 1-4 finish): the last-place player pays the 1st-place player.
//   - Double loss (1-2 finish): both opponents pay; the higher tribute goes to the 1st-place
//     winner, the other to the partner, and each loser receives one return card.
//   - Anti-tribute: if the losing side collectively holds BOTH Big Jokers, tribute is cancelled.
//   - Return: the winner gives back any card of natural rank <= 10 (default: their lowest such
//     card; fallback to their lowest card if they hold nothing <= 10).

import { Card, NaturalRank, singleOrderValue, isWild, isJoker } from './cards'
import { Seat, Team, teamOf } from './scoring'

export interface TributeTransfer {
  from: Seat
  to: Seat
  cardId: string
}

export interface TributePlan {
  cancelled: boolean
  payments: TributeTransfer[]
  returns: TributeTransfer[]
  /** Who leads the first trick of the new hand. */
  firstLeader: Seat
}

function bigJokerCount(cards: Card[]): number {
  return cards.filter((c) => c.kind === 'joker' && c.joker === 'BIG').length
}

/** Highest non-wild card by single strength; null if the hand is only wild cards. */
export function highestTributeCard(cards: Card[], level: NaturalRank): Card | null {
  let best: Card | null = null
  let bestVal = -1
  for (const c of cards) {
    if (isWild(c, level)) continue
    const v = singleOrderValue(c, level)
    if (v > bestVal) {
      bestVal = v
      best = c
    }
  }
  return best
}

/** Lowest card of natural rank <= 10 for the return; falls back to lowest overall. */
export function returnCardChoice(cards: Card[], level: NaturalRank): Card {
  const eligible = cards.filter((c) => c.kind === 'number' && c.rank <= 10 && !isJoker(c))
  const pool = eligible.length > 0 ? eligible : cards
  return [...pool].sort((a, b) => singleOrderValue(a, level) - singleOrderValue(b, level))[0]
}

/**
 * Compute the tribute plan for the upcoming hand given the previous hand's finish order and
 * the freshly dealt hands. Return choices are auto-selected; a UI may override them.
 */
export function planTribute(
  prevFinishOrder: Seat[],
  hands: Record<Seat, Card[]>,
  level: NaturalRank,
): TributePlan {
  const first = prevFinishOrder[0]
  const second = prevFinishOrder[1]
  const third = prevFinishOrder[2]
  const fourth = prevFinishOrder[3]
  const winTeam = teamOf(first)
  const doubleDown = teamOf(second) === winTeam // 1-2 finish

  const losers: Seat[] = ([0, 1, 2, 3] as Seat[]).filter((s) => teamOf(s) !== winTeam)
  const losersBigJokers = losers.reduce<number>((n, s) => n + bigJokerCount(hands[s]), 0)
  if (losersBigJokers >= 2) {
    // Anti-tribute: cancelled. The previous last-place player still leads.
    return { cancelled: true, payments: [], returns: [], firstLeader: fourth }
  }

  const payments: TributeTransfer[] = []
  const returns: TributeTransfer[] = []

  if (doubleDown) {
    // Both opponents (3rd & 4th) pay. Higher tribute -> 1st place; other -> 2nd place.
    const payers = [third, fourth]
    const tributes = payers
      .map((p) => ({ payer: p, card: highestTributeCard(hands[p], level) }))
      .filter((t) => t.card) as { payer: Seat; card: Card }[]
    tributes.sort((a, b) => singleOrderValue(b.card, level) - singleOrderValue(a.card, level))
    const recipients = [first, second]
    tributes.forEach((t, i) => {
      const to = recipients[i]
      payments.push({ from: t.payer, to, cardId: t.card.id })
      const ret = returnCardChoice(hands[to], level)
      returns.push({ from: to, to: t.payer, cardId: ret.id })
    })
    // The biggest tribute payer leads first.
    const firstLeader = tributes.length > 0 ? tributes[0].payer : fourth
    return { cancelled: false, payments, returns, firstLeader }
  }

  // Single loss: 4th place pays 1st place.
  const tributeCard = highestTributeCard(hands[fourth], level)
  if (tributeCard) {
    payments.push({ from: fourth, to: first, cardId: tributeCard.id })
    const ret = returnCardChoice(hands[first], level)
    returns.push({ from: first, to: fourth, cardId: ret.id })
  }
  return { cancelled: false, payments, returns, firstLeader: fourth }
}

export type { Team }
