import { useRoom } from '../net/useRoom'
import { RoomsForm } from '../components/online/RoomsForm'
import { Lobby } from '../components/online/Lobby'
import { NetBoard } from '../components/online/NetBoard'

export function Online() {
  const room = useRoom()

  if (room.view) return <NetBoard room={room} />
  if (room.lobby) return <Lobby room={room} />
  return <RoomsForm room={room} />
}
