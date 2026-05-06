import { Router } from 'express';
import { db } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/barrios', (_req, res) => {
  const rows = db.prepare(`
    SELECT b.*, COUNT(p.id) AS cantidad
    FROM barrios b
    LEFT JOIN properties p ON p.barrio = b.nombre
    GROUP BY b.id
    ORDER BY b.nombre
  `).all();
  res.json({ barrios: rows });
});

router.get('/barrios/heatmap', (_req, res) => {
  const rows = db.prepare(`
    SELECT
      b.id,
      b.nombre,
      b.precio_mes_anterior,
      COUNT(p.id) AS cantidad,
      COALESCE(ROUND(AVG(p.precio)), 0) AS precio_promedio,
      COALESCE(MIN(p.precio), 0) AS precio_min,
      COALESCE(MAX(p.precio), 0) AS precio_max
    FROM barrios b
    LEFT JOIN properties p ON p.barrio = b.nombre AND p.tipo IN ('departamento','casa','duplex')
    GROUP BY b.id
    ORDER BY precio_promedio DESC
  `).all();

  const heatmap = rows.map(r => {
    const delta = r.precio_mes_anterior > 0 && r.precio_promedio > 0
      ? Math.round(((r.precio_promedio - r.precio_mes_anterior) / r.precio_mes_anterior) * 100 * 10) / 10
      : 0;
    return {
      id: r.id,
      nombre: r.nombre,
      cantidad: r.cantidad,
      precio_promedio: r.precio_promedio,
      precio_min: r.precio_min,
      precio_max: r.precio_max,
      delta_pct: delta,
    };
  });

  const todos = heatmap.map(h => h.precio_promedio).filter(p => p > 0);
  const max = todos.length ? Math.max(...todos) : 1;
  const min = todos.length ? Math.min(...todos) : 0;

  res.json({ heatmap: heatmap.map(h => ({ ...h, intensidad: max === min ? 0.5 : (h.precio_promedio - min) / (max - min) })) });
});

router.get('/banners', (_req, res) => {
  const rows = db.prepare('SELECT * FROM banners WHERE activo = 1 ORDER BY id').all();
  res.json({ banners: rows });
});

router.get('/profesionales', (_req, res) => {
  const rows = db.prepare('SELECT * FROM profesionales ORDER BY rating DESC, nombre').all();
  res.json({ profesionales: rows });
});

router.get('/stats/summary', (_req, res) => {
  const propiedades = db.prepare('SELECT COUNT(*) AS c FROM properties').get().c;
  const liquidacion = db.prepare('SELECT COUNT(*) AS c FROM properties WHERE liquidacion = 1').get().c;
  const inmobiliarias = db.prepare("SELECT COUNT(*) AS c FROM users WHERE rol = 'inmobiliaria'").get().c;
  res.json({
    propiedades,
    liquidacion,
    inmobiliarias,
    dolarBlue: { compra: 1180, venta: 1210, variacion: '+0.8%' },
    clima: { ciudad: 'Villa María', tempC: 22, descripcion: 'Parcialmente nublado', humedad: 58 },
  });
});

router.get('/admin/users', authRequired, requireRole('admin'), (_req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.nombre, u.email, u.rol, u.empresa, u.telefono, u.created_at,
      (SELECT COUNT(*) FROM properties WHERE user_id = u.id) AS propiedades
    FROM users u ORDER BY u.created_at DESC
  `).all();
  res.json({ users: rows });
});

router.put('/admin/users/:id/rol', authRequired, requireRole('admin'), (req, res) => {
  const { rol } = req.body || {};
  if (!['admin', 'inmobiliaria', 'usuario'].includes(rol)) return res.status(400).json({ error: 'rol invalido' });
  db.prepare('UPDATE users SET rol = ? WHERE id = ?').run(rol, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/users/:id', authRequired, requireRole('admin'), (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'no podes eliminarte a vos mismo' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
