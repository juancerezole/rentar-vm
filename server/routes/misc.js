import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db, pool } from '../db/index.js';
import { banners, profesionales, properties, users, ciudades } from '../db/schema.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// ── Barrios ──────────────────────────────────────────────────────────────────
// Raw SQL: JOIN con COUNT agregado
router.get('/barrios', wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT b.*, COUNT(p.id)::int AS cantidad
    FROM barrios b
    LEFT JOIN properties p ON p.barrio = b.nombre
    GROUP BY b.id
    ORDER BY b.nombre
  `);
  res.json({ barrios: rows });
}));

// Raw SQL: múltiples agregados (AVG, MIN, MAX, COALESCE) + cálculo de delta %
router.get('/barrios/heatmap', wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      b.id,
      b.nombre,
      b.precio_mes_anterior,
      COUNT(p.id)::int                          AS cantidad,
      COALESCE(ROUND(AVG(p.precio))::int, 0)   AS precio_promedio,
      COALESCE(MIN(p.precio), 0)               AS precio_min,
      COALESCE(MAX(p.precio), 0)               AS precio_max
    FROM barrios b
    LEFT JOIN properties p
      ON p.barrio = b.nombre
     AND p.tipo IN ('departamento','casa','duplex')
    GROUP BY b.id
    ORDER BY precio_promedio DESC
  `);

  const heatmap = rows.map(r => {
    const delta = r.precio_mes_anterior > 0 && r.precio_promedio > 0
      ? Math.round(((r.precio_promedio - r.precio_mes_anterior) / r.precio_mes_anterior) * 1000) / 10
      : 0;
    return { ...r, delta_pct: delta };
  });

  const precios = heatmap.map(h => h.precio_promedio).filter(p => p > 0);
  const max = precios.length ? Math.max(...precios) : 1;
  const min = precios.length ? Math.min(...precios) : 0;

  res.json({
    heatmap: heatmap.map(h => ({
      ...h,
      intensidad: max === min ? 0.5 : (h.precio_promedio - min) / (max - min),
    })),
  });
}));

// ── Banners ───────────────────────────────────────────────────────────────────
// Drizzle ORM: simple select con filtro
router.get('/banners', wrap(async (_req, res) => {
  const rows = await db
    .select()
    .from(banners)
    .where(eq(banners.activo, true))
    .orderBy(banners.id);
  res.json({ banners: rows });
}));

// ── Profesionales ─────────────────────────────────────────────────────────────
// Drizzle ORM: simple select con order
router.get('/profesionales', wrap(async (_req, res) => {
  const rows = await db
    .select()
    .from(profesionales)
    .orderBy(desc(profesionales.rating), profesionales.nombre);
  res.json({ profesionales: rows });
}));

// ── Stats ─────────────────────────────────────────────────────────────────────
// Drizzle ORM: tres counts en paralelo
router.get('/stats/summary', wrap(async (_req, res) => {
  const [[{ total }], [{ liquidaciones }], [{ inmobiliarias }]] = await Promise.all([
    db.select({ total:        sql`count(*)::int` }).from(properties),
    db.select({ liquidaciones: sql`count(*)::int` }).from(properties).where(eq(properties.liquidacion, true)),
    db.select({ inmobiliarias: sql`count(*)::int` }).from(users).where(eq(users.rol, 'inmobiliaria')),
  ]);

  res.json({
    propiedades:  total,
    liquidacion:  liquidaciones,
    inmobiliarias,
    dolarBlue: { compra: 1180, venta: 1210, variacion: '+0.8%' },
    clima: { ciudad: 'Villa María', tempC: 22, descripcion: 'Parcialmente nublado', humedad: 58 },
  });
}));

// ── Admin: usuarios ───────────────────────────────────────────────────────────
// Raw SQL: JOIN con subquery de conteo de propiedades por usuario
router.get('/admin/users', authRequired, requireRole('admin'), wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      u.id, u.nombre, u.email, u.rol, u.empresa, u.telefono, u.created_at,
      COUNT(p.id)::int AS propiedades
    FROM users u
    LEFT JOIN properties p ON p.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  res.json({ users: rows });
}));

// Drizzle ORM: update simple de un campo
router.put('/admin/users/:id/rol', authRequired, requireRole('admin'), wrap(async (req, res) => {
  const { rol } = req.body || {};
  if (!['admin', 'inmobiliaria', 'usuario'].includes(rol)) {
    return res.status(400).json({ error: 'rol invalido' });
  }
  await db.update(users).set({ rol }).where(eq(users.id, Number(req.params.id)));
  res.json({ ok: true });
}));

// Drizzle ORM: delete simple
router.delete('/admin/users/:id', authRequired, requireRole('admin'), wrap(async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'no podes eliminarte a vos mismo' });
  }
  await db.delete(users).where(eq(users.id, Number(req.params.id)));
  res.json({ ok: true });
}));

export default router;
