// net/view.ts — redact the authoritative GameState into a per-seat PlayerView. This is the
// security boundary: a client only ever receives its OWN hand plus public information (card
// counts, the current trick, played piles implicitly via counts, levels, results).

import { GameState, Seat } from '../engine'
import { PlayerView, SeatPublic } from './protocol'

const SEATS: Seat[] = [0, 1, 2, 3]

export function redact(
  state: GameState,
  seat: Seat,
  meta: {
    code: string
    isHost: boolean
    seats: Record<Seat, SeatPublic>
    turnSeconds?: number
    turnEndsAt?: number | null
  },
): PlayerView {
  const handCounts = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<Seat, number>
  for (const s of SEATS) handCounts[s] = state.hands[s].length

  return {
    code: meta.code,
    phase: state.phase,
    youSeat: seat,
    isHost: meta.isHost,
    handNumber: state.handNumber,
    level: state.level,
    declarerTeam: state.declarerTeam,
    teamLevels: state.teamLevels,
    yourHand: state.hands[seat], // ONLY this seat's cards
    handCounts,
    finished: state.finished,
    trick: {
      current: state.trick.current,
      leader: state.trick.leader,
      toAct: state.trick.toAct,
      lastPlayer: state.trick.lastPlayer,
    },
    seats: meta.seats,
    results: state.results,
    winnerTeam: state.winnerTeam,
    lastTribute: state.lastTribute,
    turnSeconds: meta.turnSeconds ?? 0,
    turnEndsAt: meta.turnEndsAt ?? null,
  }
}
