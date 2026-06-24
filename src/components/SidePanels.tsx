import { useState } from 'react'
import { LogEntry } from '../game/useGuandan'
import { SEAT_NAMES } from './Table'

export function CoachPanel({ tip }: { tip: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="panel coach">
      <h3>
        Coach{' '}
        <button className="ghost" style={{ float: 'right', padding: '0.15rem 0.5rem', fontSize: '0.78rem' }} onClick={() => setOpen((o) => !o)}>
          {open ? 'hide' : 'show'}
        </button>
      </h3>
      {open && <div className="tip">{tip}</div>}
    </div>
  )
}

export function LogPanel({ log }: { log: LogEntry[] }) {
  return (
    <div className="panel">
      <h3>Play log</h3>
      <div className="log">
        {log.length === 0 && <div className="row">Game starting…</div>}
        {log.map((e, i) => (
          <div className={`row ${e.seat === 0 ? 'me' : ''}`} key={i}>
            {e.seat === 0 ? '' : `${SEAT_NAMES[e.seat]} `}
            {e.text}
          </div>
        ))}
      </div>
    </div>
  )
}
