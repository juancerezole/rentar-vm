import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import authRoutes from './routes/auth.js';
import propertiesRoutes from './routes/properties.js';
import miscRoutes from './routes/misc.js';
import { errorHandler } from './middleware/error.js';
import { db, pool } from './db/index.js';
import { initDb } from './db/seed.js';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Detrás de un proxy (Render, Vercel, Cloudflare) Express necesita confiar
// en X-Forwarded-* para que req.ip refleje al cliente real. Sin esto,
// express-rate-limit cuenta todos los requests bajo la IP del balancer.
app.set('trust proxy', config.trustProxy);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.clientOrigin }));
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

app.use(errorHandler);

async function main() {
  logger.info('aplicando migraciones...');
  await migrate(db, { migrationsFolder: path.join(__dirname, 'db/migrations') });
  logger.info('migraciones OK');

  await initDb();

  const server = app.listen(config.port, () =>
    logger.info(`Rentar API escuchando en :${config.port}`)
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
