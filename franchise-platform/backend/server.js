const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Strip trailing slash from CLIENT_URL so origin comparison always matches.
// e.g. "https://ai-franchise-connector.vercel.app/" → "https://ai-franchise-connector.vercel.app"
const rawClientUrl = (process.env.CLIENT_URL || '').replace(/\/+$/, '');

const allowedOrigins = [
  rawClientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Handle preflight OPTIONS for ALL routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
app.use('/api/', limiter);

// AI routes get stricter limit (Grok API calls)
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: 'AI rate limit exceeded' });
app.use('/api/ai/', aiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/franchises', require('./routes/franchises'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/seeker', require('./routes/seeker'));
app.use('/api/owner', require('./routes/owner'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
