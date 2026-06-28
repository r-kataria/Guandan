// state.ts — the Guandan game state machine: deal -> (tribute) -> trick play -> hand end ->
// scoring -> next hand, expressed as pure reducers over an immutable-ish GameState.

import {
  Card,
  NaturalRank,
  buildDeck,
  shuffle,
  deal,
  makeRng,
  hashSeed,
  removeCards,
} from './cards'
import { Combination } from './combinations'
import { canBeat } from './compare'
import {
  Seat,
  Team,
  teamOf,
  levelGain,
  applyLevelGain,
  checkGameWon,
} from './scoring'
import { planTribute, TributePlan } from './tribute'

export type Phase = 'trickPlay' | 'handEnd' | 'gameOver'

export type PlayedMove =
  | { seat: Seat; type: 'play'; combo: Combination }
  | { seat: Seat; type: 'pass' }

export interface TrickState {
  current: Combination | null
  leader: Seat
  toAct: Seat
  lastPlayer: Seat | null
  passesInARow: number
  history: PlayedMove[]
}

export interface HandResult {
  handNumber: number
  finishOrder: Seat[]
  winningTeam: Team
  gain: 1 | 2 | 3
  levelsAfter: Record<Team, NaturalRank>
  gameWon: boolean
}

export interface GameState {
  phase: Phase
  seed: string
  handNumber: number
  level: NaturalRank // active level this hand (declarer team's level)
  declarerTeam: Team
  teamLevels: Record<Team, NaturalRank>
  hands: Record<Seat, Card[]>
  finished: Seat[] // finish order so far (index 0 = first out)
  played: Card[] // public log of every card played so far this hand (for card counting)
  trick: TrickState
  lastTribute: TributePlan | null
  prevFinishOrder: Seat[] | null
  results: HandResult[]
  winnerTeam: Team | null
}

export interface GameOptions {
  seed?: string
  /** Which team's level is active on the very first hand (default team 0). */
  startingDeclarer?: Team
}

export type Action =
  | { type: 'play'; seat: Seat; combo: Combination }
  | { type: 'pass'; seat: Seat }
  | { type: 'nextHand' }

const SEATS: Seat[] = [0, 1, 2, 3]

function nextActive(seat: Seat, finished: Seat[]): Seat {
  for (let i = 1; i <= 4; i++) {
    const cand = ((seat + i) % 4) as Seat
    if (!finished.includes(cand)) return cand
  }
  return seat
}

function activeCount(finished: Seat[]): number {
  return 4 - finished.length
}

/** Deal a fresh hand and apply tribute. Produces a GameState in trickPlay phase. */
function startHand(
  seed: string,
  handNumber: number,
  declarerTeam: Team,
  teamLevels: Record<Team, NaturalRank>,
  prevFinishOrder: Seat[] | null,
  results: HandResult[],
): GameState {
  const level = teamLevels[declarerTeam]
  const rng = makeRng(hashSeed(`${seed}:${handNumber}`))
  const deck = shuffle(buildDeck(), rng)
  const dealt = deal(deck)
  const hands: Record<Seat, Card[]> = { 0: dealt[0], 1: dealt[1], 2: dealt[2], 3: dealt[3] }

  let firstLeader: Seat = 0
  let lastTribute: TributePlan | null = null

  if (prevFinishOrder) {
    const plan = planTribute(prevFinishOrder, hands, level)
    lastTribute = plan
    firstLeader = plan.firstLeader
    if (!plan.cancelled) {
      for (const t of [...plan.payments, ...plan.returns]) {
        const card = hands[t.from].find((c) => c.id === t.cardId)
        if (card) {
          hands[t.from] = removeCards(hands[t.from], [card])
          hands[t.to] = [...hands[t.to], card]
        }
      }
    }
  }

  return {
    phase: 'trickPlay',
    seed,
    handNumber,
    level,
    declarerTeam,
    teamLevels,
    hands,
    finished: [],
    played: [],
    trick: {
      current: null,
      leader: firstLeader,
      toAct: firstLeader,
      lastPlayer: null,
      passesInARow: 0,
      history: [],
    },
    lastTribute,
    prevFinishOrder,
    results,
    winnerTeam: null,
  }
}

export function createGame(opts: GameOptions = {}): GameState {
  const seed = opts.seed ?? 'guandan'
  const declarer = opts.startingDeclarer ?? 0
  return startHand(seed, 0, declarer, { 0: 2, 1: 2 }, null, [])
}

/** Validate that the combo's cards are all in the seat's hand. */
function ownsCards(hand: Card[], combo: Combination): boolean {
  const ids = new Set(hand.map((c) => c.id))
  return combo.cards.every((c) => ids.has(c.id))
}

