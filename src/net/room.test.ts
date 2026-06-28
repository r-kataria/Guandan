import { describe, it, expect } from 'vitest'
import { GameRoom } from './room'
import { generateLeadMoves, generateResponses, Seat } from '../engine'

/** Drive a room to completion in-process (no timers): bots step instantly, humans auto-play. */
function driveToEnd(room: GameRoom, humanBySeat: Partial<Record<Seat, string>>): {
  errors: string[]
} {
  const errors: string[] = []
  let guard = 0
  while (room.state && room.state.phase !== 'gameOver') {
    if (++guard > 500000) throw new Error('did not terminate')
    if (room.needsHandAdvance()) {
      room.advanceHand()
      continue
    }
    if (room.pendingBotSeat() !== null) {
      room.stepBot()
      continue
    }
    // A connected human must act.
    const seat = room.state.trick.toAct
    const id = humanBySeat[seat]
    if (!id) {
      // Seat is human per the game but not connected here — let a bot step.
      room.stepBot()
      continue
    }
    const view = room.playerView(id)!
    const hand = view.yourHand
    if (view.trick.current === null) {
      const m = generateLeadMoves(hand, view.level)[0]
      const err = room.play(id, m.cards.map((c) => c.id))
      if (err) errors.push(err)
    } else {
      const resp = generateResponses(hand, view.trick.current, view.level)
      const err = resp.length === 0 ? room.pass(id) : room.play(id, resp[0].cards.map((c) => c.id))
      if (err) errors.push(err)
    }
  }
  return { errors }
}

describe('GameRoom', () => {
  it('seats two joiners on opposite teams (0 and 1)', () => {
    const room = new GameRoom('AAAA', 'hard')
    expect(room.addHuman('a', 'Alice', true)).toBe(0)
    expect(room.addHuman('b', 'Bob')).toBe(1)
  })

  it('plays a full 2-human + 2-bot game to completion with no rule errors', () => {
    const room = new GameRoom('BBBB', 'hard')
    room.addHuman('a', 'Alice', true)
    room.addHuman('b', 'Bob')
    expect(room.start('a')).toBe(true)
    const { errors } = driveToEnd(room, { 0: 'a', 1: 'b' })
    expect(errors).toEqual([])
    expect(room.state!.phase).toBe('gameOver')
    expect([0, 1]).toContain(room.state!.winnerTeam)
  })

  it('a player view never exposes another seat’s cards', () => {
    const room = new GameRoom('CCCC', 'hard')
    room.addHuman('a', 'Alice', true)
    room.addHuman('b', 'Bob')
    room.start('a')
    const view = room.playerView('a')!
    const json = JSON.stringify(view)
    // Bob (seat 1) and the bots (2,3) cards must not be present.
    const hidden = [1, 2, 3].flatMap((s) => room.state!.hands[s as Seat]).map((c) => c.id)
    for (const id of hidden) expect(json.includes(`"${id}"`)).toBe(false)
    expect(view.yourHand.length).toBe(27)
    expect(view.handCounts).toEqual({ 0: 27, 1: 27, 2: 27, 3: 27 })
  })

  it('hands a disconnected player’s seat to a bot and still finishes', () => {
    const room = new GameRoom('DDDD', 'hard')
    room.addHuman('a', 'Alice', true)
    room.addHuman('b', 'Bob')
    room.start('a')
    room.disconnect('b') // Bob leaves mid-game; seat 1 becomes a bot
    const { errors } = driveToEnd(room, { 0: 'a' })
    expect(errors).toEqual([])
    expect(room.state!.phase).toBe('gameOver')
  })

  it('only the host can start, and not before there is a game', () => {
    const room = new GameRoom('EEEE', 'master')
    room.addHuman('a', 'Alice', true)
    room.addHuman('b', 'Bob')
    expect(room.start('b')).toBe(false) // non-host
    expect(room.start('a')).toBe(true)
  })

  it('a solo host fills the other three seats with bots', () => {
    const room = new GameRoom('FFFF', 'easy')
    room.addHuman('a', 'Solo', true)
    room.start('a')
    const { errors } = driveToEnd(room, { 0: 'a' })
    expect(errors).toEqual([])
    expect(room.state!.phase).toBe('gameOver')
  })
})
