/**
 * Nousad Meet — Signaling Server
 *
 * BUG FIX (chat duplication):
 *   room:message is now broadcast to the ENTIRE room (io.to) including
 *   the sender — so the client NEVER adds the message locally.
 *   This is the canonical fix; the client only appends on room:message_received.
 */

import express  from 'express'
import http     from 'http'
import cors     from 'cors'
import { Server } from 'socket.io'

const app    = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => res.json({ status: 'Nousad Meet — server OK' }))

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*' },
})

/**
 * rooms: Map<roomId, Map<socketId, { id: string, name: string }>>
 */
const rooms = new Map()

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map())
  return rooms.get(roomId)
}

io.on('connection', socket => {
  console.log(`[connect]    ${socket.id}`)

  // ── JOIN ────────────────────────────────────────────────────────────────────
  socket.on('room:join', ({ roomId, name }) => {
    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.name   = name

    const room = getRoom(roomId)
    room.set(socket.id, { id: socket.id, name })

    // Send existing participants list to the new joiner (excludes self)
    const existing = [...room.values()].filter(p => p.id !== socket.id)
    socket.emit('room:participants', existing)

    // Notify everyone else that this user joined
    socket.to(roomId).emit('room:user_joined', { userId: socket.id, name })

    console.log(`[join]       ${name} → room:${roomId} (${room.size} total)`)
  })

  // ── WEBRTC SIGNALING ────────────────────────────────────────────────────────
  socket.on('webrtc:offer', ({ to, offer }) => {
    socket.to(to).emit('webrtc:offer', {
      from:     socket.id,
      fromName: socket.data.name,
      offer,
    })
  })

  socket.on('webrtc:answer', ({ to, answer }) => {
    socket.to(to).emit('webrtc:answer', { from: socket.id, answer })
  })

  socket.on('webrtc:ice', ({ to, candidate }) => {
    socket.to(to).emit('webrtc:ice', { from: socket.id, candidate })
  })

  // ── CHAT (FIX) ──────────────────────────────────────────────────────────────
  // Broadcast to ALL sockets in room INCLUDING sender (io.to, not socket.to).
  // The client appends the message ONLY on this event — never locally.
  // This eliminates the double-message bug.
  socket.on('room:message', ({ roomId, senderId, senderName, message, timestamp }) => {
    io.to(roomId).emit('room:message_received', {
      senderId,
      senderName,
      message,
      timestamp,
    })
  })

  // ── LEAVE (explicit) ────────────────────────────────────────────────────────
  socket.on('room:leave', roomId => cleanup(socket, roomId))

  // ── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomId } = socket.data
    if (roomId) cleanup(socket, roomId)
    console.log(`[disconnect] ${socket.id}`)
  })
})

function cleanup(socket, roomId) {
  socket.to(roomId).emit('room:user_left', { userId: socket.id })
  const room = rooms.get(roomId)
  if (room) {
    room.delete(socket.id)
    if (room.size === 0) {
      rooms.delete(roomId)
      console.log(`[room:empty] ${roomId} removed`)
    }
  }
  socket.leave(roomId)
}

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000
server.listen(PORT, () => console.log(`🚀  Nousad Meet server → http://localhost:${PORT}`))
