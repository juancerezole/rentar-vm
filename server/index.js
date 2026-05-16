import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import authRoutes from './routes/auth.js';
import propertiesRoutes from './routes/properties.js';
import miscRoutes from './routes/misc.js';
import { db, pool } from './db/index.js';
import { initDb } from './db/seed.js';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app    = express();
const PORT   = process.env.PORT   || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '2mb' }));

// Health check con ping real a la base de datos
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, ts: Date.now(), db: 'ok' });
  } catch {
    res.status(503).json({ ok: false, ts: Date.now(), db: 'error' });
  }
});

app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api',            miscRoutes);

app.use((err, _req, res, _next) => {
  logger.error(err, 'error interno');
  res.status(500).json({ error: 'error interno' });
});

async function main() {
  logger.info('aplicando migraciones...');
  await migrate(db, { migrationsFolder: path.join(__dirname, 'db/migrations') });
  logger.info('migraciones OK');

  await initDb();

  const server = app.listen(PORT, () =>
    logger.info(`Rentar API escuchando en :${PORT}`)
  );

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM recibido, cerrando...');
    server.close(async () => {
      await pool.end();
      logger.info('cerrado limpiamente');
      process.exit(0);
    });
  });
}

main().catch(err => {
  logger.error(err, 'error al iniciar el servidor');
  process.exit(1);
});
