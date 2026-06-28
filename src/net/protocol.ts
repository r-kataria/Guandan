// net/protocol.ts — message + view types shared by the WebSocket server and the browser client.
// Keeping them in one place (imported by both sides) guarantees the wire format stays in sync.

import { Card, Combination, Seat, Team, NaturalRank, HandResult, TributePlan } from '../engine'
import { Phase } from '../engine'
import { Difficulty } from '../ai'

export type { Difficulty }

export const WS_PATH = '/ws'
export const DEFAULT_SERVER_PORT = 8787

// ---- Lobby (before the game starts) ----

export interface LobbySeat {
  seat: Seat
  kind: 'human' | 'empty' // empty seats are filled by bots at start
  name: string | null
  you: boolean
  team: Team
  connected: boolean
}

export interface LobbyView {
  code: string
  youId: string
  isHost: boolean
  difficulty: Difficulty
  seats: LobbySeat[]
  humanCount: number
}

// ---- In-game per-seat view (opponents' hands are hidden) ----

export interface SeatPublic {
  name: string
  kind: 'human' | 'bot'
  connected: boolean
  team: Team
}

export interface PlayerView {
  code: string
  phase: Phase
  youSeat: Seat
  isHost: boolean
  handNumber: number
  level: NaturalRank
  declarerTeam: Team
  teamLevels: Record<Team, NaturalRank>
  yourHand: Card[]
  handCounts: Record<Seat, number>
  finished: Seat[]
  trick: {
    current: Combination | null
    leader: Seat
    toAct: Seat
    lastPlayer: Seat | null
  }
  seats: Record<Seat, SeatPublic>
  results: HandResult[]
  winnerTeam: Team | null
  lastTribute: TributePlan | null
}

// ---- Client -> Server ----

export type ClientMsg =
  | { t: 'create'; name: string; difficulty?: Difficulty }
  | { t: 'join'; code: string; name: string }
  | { t: 'setDifficulty'; difficulty: Difficulty }
  | { t: 'start' }
  | { t: 'play'; cardIds: string[] }
  | { t: 'pass' }
  | { t: 'rematch' }
  | { t: 'leave' }

// ---- Server -> Client ----

export type ServerMsg =
  | { t: 'joined'; code: string; youId: string }
  | { t: 'lobby'; view: LobbyView }
  | { t: 'state'; view: PlayerView }
  | { t: 'error'; message: string }
  | { t: 'kicked'; reason: string }
