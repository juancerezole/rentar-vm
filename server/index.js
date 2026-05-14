import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import propertiesRoutes from './routes/properties.js';
import miscRoutes from './routes/misc.js';
import { initDb } from './db/seed.js';

const app    = express();
const PORT   = process.env.PORT   || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// CLIENT_ORIGIN en Railway = URL de Vercel (ej: https://rentar.vercel.app)
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api',            miscRoutes);

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'error interno' });
});

async function main() {
  await initDb();
  app.listen(PORT, () =>
    console.log(`[server] Rentar ${isProd ? '(prod)' : 'API'} escuchando en :${PORT}`)
  );
}

main().catch(err => {
  console.error('[server] error al iniciar:', err);
  process.exit(1);
});
