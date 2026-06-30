import { useCallback, useEffect, useRef, useState } from 'react'
import { useRoom } from '../net/useRoom'
import { RoomsForm } from '../components/online/RoomsForm'
import { Lobby } from '../components/online/Lobby'
import { NetBoard } from '../components/online/NetBoard'

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [message, onDone])
  return (
    <div className="toast-wrap">
      <div className="toast">{message}</div>
    </div>
  )
}

// --- hidden host advantage trigger ---------------------------------------------------------
// Two ways in (host only): tap the room code 7× quickly, or enter the Konami code.

function useSecretTaps(onTrigger: () => void, taps = 7, windowMs = 2500) {
  const times = useRef<number[]>([])
  return useCallback(() => {
    const now = Date.now()
    times.current = times.current.filter((t) => now - t < windowMs)
    times.current.push(now)
    if (times.current.length >= taps) {
      times.current = []
      onTrigger()
    }
  }, [onTrigger, taps, windowMs])
}

const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']

function useKonami(onTrigger: () => void, enabled: boolean) {
  const idx = useRef(0)
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === KONAMI[idx.current]) {
        idx.current += 1
        if (idx.current === KONAMI.length) {
          idx.current = 0
          onTrigger()
        }
      } else {
        idx.current = key === KONAMI[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTrigger, enabled])
}

export function Online() {
  const room = useRoom()
  const [, setRigged] = useState(false)
  const [cheatMsg, setCheatMsg] = useState<string | null>(null)
  const isHost = room.lobby?.isHost ?? room.view?.isHost ?? false

  const toggleRig = useCallback(() => {
    if (!isHost) return
    setRigged((prev) => {
      const next = !prev
      room.rig(next)
      setCheatMsg(next ? '😈 House edge enabled' : 'House edge off')
      window.setTimeout(() => setCheatMsg(null), 1800)
      return next
    })
  }, [isHost, room])

  const onCodeTap = useSecretTaps(toggleRig)
  useKonami(toggleRig, isHost)

  return (
    <>
      {room.view ? (
        <NetBoard room={room} onCodeTap={onCodeTap} />
      ) : room.lobby ? (
        <Lobby room={room} onCodeTap={onCodeTap} />
      ) : (
        <RoomsForm room={room} />
      )}
      {room.view && room.error && <Toast key={room.error} message={room.error} onDone={room.clearError} />}
      {cheatMsg && (
        <div className="toast-wrap">
          <div className="toast cheat">{cheatMsg}</div>
        </div>
      )}
    </>
  )
}
