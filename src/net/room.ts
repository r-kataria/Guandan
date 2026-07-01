// net/room.ts — transport-agnostic room + game logic. The WebSocket server is a thin wrapper
// that maps connections to client ids and drives the bot/hand timers; ALL rules and redaction
// live here so they can be unit-tested in-process without sockets.

import {
  createGame,
  reduce,
  recognize,
  pickBest,
  canBeat,
  GameState,
  Combination,
  Seat,
  teamOf,
} from '../engine'
import { findHint } from '../engine'
import { chooseMove, Difficulty } from '../ai'
import { LobbyView, PlayerView, SeatPublic } from './protocol'
import { redact } from './view'
import { firstFreeSeat } from './seating'

const SEATS: Seat[] = [0, 1, 2, 3]
const BOT_NAMES = ['Bot North', 'Bot East', 'Bot South', 'Bot West']

interface Member {
  id: string
  name: string
  seat: Seat
  connected: boolean
}

export class GameRoom {
  readonly code: string
  hostId = ''
  difficulty: Difficulty
  state: GameState | null = null
  private members = new Map<string, Member>()
  private liveHumanSeats = new Set<Seat>()
  private seatsMeta = {} as Record<Seat, SeatPublic>
  /** Hidden host advantage: host-team bots play Master, opponent bots play Easy. */
  private rigged = false
  /** Per-turn time limit for human players (seconds); 0 = off. Host-configurable. */
  turnSeconds = 0
  /** Epoch ms when the current actor's turn auto-resolves (set by the transport). */
  turnEndsAt: number | null = null

  constructor(code: string, difficulty: Difficulty = 'master') {
    this.code = code
    this.difficulty = difficulty
  }

  // ---- membership ----

  get isInGame(): boolean {
    return this.state !== null
  }

  humanIds(): string[] {
    return [...this.members.values()].filter((m) => m.connected).map((m) => m.id)
  }

  memberCount(): number {
    return this.members.size
  }

  private takenSeats(): Seat[] {
    return [...this.members.values()].map((m) => m.seat)
  }

  private memberBySeat(seat: Seat): Member | undefined {
    for (const m of this.members.values()) if (m.seat === seat) return m
    return undefined
  }

  /** Add a human (host on create, or a joiner). Returns the assigned seat or an error string. */
  addHuman(id: string, name: string, isHost = false): Seat | string {
    if (this.state) return 'That game has already started.'
    const seat = firstFreeSeat(this.takenSeats())
    if (seat === null) return 'Room is full.'
    this.members.set(id, { id, name: name || 'Player', seat, connected: true })
    if (isHost) this.hostId = id
    return seat
  }

  setDifficulty(id: string, difficulty: Difficulty): void {
    if (id === this.hostId && !this.state) this.difficulty = difficulty
  }

  setTurnSeconds(id: string, seconds: number): void {
    if (id === this.hostId) this.turnSeconds = Math.max(0, Math.min(600, Math.floor(seconds)))
  }

  /**
   * Host-only, lobby-only: move whoever occupies `from` to `to` (swapping with any occupant).
   * Teams are fixed by seat parity ({0,2} vs {1,3}), so rearranging seats sets the teams —
   * including two humans as partners vs two bots.
   */
  swapSeats(id: string, from: Seat, to: Seat): void {
    if (id !== this.hostId || this.state) return
    if (![0, 1, 2, 3].includes(from) || ![0, 1, 2, 3].includes(to) || from === to) return
    const a = this.memberBySeat(from)
    const b = this.memberBySeat(to)
    if (a) a.seat = to
    if (b) b.seat = from
  }

  /** Auto-resolve the current actor's turn on timeout: pass if possible, else lead the cheapest. */
  timeoutAct(): boolean {
    const state = this.state
    if (!state || state.phase !== 'trickPlay') return false
    const seat = state.trick.toAct
    if (state.trick.current !== null) {
      this.state = reduce(state, { type: 'pass', seat })
      return true
    }
    const lead = findHint(state.hands[seat], null, state.level)
    if (!lead) return false
    this.state = reduce(state, { type: 'play', seat, combo: lead })
    return true
  }

  /** Handle a member leaving/disconnecting. In-game seats are taken over by a bot. */
  disconnect(id: string): void {
    const m = this.members.get(id)
    if (!m) return
    if (this.state) {
      m.connected = false
      this.liveHumanSeats.delete(m.seat)
      this.seatsMeta[m.seat] = {
        name: `${m.name} (left)`,
        kind: 'bot',
        connected: false,
        team: teamOf(m.seat),
      }
    } else {
      this.members.delete(id)
      if (id === this.hostId && this.members.size > 0) {
        this.hostId = [...this.members.values()][0].id
      }
    }
  }

  // ---- game lifecycle ----

