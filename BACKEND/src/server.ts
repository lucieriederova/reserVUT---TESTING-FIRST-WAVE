import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import roomPolicyRoutes from './routes/roomPolicyRoutes.js';
 
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
 
// ── Middleware ────────────────────────────────────────────────────────────────
 
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.includes('vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
 
app.use(express.json());
 
// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
 
// ── Routes ───────────────────────────────────────────────────────────────────
 
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms', roomPolicyRoutes);
 
// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
 
// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
 
// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
 
// ── Start ────────────────────────────────────────────────────────────────────
 
app.listen(PORT, () => {
  console.log(`🚀 reserVUT backend running on http://localhost:${PORT}`);
  console.log(`   FRONTEND_URL: ${FRONTEND_URL}`);
  console.log(`   DB: ${process.env.DATABASE_URL ? '✅ configured' : '⚠️  not set — using in-memory store'}`);
});
 
export default app;
