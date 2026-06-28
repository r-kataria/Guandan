// net/seating.ts — pure seat-assignment logic for rooms.
//
// Humans take seats in the fixed order [0,1,2,3]; empty seats are filled by bots when the game
// starts. This order satisfies the rule "with 2 players, always put them on opposite teams":
// teams are {0,2} and {1,3}, so the first two seats (0 and 1) are on opposite teams.

import { Seat, Team, teamOf } from '../engine'

export const SEAT_FILL_ORDER: Seat[] = [0, 1, 2, 3]

/** The first seat (in fill order) not already taken, or null if the room is full. */
export function firstFreeSeat(taken: Seat[]): Seat | null {
  const used = new Set(taken)
  for (const s of SEAT_FILL_ORDER) {
    if (!used.has(s)) return s
  }
  return null
}

/** The seats that `n` sequential joiners would occupy. */
export function humanSeatsFor(n: number): Seat[] {
  return SEAT_FILL_ORDER.slice(0, Math.max(0, Math.min(4, n)))
}

/** True if every pair of the given seats spans both teams is not required — but with exactly two
 * seats, they must be on opposite teams. Used as an invariant check/test helper. */
export function areOppositeTeams(a: Seat, b: Seat): boolean {
  return teamOf(a) !== teamOf(b)
}

export { teamOf }
export type { Team }
