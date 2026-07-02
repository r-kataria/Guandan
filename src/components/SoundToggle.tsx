import { useState } from 'react'
import { isMuted, setMuted, sfx } from '../sound'

export function SoundToggle() {
  const [muted, set] = useState(isMuted())
  const toggle = () => {
    const next = !muted
    setMuted(next)
    set(next)
    if (!next) sfx('card') // audible confirmation when unmuting
  }
  return (
    <button
      className="ghost sound-toggle"
      onClick={toggle}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      aria-pressed={!muted}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
