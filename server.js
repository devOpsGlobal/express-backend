import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bizlift';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.data.userId = userId;
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  socket.on('message:send', ({ recipientId, senderId, message }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    const payload = { senderId, message, timestamp: new Date().toISOString() };
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:receive', payload);
    }
    socket.emit('message:delivered', { ...payload, delivered: !!recipientSocketId });
  });

  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('room:user_joined', { userId: socket.data.userId, roomId });
  });

  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:user_left', { userId: socket.data.userId, roomId });
  });

  socket.on('room:message', ({ roomId, senderId, message }) => {
    io.to(roomId).emit('room:message_received', {
      senderId,
      message,
      roomId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('typing:start', ({ recipientId, senderId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) io.to(recipientSocketId).emit('typing:start', { senderId });
  });

  socket.on('typing:stop', ({ recipientId, senderId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) io.to(recipientSocketId).emit('typing:stop', { senderId });
  });

  socket.on('ping:test', (data) => {
    socket.emit('pong:test', {
      received: data,
      serverTime: new Date().toISOString(),
      socketId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      onlineUsers.delete(socket.data.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
