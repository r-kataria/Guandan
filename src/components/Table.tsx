import { GameState, Seat, NaturalRank, teamOf, cardLabel } from '../engine'
import { CardTile } from './Card'
import { HUMAN_SEAT } from '../game/useGuandan'

export const SEAT_NAMES: Record<Seat, string> = {
  0: 'You',
  1: 'Right (Opp)',
  2: 'Partner',
  3: 'Left (Opp)',
}

const POSITIONS: Record<Seat, string> = { 0: 'bottom', 1: 'right', 2: 'top', 3: 'left' }

function relationClass(seat: Seat): string {
  if (seat === HUMAN_SEAT) return 'me'
  return teamOf(seat) === teamOf(HUMAN_SEAT) ? 'partner' : 'opp'
}

function MiniFan({ count }: { count: number }) {
  const shown = Math.min(count, 12)
  return (
    <div className="mini-fan">
      {Array.from({ length: shown }, (_, i) => (
        <div className="mini-back" key={i} />
      ))}
    </div>
  )
}

function PlayerSeat({ state, seat }: { state: GameState; seat: Seat }) {
  const isTurn = state.phase === 'trickPlay' && state.trick.toAct === seat
  const count = state.hands[seat].length
  const finishedIdx = state.finished.indexOf(seat)
  const passedThisTrick = state.trick.history.some(
    (h) => h.seat === seat && h.type === 'pass',
  )
  return (
    <div className={`seat ${POSITIONS[seat]} ${relationClass(seat)} ${isTurn ? 'turn' : ''}`}>
      <div className="avatar">
        <span className="dot" />
        {SEAT_NAMES[seat]}
        {finishedIdx >= 0 && <span className="badge done">#{finishedIdx + 1}</span>}
      </div>
      {seat !== HUMAN_SEAT && <MiniFan count={count} />}
      <div className="count">
        {count} cards{passedThisTrick && state.trick.current ? ' · passed' : ''}
      </div>
    </div>
  )
}

export function Table({ state, level }: { state: GameState; level: NaturalRank }) {
  const current = state.trick.current
  const lastPlayer = state.trick.lastPlayer
  return (
    <div className="table-wrap">
      {([0, 1, 2, 3] as Seat[]).map((s) => (
        <PlayerSeat key={s} state={state} seat={s} />
      ))}

      <div className="trick-center">
        {current && lastPlayer !== null ? (
          <>
            <div className="label">Current play</div>
            <div className="pile">
              {current.cards.map((c) => (
                <CardTile key={c.id} card={c} level={level} size="sm" />
              ))}
            </div>
            <div className="played-by">
              {SEAT_NAMES[lastPlayer]} · {current.cards.map(cardLabel).join(' ')}
            </div>
          </>
        ) : (
          <div className="passed">
            {state.phase === 'trickPlay'
              ? `New trick — ${SEAT_NAMES[state.trick.leader]} to lead`
              : 'Hand over'}
          </div>
        )}
      </div>
    </div>
  )
}
