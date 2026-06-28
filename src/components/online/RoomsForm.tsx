import { useState } from 'react'
import { UseRoom } from '../../net/useRoom'
import { Difficulty } from '../../net/protocol'
import { DifficultyPicker } from '../GameSetup'

export function RoomsForm({ room }: { room: UseRoom }) {
  const [name, setName] = useState(() => localStorage.getItem('guandan.name') ?? '')
  const [code, setCode] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('master')

  const remember = (n: string) => {
    setName(n)
    localStorage.setItem('guandan.name', n)
  }

  const canCreate = name.trim().length > 0
  const canJoin = canCreate && code.trim().length >= 3

  return (
    <div className="container">
      <div className="hero" style={{ paddingBottom: '0.5rem' }}>
        <h1>Play online</h1>
        <p>
          Create a room and share the code, or join a friend's. Start with 1–4 people; any empty
          seats are filled by bots. With two players, you're placed on opposite teams.
        </p>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="panel">
          <h3>Your name</h3>
          <input
            className="text-input"
            placeholder="e.g. Alex"
            value={name}
            maxLength={16}
            onChange={(e) => remember(e.target.value)}
          />
          {room.error && <div className="drill-status no" style={{ marginTop: 8 }}>{room.error}</div>}
        </div>

        <div className="panel">
          <h3>Create a room</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.88rem' }}>You'll be the host. Pick the bot difficulty for filled seats:</p>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <button className="primary" style={{ marginTop: 12 }} disabled={!canCreate} onClick={() => room.create(name.trim(), difficulty)}>
            Create room →
          </button>
        </div>

        <div className="panel">
          <h3>Join a room</h3>
          <input
            className="text-input"
            placeholder="Room code (e.g. K7QP)"
            value={code}
            maxLength={4}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
          />
          <button className="primary" style={{ marginTop: 12 }} disabled={!canJoin} onClick={() => room.join(code.trim(), name.trim())}>
            Join room →
          </button>
        </div>
      </div>

      {room.status === 'connecting' && <p style={{ color: 'var(--muted)' }}>Connecting…</p>}
      {room.status === 'disconnected' && (
        <p className="drill-status no">Disconnected from the server. Make sure the game server is running (`npm run server`).</p>
      )}
    </div>
  )
}
