import { describe, it, expect } from 'vitest'
import { chooseMove, Difficulty } from './index'
import {
  createGame,
  reduce,
  GameState,
  generateLeadMoves,
  generateResponses,
  canBeat,
  Seat,
} from '../engine'

/** Verify the AI's chosen action is legal for the current state. */
function assertLegal(state: GameState, seat: Seat, action: ReturnType<typeof chooseMove>) {
  const hand = state.hands[seat]
  if (action.type === 'pass') {
    // Passing is only illegal when leading an open trick.
    expect(state.trick.current).not.toBeNull()
    return
  }
  const combo = action.combo
  const ids = new Set(hand.map((c) => c.id))
  expect(combo.cards.every((c) => ids.has(c.id))).toBe(true)
  if (state.trick.current) {
    expect(canBeat(combo, state.trick.current, state.level)).toBe(true)
  } else {
    const legal = generateLeadMoves(hand, state.level).some(
      (m) => m.kind === combo.kind && m.cards.length === combo.cards.length && m.rank === combo.rank,
    )
    expect(legal).toBe(true)
  }
}

function playGame(difficulty: Difficulty, seed: string, check = false) {
  let state = createGame({ seed })
  let guard = 0
  while (state.phase !== 'gameOver') {
    if (state.phase === 'handEnd') {
      state = reduce(state, { type: 'nextHand' })
      continue
    }
    const seat = state.trick.toAct
    const action = chooseMove(state, seat, difficulty)
    if (check) assertLegal(state, seat, action)
    if (action.type === 'play') {
      state = reduce(state, { type: 'play', seat, combo: action.combo })
    } else {
      state = reduce(state, { type: 'pass', seat })
    }
    if (++guard > 500000) throw new Error('game did not terminate')
  }
  return state
}

describe('AI', () => {
  const diffs: Difficulty[] = ['easy', 'medium', 'hard']

  for (const d of diffs) {
    it(`${d}: only ever produces legal moves and finishes a game`, () => {
      const state = playGame(d, `ai-${d}`, true)
      expect(state.winnerTeam === 0 || state.winnerTeam === 1).toBe(true)
      expect(state.teamLevels[state.winnerTeam!]).toBe(14)
    })
  }

  it('never passes when leading an open trick', () => {
    let state = createGame({ seed: 'lead-check' })
    let guard = 0
    while (state.phase === 'trickPlay' && guard < 2000) {
      const seat = state.trick.toAct
      const action = chooseMove(state, seat, 'hard')
      if (state.trick.current === null) expect(action.type).toBe('play')
      state =
        action.type === 'play'
          ? reduce(state, { type: 'play', seat, combo: action.combo })
          : reduce(state, { type: 'pass', seat })
      guard++
    }
    expect(guard).toBeGreaterThan(0)
  })

  it('a hand always has a legal response generator that agrees with canBeat', () => {
    const state = createGame({ seed: 'resp' })
    const seat = state.trick.toAct
    const lead = generateLeadMoves(state.hands[seat], state.level)[0]
    const next = reduce(state, { type: 'play', seat, combo: lead })
    const responder = next.trick.toAct
    const responses = generateResponses(next.hands[responder], lead, next.level)
    expect(responses.every((r) => canBeat(r, lead, next.level))).toBe(true)
  })
})
