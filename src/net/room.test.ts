import { describe, it, expect } from 'vitest'
import { GameRoom } from './room'
import { generateLeadMoves, generateResponses, Seat } from '../engine'
import { chooseMove } from '../ai'

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

  it('secret rig: host team (Master partner) beats the nerfed opponents', () => {
    // Simulate a strong host (Master policy at seat 0) with the displayed difficulty set to Easy.
    // Without the rig the opponents would also be Easy; with it on, the host's partner is Master
    // and opponents stay Easy — the host's team should win the clear majority.
    let hostWins = 0
    const N = 8
    for (let i = 0; i < N; i++) {
      const room = new GameRoom(`RIG${i}`, 'easy')
      room.addHuman('h', 'Host', true) // seat 0, team 0
      room.start('h', `rig-seed-${i}`)
      room.setRig('h', true)
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
        // The host (seat 0) acts — play it with a strong policy to mimic a skilled owner.
        const action = chooseMove(room.state, 0, 'master')
        const err =
          action.type === 'play'
            ? room.play('h', action.combo.cards.map((c) => c.id))
            : room.pass('h')
        expect(err).toBeNull()
      }
      if (room.state!.winnerTeam === 0) hostWins++
    }
    expect(hostWins).toBeGreaterThanOrEqual(Math.ceil(N * 0.7))
  })

  it('turn timer: host-only, and timeoutAct passes or leads', () => {
    const room = new GameRoom('TIMR', 'easy')
    room.addHuman('a', 'Host', true)
    room.addHuman('b', 'Other')
    room.setTurnSeconds('b', 60) // non-host ignored
    expect(room.turnSeconds).toBe(0)
    room.setTurnSeconds('a', 60)
    expect(room.turnSeconds).toBe(60)

    room.start('a', 'timer-seed')
    // On an open lead, timeoutAct must play a legal lead (can't pass).
    const seat = room.state!.trick.toAct
    const before = room.state!.hands[seat].length
    expect(room.state!.trick.current).toBeNull()
    expect(room.timeoutAct()).toBe(true)
    expect(room.state!.hands[seat].length).toBeLessThan(before)
    expect(room.state!.trick.current).not.toBeNull()

    // Now someone is following; timeoutAct should be able to pass.
    const follower = room.state!.trick.toAct
    const fBefore = room.state!.hands[follower].length
    expect(room.timeoutAct()).toBe(true)
    // Either passed (count unchanged) or went out via a legal beat — but a pass keeps the count.
    expect(room.state!.hands[follower].length).toBeLessThanOrEqual(fBefore)
  })

  it('secret rig: only the host can enable it', () => {
    const room = new GameRoom('GGGG', 'easy')
    room.addHuman('a', 'Host', true)
    room.addHuman('b', 'Other')
    room.setRig('b', true) // non-host ignored
    expect(room.isRigged).toBe(false)
    room.setRig('a', true)
    expect(room.isRigged).toBe(true)
    room.setRig('a', false)
    expect(room.isRigged).toBe(false)
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
