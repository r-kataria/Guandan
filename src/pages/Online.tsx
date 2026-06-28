import { useEffect } from 'react'
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

export function Online() {
  const room = useRoom()

  return (
    <>
      {room.view ? <NetBoard room={room} /> : room.lobby ? <Lobby room={room} /> : <RoomsForm room={room} />}
      {/* Transient errors during play surface as a toast (the rooms form shows its own inline). */}
      {room.view && room.error && <Toast key={room.error} message={room.error} onDone={room.clearError} />}
    </>
  )
}
