import { describe, it, expect } from 'vitest'
import {
  createGame,
  reduce,
  GameState,
  generateLeadMoves,
  generateResponses,
  findHint,
  Seat,
  teamOf,
} from './index'

/** A trivial legal-random player used to drive full simulated games. */
function randomMove(state: GameState, rng: () => number) {
  const seat = state.trick.toAct
  const hand = state.hands[seat]
  const current = state.trick.current
  if (current === null) {
    const moves = generateLeadMoves(hand, state.level)
    const m = moves[Math.floor(rng() * moves.length)]
    return reduce(state, { type: 'play', seat, combo: m })
  }
  const responses = generateResponses(hand, current, state.level)
  // Pass sometimes even when a move exists, to exercise trick resets.
  if (responses.length === 0 || rng() < 0.4) {
    return reduce(state, { type: 'pass', seat })
  }
  const m = responses[Math.floor(rng() * responses.length)]
  return reduce(state, { type: 'play', seat, combo: m })
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Total cards across all hands + already-played should stay consistent (no cards vanish). */
function totalCards(state: GameState): number {
  return ([0, 1, 2, 3] as Seat[]).reduce((n, s) => n + state.hands[s].length, 0)
}

describe('hand simulation', () => {
  it('a single hand always terminates with a full finish order', () => {
    const rng = mulberry32(12345)
    let state = createGame({ seed: 'sim-1' })
    let guard = 0
    while (state.phase === 'trickPlay') {
      state = randomMove(state, rng)
      if (++guard > 5000) throw new Error('hand did not terminate')
    }
    expect(['handEnd', 'gameOver']).toContain(state.phase)
    expect(state.finished.length).toBe(4)
    expect(new Set(state.finished).size).toBe(4)
  })

  it('cards are conserved during a hand (108 total, monotonically non-increasing in hands)', () => {
    const rng = mulberry32(999)
    let state = createGame({ seed: 'sim-2' })
    expect(totalCards(state)).toBe(108)
    let prev = 108
    let guard = 0
    while (state.phase === 'trickPlay') {
      state = randomMove(state, rng)
      const t = totalCards(state)
      expect(t).toBeLessThanOrEqual(prev)
      prev = t
      if (++guard > 5000) break
    }
  })

  it('the winning team advances levels per the finish order', () => {
    const rng = mulberry32(7)
    let state = createGame({ seed: 'sim-3' })
    let guard = 0
    while (state.phase === 'trickPlay') {
      state = randomMove(state, rng)
      if (++guard > 5000) break
    }
    const result = state.results[0]
    expect(result).toBeTruthy()
    expect(result.winningTeam).toBe(teamOf(result.finishOrder[0]))
    expect(result.gain).toBeGreaterThanOrEqual(1)
    expect(result.gain).toBeLessThanOrEqual(3)
    // Winning team's level increased by the gain (capped at A).
    expect(state.teamLevels[result.winningTeam]).toBe(
      Math.min(14, 2 + result.gain),
    )
  })

  it('plays many full games to completion without illegal states', () => {
    for (let g = 0; g < 8; g++) {
      const rng = mulberry32(1000 + g)
      let state = createGame({ seed: `game-${g}` })
      let guard = 0
      while (state.phase !== 'gameOver') {
        if (state.phase === 'handEnd') {
          state = reduce(state, { type: 'nextHand' })
          continue
        }
        state = randomMove(state, rng)
        if (++guard > 200000) throw new Error('game did not terminate')
      }
      expect(state.winnerTeam === 0 || state.winnerTeam === 1).toBe(true)
      // The winner must have reached level A (14).
      expect(state.teamLevels[state.winnerTeam!]).toBe(14)
    }
  })

  it('findHint returns a legal beating move or null', () => {
    let state = createGame({ seed: 'hint' })
    const seat = state.trick.toAct
    const lead = findHint(state.hands[seat], null, state.level)
    expect(lead).toBeTruthy()
  })
})
