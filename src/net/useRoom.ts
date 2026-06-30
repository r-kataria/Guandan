// net/useRoom.ts — client hook owning the WebSocket connection to the game server and exposing
// room/lobby/game state plus the actions a player can take.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ClientMsg,
  ServerMsg,
  LobbyView,
  PlayerView,
  WS_PATH,
  Difficulty,
} from './protocol'

export type RoomStatus = 'idle' | 'connecting' | 'lobby' | 'playing' | 'disconnected'

export interface UseRoom {
  status: RoomStatus
  code: string | null
  youId: string | null
  lobby: LobbyView | null
  view: PlayerView | null
  error: string | null
  create: (name: string, difficulty: Difficulty) => void
  join: (code: string, name: string) => void
  setDifficulty: (d: Difficulty) => void
  start: () => void
  rematch: () => void
  play: (cardIds: string[]) => void
  pass: () => void
  leave: () => void
  clearError: () => void
  rig: (on: boolean) => void
}

function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}${WS_PATH}`
}

export function useRoom(): UseRoom {
  const wsRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<RoomStatus>('idle')
  const [code, setCode] = useState<string | null>(null)
  const [youId, setYouId] = useState<string | null>(null)
  const [lobby, setLobby] = useState<LobbyView | null>(null)
  const [view, setView] = useState<PlayerView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handle = useCallback((msg: ServerMsg) => {
    switch (msg.t) {
      case 'joined':
        setCode(msg.code)
        setYouId(msg.youId)
        setError(null)
        break
      case 'lobby':
        setLobby(msg.view)
        setView(null)
        setStatus('lobby')
        break
      case 'state':
        setView(msg.view)
        setLobby(null)
        setStatus('playing')
        break
      case 'error':
        setError(msg.message)
        break
      case 'kicked':
        setError(msg.reason)
        setStatus('disconnected')
        break
    }
  }, [])

  const ensureSocket = useCallback(
    (onOpen: () => void) => {
      const existing = wsRef.current
      if (existing && existing.readyState === WebSocket.OPEN) {
        onOpen()
        return
      }
      if (existing && existing.readyState === WebSocket.CONNECTING) {
        existing.addEventListener('open', onOpen, { once: true })
        return
      }
      setStatus('connecting')
      const ws = new WebSocket(wsUrl())
      wsRef.current = ws
      ws.addEventListener('open', onOpen, { once: true })
      ws.onmessage = (e) => handle(JSON.parse(e.data) as ServerMsg)
      ws.onclose = () => setStatus((s) => (s === 'idle' ? s : 'disconnected'))
      ws.onerror = () => setError('Connection error. Is the game server running?')
    },
    [handle],
  )

  const sendWhenOpen = useCallback(
    (msg: ClientMsg) => ensureSocket(() => wsRef.current?.send(JSON.stringify(msg))),
    [ensureSocket],
  )

  const send = useCallback((msg: ClientMsg) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }, [])

  const create = useCallback((name: string, difficulty: Difficulty) => sendWhenOpen({ t: 'create', name, difficulty }), [sendWhenOpen])
  const join = useCallback((c: string, name: string) => sendWhenOpen({ t: 'join', code: c, name }), [sendWhenOpen])
  const setDifficulty = useCallback((d: Difficulty) => send({ t: 'setDifficulty', difficulty: d }), [send])
  const start = useCallback(() => send({ t: 'start' }), [send])
  const rematch = useCallback(() => send({ t: 'rematch' }), [send])
  const play = useCallback((cardIds: string[]) => send({ t: 'play', cardIds }), [send])
  const pass = useCallback(() => send({ t: 'pass' }), [send])
  const rig = useCallback((on: boolean) => send({ t: 'rig', on }), [send])
  const clearError = useCallback(() => setError(null), [])

  const leave = useCallback(() => {
    send({ t: 'leave' })
    wsRef.current?.close()
    wsRef.current = null
    setStatus('idle')
    setCode(null)
    setLobby(null)
    setView(null)
  }, [send])

  // Close the socket on unmount.
  useEffect(() => () => wsRef.current?.close(), [])

  return {
    status, code, youId, lobby, view, error,
    create, join, setDifficulty, start, rematch, play, pass, leave, clearError, rig,
  }
}
