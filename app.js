import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import serviceRoutes from './routes/service.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg and .png images are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload/query', upload.single('image'), (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'message field is required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'image file is required (jpg or png only)' });
  }

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

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