function finalizeHand(state: GameState): GameState {
  // The single remaining active player takes last place.
  const remaining = SEATS.filter((s) => !state.finished.includes(s))
  const finishOrder = [...state.finished, ...remaining] as Seat[]

  const levelsBefore: Record<Team, NaturalRank> = { ...state.teamLevels }
  const { team, gain } = levelGain(finishOrder)
  const gameWonTeam = checkGameWon(finishOrder, levelsBefore)
  const newLevels: Record<Team, NaturalRank> = {
    ...state.teamLevels,
    [team]: applyLevelGain(state.teamLevels[team], gain),
  }

  const result: HandResult = {
    handNumber: state.handNumber,
    finishOrder,
    winningTeam: team,
    gain,
    levelsAfter: newLevels,
    gameWon: gameWonTeam !== null,
  }

  return {
    ...state,
    phase: gameWonTeam !== null ? 'gameOver' : 'handEnd',
    finished: finishOrder,
    teamLevels: newLevels,
    prevFinishOrder: finishOrder,
    results: [...state.results, result],
    winnerTeam: gameWonTeam,
  }
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'play':
      return applyPlay(state, action.seat, action.combo)
    case 'pass':
      return applyPass(state, action.seat)
    case 'nextHand':
      return applyNextHand(state)
  }
}

function applyPlay(state: GameState, seat: Seat, combo: Combination): GameState {
  if (state.phase !== 'trickPlay') throw new Error('not in trick play')
  if (state.trick.toAct !== seat) throw new Error(`not seat ${seat}'s turn`)
  if (!ownsCards(state.hands[seat], combo)) throw new Error('cards not in hand')
  if (state.trick.current && !canBeat(combo, state.trick.current, state.level)) {
    throw new Error('move does not beat current combination')
  }

  const newHand = removeCards(state.hands[seat], combo.cards)
  const hands = { ...state.hands, [seat]: newHand }
  const finished = newHand.length === 0 ? [...state.finished, seat] : state.finished

  const history: PlayedMove[] = [...state.trick.history, { seat, type: 'play', combo }]

  let next: GameState = {
    ...state,
    hands,
    finished,
    played: [...state.played, ...combo.cards],
    trick: {
      current: combo,
      leader: state.trick.leader,
      toAct: seat, // updated below
      lastPlayer: seat,
      passesInARow: 0,
      history,
    },
  }

  if (finished.length === 3) {
    return finalizeHand(next)
  }

  next = {
    ...next,
    trick: { ...next.trick, toAct: nextActive(seat, finished) },
  }
  return next
}

function applyPass(state: GameState, seat: Seat): GameState {
  if (state.phase !== 'trickPlay') throw new Error('not in trick play')
  if (state.trick.toAct !== seat) throw new Error(`not seat ${seat}'s turn`)
  if (state.trick.current === null) throw new Error('cannot pass when leading')

  const passes = state.trick.passesInARow + 1
  const history: PlayedMove[] = [...state.trick.history, { seat, type: 'pass' }]
  const lastPlayer = state.trick.lastPlayer
  const lastActive = lastPlayer !== null && !state.finished.includes(lastPlayer)
  const passesNeeded = activeCount(state.finished) - (lastActive ? 1 : 0)

  if (passes >= passesNeeded && lastPlayer !== null) {
    // Trick won by lastPlayer; they (or the next active seat) lead a fresh trick.
    const leader = lastActive ? lastPlayer : nextActive(lastPlayer, state.finished)
    return {
      ...state,
      trick: {
        current: null,
        leader,
        toAct: leader,
        lastPlayer: null,
        passesInARow: 0,
        history: [], // new trick starts fresh
      },
    }
  }

  return {
    ...state,
    trick: {
      ...state.trick,
      toAct: nextActive(seat, state.finished),
      passesInARow: passes,
      history,
    },
  }
}

function applyNextHand(state: GameState): GameState {
  if (state.phase !== 'handEnd') throw new Error('hand not finished')
  const winningTeam = teamOf(state.prevFinishOrder![0])
  return startHand(
    state.seed,
    state.handNumber + 1,
    winningTeam,
    state.teamLevels,
    state.prevFinishOrder,
    state.results,
  )
}

// Convenience selectors -----------------------------------------------------

export function isHumanTurn(state: GameState, humanSeat: Seat): boolean {
  return state.phase === 'trickPlay' && state.trick.toAct === humanSeat
}

export function cardsLeft(state: GameState): Record<Seat, number> {
  return {
    0: state.hands[0].length,
    1: state.hands[1].length,
    2: state.hands[2].length,
    3: state.hands[3].length,
  }
}