  start(id: string, seed?: string): boolean {
    if (id !== this.hostId) return false
    if (this.state && this.state.phase !== 'gameOver') return false
    this.liveHumanSeats = new Set(
      [...this.members.values()].filter((m) => m.connected).map((m) => m.seat),
    )
    this.seatsMeta = this.buildSeatsMeta()
    this.state = createGame({ seed: seed ?? `${this.code}-${this.members.size}` })
    return true
  }

  private buildSeatsMeta(): Record<Seat, SeatPublic> {
    const meta = {} as Record<Seat, SeatPublic>
    for (const seat of SEATS) {
      const m = this.memberBySeat(seat)
      meta[seat] =
        m && m.connected
          ? { name: m.name, kind: 'human', connected: true, team: teamOf(seat) }
          : { name: BOT_NAMES[seat], kind: 'bot', connected: true, team: teamOf(seat) }
    }
    return meta
  }

  // ---- human actions ----

  play(id: string, cardIds: string[]): string | null {
    const m = this.members.get(id)
    if (!m) return 'You are not in this room.'
    const state = this.state
    if (!state || state.phase !== 'trickPlay') return 'Game is not in play.'
    if (state.trick.toAct !== m.seat) return 'Not your turn.'
    const cards = state.hands[m.seat].filter((c) => cardIds.includes(c.id))
    if (cards.length !== cardIds.length) return 'Some selected cards are not in your hand.'
    const interps = recognize(cards, state.level)
    if (interps.length === 0) return 'Those cards are not a valid combination.'
    const current = state.trick.current
    const valid =
      current === null ? interps : interps.filter((c) => canBeat(c, current, state.level))
    const combo: Combination | null = pickBest(valid)
    if (!combo) return 'That does not beat the current play.'
    this.state = reduce(state, { type: 'play', seat: m.seat, combo })
    return null
  }

  pass(id: string): string | null {
    const m = this.members.get(id)
    if (!m) return 'You are not in this room.'
    const state = this.state
    if (!state || state.phase !== 'trickPlay') return 'Game is not in play.'
    if (state.trick.toAct !== m.seat) return 'Not your turn.'
    if (state.trick.current === null) return 'You must lead — you cannot pass.'
    this.state = reduce(state, { type: 'pass', seat: m.seat })
    return null
  }

  // ---- secret host advantage ----

  /** Only the host may toggle it; never surfaced in any broadcast view. */
  setRig(id: string, on: boolean): void {
    if (id === this.hostId) this.rigged = on
  }

  get isRigged(): boolean {
    return this.rigged
  }

  /** Difficulty a given bot seat should play at (rigged => host-team Master, opponents Easy). */
  private botDifficultyFor(seat: Seat): Difficulty {
    if (!this.rigged) return this.difficulty
    const host = this.members.get(this.hostId)
    if (!host) return this.difficulty
    return teamOf(seat) === teamOf(host.seat) ? 'master' : 'easy'
  }

  // ---- bot / hand driving (called by the transport on timers, or by tests in a loop) ----

  /** The seat a bot must act for right now, or null if it's a human's turn or not in play. */
  pendingBotSeat(): Seat | null {
    const state = this.state
    if (!state || state.phase !== 'trickPlay') return null
    const toAct = state.trick.toAct
    return this.liveHumanSeats.has(toAct) ? null : toAct
  }

  /** Act one bot move. Returns true if a bot acted. */
  stepBot(): boolean {
    const seat = this.pendingBotSeat()
    if (seat === null || !this.state) return false
    const action = chooseMove(this.state, seat, this.botDifficultyFor(seat))
    this.state =
      action.type === 'play'
        ? reduce(this.state, { type: 'play', seat, combo: action.combo })
        : reduce(this.state, { type: 'pass', seat })
    return true
  }

  needsHandAdvance(): boolean {
    return this.state?.phase === 'handEnd'
  }

  advanceHand(): void {
    if (this.state?.phase === 'handEnd') this.state = reduce(this.state, { type: 'nextHand' })
  }

  // ---- views ----

  lobbyView(id: string): LobbyView {
    const taken = new Set(this.takenSeats())
    const seats = SEATS.map((seat) => {
      const m = this.memberBySeat(seat)
      return {
        seat,
        kind: taken.has(seat) ? ('human' as const) : ('empty' as const),
        name: m ? m.name : null,
        you: m ? m.id === id : false,
        team: teamOf(seat),
        connected: m ? m.connected : false,
      }
    })
    return {
      code: this.code,
      youId: id,
      isHost: this.hostId === id,
      difficulty: this.difficulty,
      seats,
      humanCount: this.members.size,
      turnSeconds: this.turnSeconds,
    }
  }

  playerView(id: string): PlayerView | null {
    const m = this.members.get(id)
    if (!m || !this.state) return null
    return redact(this.state, m.seat, {
      code: this.code,
      isHost: this.hostId === id,
      seats: this.seatsMeta,
      turnSeconds: this.turnSeconds,
      turnEndsAt: this.turnEndsAt,
    })
  }
}
