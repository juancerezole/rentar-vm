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
  res.status(500).json({ error: err.message || 'error interno' });
});

async function main() {
  logger.info('aplicando migraciones...');
  await migrate(db, { migrationsFolder: path.join(__dirname, 'db/migrations') });
  logger.info('migraciones OK');

  // Garantiza property_images aunque la migración haya fallado silenciosamente
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "property_images" (
      "id" serial PRIMARY KEY NOT NULL,
      "property_id" integer NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
      "url" text NOT NULL,
      "public_id" text NOT NULL,
      "orden" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_property_images_property_id" ON "property_images" ("property_id")`);
  logger.info('[db] property_images OK');

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
