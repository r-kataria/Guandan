import { useState } from 'react'
import { UseRoom } from '../../net/useRoom'
import { DifficultyPicker } from '../GameSetup'

const TURN_OPTIONS: { secs: number; label: string }[] = [
  { secs: 0, label: 'Off' },
  { secs: 30, label: '30s' },
  { secs: 60, label: '1 min' },
  { secs: 120, label: '2 min' },
]

function TurnTimerPicker({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  return (
    <div className="seg">
      {TURN_OPTIONS.map((o) => (
        <button key={o.secs} className={value === o.secs ? 'on' : ''} onClick={() => onChange(o.secs)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Lobby({ room, onCodeTap }: { room: UseRoom; onCodeTap?: () => void }) {
  const lobby = room.lobby!
  const [copied, setCopied] = useState(false)
  // Seat rearranging (host only): drag a card onto another, or tap one then tap the other.
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [tapFrom, setTapFrom] = useState<number | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lobby.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the code is shown on screen anyway */
    }
  }

  const doSwap = (from: number, to: number) => {
    if (from !== to) room.swapSeats(from, to)
    setDragFrom(null)
    setTapFrom(null)
  }

  const onTapSeat = (seat: number) => {
    if (!lobby.isHost) return
    if (tapFrom === null) setTapFrom(seat)
    else doSwap(tapFrom, seat)
  }

  const bySeat = (n: number) => lobby.seats.find((s) => s.seat === n)!

  const SeatCard = ({ seatNo }: { seatNo: number }) => {
    const s = bySeat(seatNo)
    const draggable = lobby.isHost
    return (
      <div
        className={[
          'lobby-seat',
          `t${s.team}`,
          s.kind === 'empty' ? 'empty' : '',
          draggable ? 'draggable' : '',
          tapFrom === s.seat ? 'picked' : '',
          dragFrom !== null && dragFrom !== s.seat ? 'droppable' : '',
        ].join(' ')}
        draggable={draggable}
        onDragStart={(e) => {
          setDragFrom(s.seat)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={() => setDragFrom(null)}
        onDragOver={(e) => {
          if (dragFrom !== null) e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (dragFrom !== null) doSwap(dragFrom, s.seat)
        }}
        onClick={() => onTapSeat(s.seat)}
      >
        {draggable && <span className="drag-grip" aria-hidden>⋮⋮</span>}
        <span className="avatar-badge">{s.kind === 'human' ? (s.name || '?').charAt(0).toUpperCase() : '🤖'}</span>
        <span>
          <b>{s.kind === 'human' ? s.name : 'Bot'}</b>
          {s.you && <span className="badge" style={{ marginLeft: 6 }}>you</span>}
        </span>
        <span className="role">{s.kind === 'human' ? 'player' : 'fills on start'}</span>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="hero fade-up" style={{ paddingBottom: '0.5rem' }}>
        <h1>Lobby</h1>
        <p>Share this code so friends can join:</p>
        <div className="copy-code">
          <span className="room-code" onClick={onCodeTap}>{lobby.code}</span>
          <button className="ghost" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
      </div>

      <div className="panel fade-up">
        <h3>Teams</h3>
        <div className="team-cols">
          <div className="team-col">
            <div className="team-head a">Team A</div>
            <SeatCard seatNo={0} />
            <SeatCard seatNo={2} />
          </div>
          <div className="team-vs">vs</div>
          <div className="team-col">
            <div className="team-head b">Team B</div>
            <SeatCard seatNo={1} />
            <SeatCard seatNo={3} />
          </div>
        </div>
        <p className="kbd-hint">
          {lobby.isHost
            ? 'Drag a name onto another seat to swap (or tap one, then the other). Two humans on the same team play together vs two bots.'
            : 'The host arranges the teams.'}{' '}
          {lobby.humanCount} human{lobby.humanCount === 1 ? '' : 's'} so far — empty seats become bots
          when the game starts.
        </p>
      </div>

      {lobby.isHost ? (
        <div className="panel fade-up" style={{ marginTop: '1rem' }}>
          <h3>Host controls</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.88rem' }}>Bot difficulty for the empty seats:</p>
          <DifficultyPicker value={lobby.difficulty} onChange={room.setDifficulty} />
          <p style={{ color: 'var(--muted)', margin: '1rem 0 0.4rem', fontSize: '0.88rem' }}>Turn timer (per player):</p>
          <TurnTimerPicker value={lobby.turnSeconds} onChange={room.setTurnTimer} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 14 }}>
            <button className="primary" onClick={room.start}>Start game →</button>
            <button className="ghost" onClick={room.leave}>Leave</button>
          </div>
        </div>
      ) : (
        <div className="panel fade-up" style={{ marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            Waiting for the host to start the game… (bots: <b>{lobby.difficulty}</b>, turn timer:{' '}
            <b>{lobby.turnSeconds === 0 ? 'off' : `${lobby.turnSeconds}s`}</b>)
          </p>
          <button className="ghost" style={{ marginTop: 10 }} onClick={room.leave}>Leave</button>
        </div>
      )}
    </div>
  )
}
