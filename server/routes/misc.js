import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db, pool } from '../db/index.js';
import { banners, profesionales, properties, users } from '../db/schema.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { cacheControl } from '../middleware/cache.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { wrap } from '../utils/asyncHandler.js';
import { parseId } from '../utils/parseId.js';

const router = Router();

const VALID_ROLES = ['admin', 'inmobiliaria', 'usuario'];

// Devuelve la cantidad de admins en el sistema — usado para evitar que el
// último admin pierda privilegios o sea eliminado.
async function countAdmins() {
  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(users)
    .where(eq(users.rol, 'admin'));
  return count;
}

// ── Barrios ──────────────────────────────────────────────────────────────────
// Raw SQL: JOIN con COUNT agregado
router.get('/barrios', cacheControl({ maxAge: 60, staleWhileRevalidate: 300 }), wrap(async (_req, res) => {
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
router.get('/barrios/heatmap', cacheControl({ maxAge: 300, staleWhileRevalidate: 600 }), wrap(async (_req, res) => {
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
router.get('/banners', cacheControl({ maxAge: 600 }), wrap(async (_req, res) => {
  const rows = await db
    .select()
    .from(banners)
    .where(eq(banners.activo, true))
    .orderBy(banners.id);
  res.json({ banners: rows });
}));

// ── Profesionales ─────────────────────────────────────────────────────────────
router.get('/profesionales', cacheControl({ maxAge: 600 }), wrap(async (_req, res) => {
  const rows = await db
    .select()
    .from(profesionales)
    .orderBy(desc(profesionales.rating), profesionales.nombre);
  res.json({ profesionales: rows });
}));

// ── Stats ─────────────────────────────────────────────────────────────────────
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
router.get('/admin/users', authRequired, requireRole('admin'), wrap(async (req, res) => {
  const { page, limit, offset } = parsePagination(req, { defaultLimit: 25, maxLimit: 100 });
  const search = String(req.query.q || '').trim();

  // Búsqueda opcional por nombre o email (case-insensitive)
  const params = [];
  let whereClause = '';
  if (search) {
    params.push(`%${search}%`);
    whereClause = `WHERE u.nombre ILIKE $1 OR u.email ILIKE $1`;
  }

  const countSql = `SELECT COUNT(*)::int AS count FROM users u ${whereClause}`;
  const dataSql = `
    SELECT
      u.id, u.nombre, u.email, u.rol, u.empresa, u.telefono, u.created_at,
      COUNT(p.id)::int AS propiedades
    FROM users u
    LEFT JOIN properties p ON p.user_id = u.id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  // Breakdown por rol es global (no afectado por filtros/paginación)
  // para que el dashboard pueda mostrar totales reales.
  const [countResult, dataResult, byRolResult] = await Promise.all([
    pool.query(countSql, params),
    pool.query(dataSql, [...params, limit, offset]),
    pool.query(`SELECT rol, COUNT(*)::int AS count FROM users GROUP BY rol`),
  ]);

  const byRol = byRolResult.rows.reduce(
    (acc, r) => ({ ...acc, [r.rol]: r.count }),
    { admin: 0, inmobiliaria: 0, usuario: 0 },
  );

  res.json({
    users: dataResult.rows,
    byRol,
    ...buildPageMeta(countResult.rows[0].count, page, limit),
  });
}));

// Cambiar rol de un usuario. Reglas:
//   1. No podés modificar tu propio rol (evita auto-degradación accidental
//      y evita que un admin se "promueva" desde una cuenta comprometida).
//   2. No se puede degradar al último admin — el sistema quedaría sin
//      forma de recuperar privilegios.
router.put('/admin/users/:id/rol', authRequired, requireRole('admin'), wrap(async (req, res) => {
  const targetId = parseId(req.params.id);
  if (!targetId) return res.status(400).json({ error: 'id invalido' });

  const { rol } = req.body || {};
  if (!VALID_ROLES.includes(rol)) {
    return res.status(400).json({ error: 'rol invalido' });
  }

  if (targetId === req.user.id) {
    return res.status(403).json({ error: 'no podés modificar tu propio rol' });
  }

  if (rol !== 'admin') {
    const [target] = await db.select({ rol: users.rol }).from(users).where(eq(users.id, targetId));
    if (!target) return res.status(404).json({ error: 'usuario no encontrado' });
    if (target.rol === 'admin' && (await countAdmins()) <= 1) {
      return res.status(409).json({ error: 'no se puede degradar al último admin' });
    }
  }

  await db.update(users).set({ rol }).where(eq(users.id, targetId));
  res.json({ ok: true });
}));

// Eliminar usuario. Mismas protecciones que el cambio de rol.
router.delete('/admin/users/:id', authRequired, requireRole('admin'), wrap(async (req, res) => {
  const targetId = parseId(req.params.id);
  if (!targetId) return res.status(400).json({ error: 'id invalido' });

  if (targetId === req.user.id) {
    return res.status(403).json({ error: 'no podés eliminarte a vos mismo' });
  }

  const [target] = await db.select({ rol: users.rol }).from(users).where(eq(users.id, targetId));
  if (!target) return res.status(404).json({ error: 'usuario no encontrado' });

  if (target.rol === 'admin' && (await countAdmins()) <= 1) {
    return res.status(409).json({ error: 'no se puede eliminar al último admin' });
  }

  await db.delete(users).where(eq(users.id, targetId));
  res.json({ ok: true });
}));

export default router;
