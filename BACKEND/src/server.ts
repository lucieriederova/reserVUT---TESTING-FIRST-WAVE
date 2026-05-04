import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import roomPolicyRoutes from './routes/roomPolicyRoutes.js';

const app = express();

/**
 * PORT CONFIGURATION
 * Railway dynamicky přiděluje port přes proměnnou prostředí. 
 * Pokud není nastavena, fallback na 5001 pro lokální vývoj.
 */
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5001;

/**
 * DYNAMIC CORS CONFIGURATION
 * Řeší problémy s "No 'Access-Control-Allow-Origin'" pro Vercel preview linky.
 */
const allowedOrigins: (string | RegExp)[] = [
  'https://reser-vut-testing-first-wave.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(domain =>
      typeof domain === 'string' ? domain === origin : domain.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS - VUTFP Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * EXPLICIT PRE-FLIGHT HANDLER
 * Zajišťuje, že OPTIONS požadavky (např. před POSTem na login) 
 * dostanou okamžitou odpověď 200 OK.
 */
app.options('*', cors());

/**
 * MIDDLEWARE & ROUTES
 */
app.use(express.json());

// API Entry points dle Application Modelu
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms', roomPolicyRoutes);

/**
 * HEALTH CHECK
 * Užitečné pro Railway monitoring
 */
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/**
 * ERROR HANDLING
 */
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('🔴 Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * SERVER STARTUP
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  --------------------------------------------------
  🚀 reserVUT backend running on port: ${PORT}
  🔗 API URL: http://0.0.0.0:${PORT}/api
  🛡️  CORS: Enabled for Vercel & Localhost
  📂 DB Status: ${process.env.DATABASE_URL ? '✅ Connected' : '⚠️  In-Memory'}
  --------------------------------------------------
  `);
});

export default app;