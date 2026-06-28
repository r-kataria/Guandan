// server/index.ts — thin WebSocket transport around the testable GameRoom core (src/net/room.ts).
// It maps sockets to client ids, routes messages to the room, drives bot/hand timers, and
// broadcasts each client its own redacted view. One HTTP server also serves the built client.

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, normalize, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'

import { GameRoom } from '../src/net/room'
import { ClientMsg, ServerMsg, WS_PATH, DEFAULT_SERVER_PORT } from '../src/net/protocol'

const BOT_DELAY_MS = Number(process.env.GD_BOT_DELAY ?? 900)
const HAND_END_DELAY_MS = Number(process.env.GD_HAND_DELAY ?? 4500)

interface ServerRoom {
  room: GameRoom
  sockets: Map<string, WebSocket>
  botTimer: ReturnType<typeof setTimeout> | null
  handTimer: ReturnType<typeof setTimeout> | null
}

const rooms = new Map<string, ServerRoom>()
const clientRoom = new Map<string, string>()
let nextClientId = 1

function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
}

function genCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  } while (rooms.has(code))
  return code
}

function broadcast(sr: ServerRoom) {
  const { room } = sr
  for (const id of room.humanIds()) {
    const ws = sr.sockets.get(id)
    if (!ws) continue
    if (room.isInGame) {
      const view = room.playerView(id)
      if (view) send(ws, { t: 'state', view })
    } else {
      send(ws, { t: 'lobby', view: room.lobbyView(id) })
    }
  }
}

function clearTimers(sr: ServerRoom) {
  if (sr.botTimer) clearTimeout(sr.botTimer)
  if (sr.handTimer) clearTimeout(sr.handTimer)
  sr.botTimer = null
  sr.handTimer = null
}

/** Drive bots and auto-advance hands. */
function schedule(sr: ServerRoom) {
  clearTimers(sr)
  const { room } = sr
  if (!room.isInGame) return
  if (room.pendingBotSeat() !== null) {
    sr.botTimer = setTimeout(() => {
      if (room.stepBot()) {
        broadcast(sr)
        schedule(sr)
      }
    }, BOT_DELAY_MS)
  } else if (room.needsHandAdvance()) {
    sr.handTimer = setTimeout(() => {
      room.advanceHand()
      broadcast(sr)
      schedule(sr)
    }, HAND_END_DELAY_MS)
  }
}

function onMessage(clientId: string, ws: WebSocket, raw: string) {
  let msg: ClientMsg
  try {
    msg = JSON.parse(raw)
  } catch {
    return
  }

  if (msg.t === 'create') {
    const code = genCode()
    const room = new GameRoom(code, msg.difficulty ?? 'master')
    const sr: ServerRoom = { room, sockets: new Map(), botTimer: null, handTimer: null }
    room.addHuman(clientId, msg.name, true)
    sr.sockets.set(clientId, ws)
    rooms.set(code, sr)
    clientRoom.set(clientId, code)
    send(ws, { t: 'joined', code, youId: clientId })
    broadcast(sr)
    return
  }

  if (msg.t === 'join') {
    const sr = rooms.get(msg.code.toUpperCase())
    if (!sr) return send(ws, { t: 'error', message: 'Room not found.' })
    const res = sr.room.addHuman(clientId, msg.name)
    if (typeof res === 'string') return send(ws, { t: 'error', message: res })
    sr.sockets.set(clientId, ws)
    clientRoom.set(clientId, sr.room.code)
    send(ws, { t: 'joined', code: sr.room.code, youId: clientId })
    broadcast(sr)
    return
  }

  const code = clientRoom.get(clientId)
  const sr = code ? rooms.get(code) : undefined
  if (!sr) return
  const { room } = sr

  switch (msg.t) {
    case 'setDifficulty':
      room.setDifficulty(clientId, msg.difficulty)
      broadcast(sr)
      break
    case 'start':
      if (room.start(clientId)) {
        broadcast(sr)
        schedule(sr)
      }
      break
    case 'rematch':
      if (room.start(clientId)) {
        broadcast(sr)
        schedule(sr)
      }
      break
    case 'play': {
      const err = room.play(clientId, msg.cardIds)
      if (err) send(ws, { t: 'error', message: err })
      else {
        broadcast(sr)
        schedule(sr)
      }
      break
    }
    case 'pass': {
      const err = room.pass(clientId)
      if (err) send(ws, { t: 'error', message: err })
      else {
        broadcast(sr)
        schedule(sr)
      }
      break
    }
    case 'leave':
      handleLeave(clientId)
      break
  }
}

function handleLeave(clientId: string) {
  const code = clientRoom.get(clientId)
  clientRoom.delete(clientId)
  if (!code) return
  const sr = rooms.get(code)
  if (!sr) return
  sr.sockets.delete(clientId)
  sr.room.disconnect(clientId)
  if (sr.room.humanIds().length === 0 && !sr.room.isInGame) {
    clearTimers(sr)
    rooms.delete(code)
    return
  }
  broadcast(sr)
  schedule(sr)
}

// ---- HTTP + static client ----

const __dirname = fileURLToPath(new URL('.', import.meta.url))
// Where the built client lives. Defaults to ../dist relative to this file (works for both
// `tsx server/index.ts` -> server/ and the bundled dist-server/index.mjs -> dist-server/).
const DIST = process.env.CLIENT_DIR ? join(process.env.CLIENT_DIR) : join(__dirname, '..', 'dist')
const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png',
}

const httpServer = createServer(async (req, res) => {
  if (req.url === '/healthz') return void res.writeHead(200).end('ok')
  if (!existsSync(DIST)) {
    res.writeHead(200, { 'content-type': 'text/plain' })
    return void res.end('Guandan multiplayer server running. Run `npm run build` to serve the client here.')
  }
  const urlPath = (req.url || '/').split('?')[0]
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = join(DIST, safe === '/' ? 'index.html' : safe)
  if (!existsSync(filePath) || !filePath.startsWith(DIST)) filePath = join(DIST, 'index.html')
  try {
    const data = await readFile(filePath)
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404).end('Not found')
  }
})

const wss = new WebSocketServer({ noServer: true })
httpServer.on('upgrade', (req, socket, head) => {
  if ((req.url || '').split('?')[0] === WS_PATH) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws))
  } else {
    socket.destroy()
  }
})
wss.on('connection', (ws: WebSocket) => {
  const clientId = `c${nextClientId++}`
  ws.on('message', (data) => onMessage(clientId, ws, data.toString()))
  ws.on('close', () => handleLeave(clientId))
  ws.on('error', () => handleLeave(clientId))
})

const PORT = Number(process.env.PORT) || DEFAULT_SERVER_PORT
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Guandan server listening on http://localhost:${PORT} (ws at ${WS_PATH})`)
})
