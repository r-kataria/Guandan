import { describe, it, expect } from 'vitest'
import { chooseMove, Difficulty } from './index'
import {
  createGame,
  reduce,
  GameState,
  generateLeadMoves,
  canBeat,
  Seat,
  teamOf,
} from '../engine'

/** Drive a full game where each seat uses the difficulty assigned to its team. */
function playTeamGame(
  seed: string,
  teamDiff: Record<0 | 1, Difficulty>,
  check = false,
): GameState {
  let state = createGame({ seed })
  let guard = 0
  while (state.phase !== 'gameOver') {
    if (state.phase === 'handEnd') {
      state = reduce(state, { type: 'nextHand' })
      continue
    }
    const seat = state.trick.toAct
    const diff = teamDiff[teamOf(seat)]
    const action = chooseMove(state, seat, diff)
    if (check) {
      if (action.type === 'play') {
        const ids = new Set(state.hands[seat].map((c) => c.id))
        expect(action.combo.cards.every((c) => ids.has(c.id))).toBe(true)
        if (state.trick.current) {
          expect(canBeat(action.combo, state.trick.current, state.level)).toBe(true)
        }
      } else {
        expect(state.trick.current).not.toBeNull()
      }
    }
    state =
      action.type === 'play'
        ? reduce(state, { type: 'play', seat, combo: action.combo })
        : reduce(state, { type: 'pass', seat })
    if (++guard > 500000) throw new Error('game did not terminate')
  }
  return state
}

describe('Master AI', () => {
  it('only produces legal moves and finishes a game', () => {
    const state = playTeamGame('master-legal', { 0: 'master', 1: 'master' }, true)
    expect(state.winnerTeam === 0 || state.winnerTeam === 1).toBe(true)
    expect(state.teamLevels[state.winnerTeam!]).toBe(14)
  })

  it('never passes when leading an open trick', () => {
    let state = createGame({ seed: 'master-lead' })
    let guard = 0
    while (state.phase === 'trickPlay' && guard < 3000) {
      const seat = state.trick.toAct
      const action = chooseMove(state, seat, 'master')
      if (state.trick.current === null) {
        expect(action.type).toBe('play')
        // The lead must be one of the legal leads.
        if (action.type === 'play') {
          const legal = generateLeadMoves(state.hands[seat], state.level)
          expect(legal.some((m) => m.kind === action.combo.kind && m.rank === action.combo.rank)).toBe(true)
        }
      }
      state =
        action.type === 'play'
          ? reduce(state, { type: 'play', seat, combo: action.combo })
          : reduce(state, { type: 'pass', seat: seat as Seat })
      guard++
    }
    expect(guard).toBeGreaterThan(0)
  })

  it('beats Hard head-to-head across many deals', () => {
    const N = 20
    let masterWins = 0
    for (let i = 0; i < N; i++) {
      // Alternate which team is Master to cancel any first-lead seat bias.
      const masterIsTeam0 = i % 2 === 0
      const teamDiff: Record<0 | 1, Difficulty> = masterIsTeam0
        ? { 0: 'master', 1: 'hard' }
        : { 0: 'hard', 1: 'master' }
      const state = playTeamGame(`h2h-${i}`, teamDiff)
      const masterTeam: 0 | 1 = masterIsTeam0 ? 0 : 1
      if (state.winnerTeam === masterTeam) masterWins++
    }
    // Master should clearly beat Hard. Allow some variance but require a strong majority.
    // eslint-disable-next-line no-console
    console.log(`Master beat Hard in ${masterWins}/${N} games`)
    expect(masterWins).toBeGreaterThan(N / 2)
  })
})
