import { useState } from 'react'
import { UseRoom } from '../../net/useRoom'
import { DifficultyPicker } from '../GameSetup'

export function Lobby({ room }: { room: UseRoom }) {
  const lobby = room.lobby!
  const [copied, setCopied] = useState(false)
  const teamName = (t: number) => (t === 0 ? 'Team A' : 'Team B')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lobby.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the code is shown on screen anyway */
    }
  }

  return (
    <div className="container">
      <div className="hero fade-up" style={{ paddingBottom: '0.5rem' }}>
        <h1>Lobby</h1>
        <p>Share this code so friends can join:</p>
        <div className="copy-code">
          <span className="room-code">{lobby.code}</span>
          <button className="ghost" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
      </div>

      <div className="panel fade-up">
        <h3>Seats &amp; teams</h3>
        <div className="lobby-seats">
          {lobby.seats.map((s) => (
            <div key={s.seat} className={`lobby-seat t${s.team} ${s.kind === 'empty' ? 'empty' : ''}`}>
              <span className="avatar-badge">{s.kind === 'human' ? (s.name || '?').charAt(0).toUpperCase() : '🤖'}</span>
              <span>
                <b>{s.kind === 'human' ? s.name : 'Bot'}</b>
                {s.you && <span className="badge" style={{ marginLeft: 6 }}>you</span>}
              </span>
              <span className="role">
                {teamName(s.team)}
                <br />
                {s.kind === 'human' ? 'player' : 'fills on start'}
              </span>
            </div>
          ))}
        </div>
        <p className="kbd-hint">
          Partners sit opposite (seats across the table share a team). {lobby.humanCount} human
          {lobby.humanCount === 1 ? '' : 's'} so far — the rest become bots when the game starts.
        </p>
      </div>

      {lobby.isHost ? (
        <div className="panel fade-up" style={{ marginTop: '1rem' }}>
          <h3>Host controls</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.88rem' }}>Bot difficulty for the empty seats:</p>
          <DifficultyPicker value={lobby.difficulty} onChange={room.setDifficulty} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 14 }}>
            <button className="primary" onClick={room.start}>Start game →</button>
            <button className="ghost" onClick={room.leave}>Leave</button>
          </div>
        </div>
      ) : (
        <div className="panel fade-up" style={{ marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            Waiting for the host to start the game… (bot difficulty: <b>{lobby.difficulty}</b>)
          </p>
          <button className="ghost" style={{ marginTop: 10 }} onClick={room.leave}>Leave</button>
        </div>
      )}
    </div>
  )
}
