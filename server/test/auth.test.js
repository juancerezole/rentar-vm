import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { pool } from '../db/index.js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../db/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Requiere TEST_DATABASE_URL configurado en el entorno
beforeAll(async () => {
  await migrate(db, { migrationsFolder: path.join(__dirname, '../db/migrations') });
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/health', () => {
  it('responde ok con conexión a la base de datos', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  it('rechaza emails inválidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test', email: 'notanemail', password: '12345678',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rechaza contraseñas cortas', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test', email: 'test@test.com', password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/);
  });

  it('rechaza roles inválidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test', email: 'test@test.com', password: '12345678', rol: 'admin',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('rechaza credenciales inválidas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('rechaza email inválido', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notanemail', password: 'anypassword',
    });
    expect(res.status).toBe(400);
  });
});
