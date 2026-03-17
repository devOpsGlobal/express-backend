import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mrnoukhan7377:MyDB123@mydb.eymfa.mongodb.net/test';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

const ServiceSchema = new mongoose.Schema({
  serviceType: { type: String, required: true },
  details: { type: Object },
  status: { type: String, default: 'pending' },
}, { timestamps: true });
const Service = mongoose.model('Service', ServiceSchema);

const MessageSchema = new mongoose.Schema({
  senderId: String,
  recipientId: String,
  message: String,
  roomId: String,
}, { timestamps: true });
const Message = mongoose.model('Message', MessageSchema);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});
const fileFilter = (_req, file, cb) => {
  ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only .jpg and .png allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.post('/api/upload/query', upload.single('image'), (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'message field is required' });
  if (!req.file) return res.status(400).json({ message: 'image is required (jpg or png only)' });
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(200).json({
    message: 'Query received',
    data: {
      userMessage: message,
      image: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
      },
    },
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ message: 'Registered successfully', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/services/business-name', async (req, res) => {
  try {
    const { keywords } = req.body;
    const base = keywords ? keywords.split(',').map((k) => k.trim()) : ['Biz'];
    const suffixes = ['Hub', 'Co', 'Lab', 'Pro', 'Spark', 'Edge', 'Nest', 'Works'];
    const names = base
      .flatMap((k) => suffixes.slice(0, 4).map((s) => `${k.charAt(0).toUpperCase() + k.slice(1)}${s}`))
      .slice(0, 8);
    res.json({ names });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/services/logo', async (req, res) => {
  try {
    await Service.create({ serviceType: 'Logo Creation', details: req.body });
    res.status(201).json({ message: 'Logo request submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/services/website', async (req, res) => {
  try {
    await Service.create({ serviceType: 'Website Development', details: req.body });
    res.status(201).json({ message: 'Website request submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/services/marketing', async (req, res) => {
  try {
    await Service.create({ serviceType: 'Digital Marketing', details: req.body });
    res.status(201).json({ message: 'Marketing request submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/services/all', async (_req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

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
    if (recipientSocketId) io.to(recipientSocketId).emit('message:receive', payload);
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
      senderId, message, roomId, timestamp: new Date().toISOString(),
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

mongoose
  .connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
