// scoring.ts — level advancement and the win condition.

import { NaturalRank } from './cards'

export type Seat = 0 | 1 | 2 | 3
export type Team = 0 | 1

export const teamOf = (s: Seat): Team => (s % 2) as Team
export const MAX_LEVEL: NaturalRank = 14 // Ace

/**
 * Given the finish order (index 0 = first to empty their hand), determine the winning team
 * and how many levels they advance:
 *   partners finish 1st & 2nd  -> +3   ("double down")
 *   partners finish 1st & 3rd  -> +2
 *   partners finish 1st & 4th  -> +1
 */
export function levelGain(finishOrder: Seat[]): { team: Team; gain: 1 | 2 | 3 } {
  const first = finishOrder[0]
  const winTeam = teamOf(first)
  const partnerPlace = finishOrder.findIndex((s, i) => i > 0 && teamOf(s) === winTeam)
  // partnerPlace is the index (1..3) of the winning team's other member.
  const gain = partnerPlace === 1 ? 3 : partnerPlace === 2 ? 2 : 1
  return { team: winTeam, gain }
}

/** Advance a level by `gain`, clamped at Ace. */
export function applyLevelGain(level: NaturalRank, gain: number): NaturalRank {
  return Math.min(MAX_LEVEL, level + gain) as NaturalRank
}

/**
 * A team wins the whole game only by taking 1st place while already sitting at level A.
 * `levelBefore` is the winning team's level entering this hand.
 */
export function checkGameWon(
  finishOrder: Seat[],
  levelBefore: Record<Team, NaturalRank>,
): Team | null {
  const winTeam = teamOf(finishOrder[0])
  if (levelBefore[winTeam] === MAX_LEVEL) return winTeam
  return null
}

const LEVEL_LABEL: Record<NaturalRank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}

export function levelLabel(level: NaturalRank): string {
  return LEVEL_LABEL[level]
}
