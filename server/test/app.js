// Instancia de Express sin el arranque (sin listen ni migrate)
// Importada por los tests para usar con supertest
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from '../config.js';
import authRoutes from '../routes/auth.js';
import propertiesRoutes from '../routes/properties/index.js';
import miscRoutes from '../routes/misc.js';
import { errorHandler } from '../middleware/error.js';
import { pool } from '../db/index.js';

export const app = express();
app.set('trust proxy', config.trustProxy);
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'ok' });
  } catch {
    res.status(503).json({ ok: false, db: 'error' });
  }
});

app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api',            miscRoutes);

app.use(errorHandler);
