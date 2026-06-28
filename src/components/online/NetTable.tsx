import { Seat, teamOf, cardLabel } from '../../engine'
import { PlayerView } from '../../net/protocol'
import { CardTile } from '../Card'

const POS = ['bottom', 'left', 'top', 'right'] as const

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

export function NetTable({ view }: { view: PlayerView }) {
  const you = view.youSeat
  // Map each absolute seat to a screen position relative to the viewer (viewer at the bottom).
  const seatAt = (offset: number) => ((you + offset) % 4) as Seat

  const relation = (seat: Seat) => {
    if (seat === you) return 'me'
    return teamOf(seat) === teamOf(you) ? 'partner' : 'opp'
  }

  const current = view.trick.current
  const lastPlayer = view.trick.lastPlayer

  return (
    <div className="table-wrap">
      {POS.map((pos, offset) => {
        const seat = seatAt(offset)
        const info = view.seats[seat]
        const isTurn = view.phase === 'trickPlay' && view.trick.toAct === seat
        const finishedIdx = view.finished.indexOf(seat)
        return (
          <div key={seat} className={`seat ${pos} ${relation(seat)} ${isTurn ? 'turn' : ''}`}>
            <div className="avatar">
              <span className="dot" />
              {info.name}
              {!info.connected && info.kind === 'bot' && <span className="badge">bot</span>}
              {finishedIdx >= 0 && <span className="badge done">#{finishedIdx + 1}</span>}
            </div>
            {seat !== you && <MiniFan count={view.handCounts[seat]} />}
            <div className="count">{view.handCounts[seat]} cards</div>
          </div>
        )
      })}

      <div className="trick-center">
        {current && lastPlayer !== null ? (
          <>
            <div className="label">Current play</div>
            <div className="pile">
              {current.cards.map((c) => (
                <CardTile key={c.id} card={c} level={view.level} size="sm" />
              ))}
            </div>
            <div className="played-by">
              {view.seats[lastPlayer].name} · {current.cards.map(cardLabel).join(' ')}
            </div>
          </>
        ) : (
          <div className="passed">
            {view.phase === 'trickPlay'
              ? `New trick — ${view.seats[view.trick.leader].name} leads`
              : 'Hand over'}
          </div>
        )}
      </div>
    </div>
  )
}
