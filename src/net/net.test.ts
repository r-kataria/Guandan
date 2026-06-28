import { describe, it, expect } from 'vitest'
import { firstFreeSeat, humanSeatsFor, areOppositeTeams } from './seating'
import { redact } from './view'
import { createGame, reduce, generateLeadMoves, Seat } from '../engine'
import { SeatPublic } from './protocol'

describe('seating', () => {
  it('fills seats in order 0,1,2,3', () => {
    expect(firstFreeSeat([])).toBe(0)
    expect(firstFreeSeat([0])).toBe(1)
    expect(firstFreeSeat([0, 1])).toBe(2)
    expect(firstFreeSeat([0, 1, 2, 3])).toBeNull()
  })

  it('puts two players on opposite teams', () => {
    const seats = humanSeatsFor(2)
    expect(seats).toEqual([0, 1])
    expect(areOppositeTeams(seats[0], seats[1])).toBe(true)
  })

  it('assigns sensible seats for 1, 3 and 4 players', () => {
    expect(humanSeatsFor(1)).toEqual([0])
    expect(humanSeatsFor(3)).toEqual([0, 1, 2])
    expect(humanSeatsFor(4)).toEqual([0, 1, 2, 3])
  })
})

const SEATS_META: Record<Seat, SeatPublic> = {
  0: { name: 'A', kind: 'human', connected: true, team: 0 },
  1: { name: 'B', kind: 'human', connected: true, team: 1 },
  2: { name: 'Bot C', kind: 'bot', connected: true, team: 0 },
  3: { name: 'Bot D', kind: 'bot', connected: true, team: 1 },
}

describe('redact', () => {
  it('reveals only the viewing seat’s hand and never others’ cards', () => {
    const state = createGame({ seed: 'redact' })
    const view = redact(state, 1, { code: 'ABCD', isHost: false, seats: SEATS_META })

    expect(view.youSeat).toBe(1)
    expect(view.yourHand).toEqual(state.hands[1])
    expect(view.handCounts).toEqual({ 0: 27, 1: 27, 2: 27, 3: 27 })

    // The serialized view must not contain any card id belonging to another seat.
    const json = JSON.stringify(view)
    const otherIds = [state.hands[0], state.hands[2], state.hands[3]].flat().map((c) => c.id)
    for (const id of otherIds) {
      expect(json.includes(`"${id}"`)).toBe(false)
    }
  })

  it('reflects counts after a play', () => {
    let state = createGame({ seed: 'redact2' })
    const seat = state.trick.toAct
    const lead = generateLeadMoves(state.hands[seat], state.level)[0]
    state = reduce(state, { type: 'play', seat, combo: lead })
    const view = redact(state, seat, { code: 'ABCD', isHost: true, seats: SEATS_META })
    expect(view.handCounts[seat]).toBe(27 - lead.cards.length)
  })
})
