import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import roomPolicyRoutes from './routes/roomPolicyRoutes.js';
 
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5001;
 
// ── CORS — manual headers ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
 
app.use(cors({ origin: '*' }));
app.use(express.json());
 
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
  console.log(`   DB: ${process.env.DATABASE_URL ? '✅ configured' : '⚠️  not set — using in-memory store'}`);
});
 
export default app;