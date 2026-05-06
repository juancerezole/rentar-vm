import { Router } from 'express';
import { db } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

function rowToProp(r) {
  if (!r) return null;
  return {
    ...r,
    mascotas: !!r.mascotas,
    amoblado: !!r.amoblado,
    expensas_incluidas: !!r.expensas_incluidas,
    destacado: !!r.destacado,
    liquidacion: !!r.liquidacion,
  };
}

router.get('/', (req, res) => {
  const {
    tipo, barrio, minPrecio, maxPrecio, ambientes, garantia,
    mascotas, amoblado, expensas, q, destacado, liquidacion,
  } = req.query;

  const where = [];
  const params = [];
  if (tipo) { where.push('p.tipo = ?'); params.push(tipo); }
  if (barrio) { where.push('p.barrio = ?'); params.push(barrio); }
  if (minPrecio) { where.push('p.precio >= ?'); params.push(Number(minPrecio)); }
  if (maxPrecio) { where.push('p.precio <= ?'); params.push(Number(maxPrecio)); }
  if (ambientes) {
    if (String(ambientes).endsWith('+')) {
      where.push('p.ambientes >= ?'); params.push(parseInt(ambientes));
    } else {
      where.push('p.ambientes = ?'); params.push(Number(ambientes));
    }
  }
  if (garantia && garantia !== 'todas') { where.push('p.garantia = ?'); params.push(garantia); }
  if (mascotas === 'true') where.push('p.mascotas = 1');
  if (amoblado === 'true') where.push('p.amoblado = 1');
  if (expensas === 'true') where.push('p.expensas_incluidas = 1');
  if (destacado === 'true') where.push('p.destacado = 1');
  if (liquidacion === 'true') where.push('p.liquidacion = 1');
  if (q) {
    where.push('(p.titulo LIKE ? OR p.direccion LIKE ? OR p.descripcion LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const sql = `
    SELECT p.*, u.nombre AS publicador, u.empresa, u.telefono, u.email AS contacto_email
    FROM properties p
    JOIN users u ON u.id = p.user_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.destacado DESC, p.created_at DESC
  `;
  const rows = db.prepare(sql).all(...params).map(rowToProp);
  res.json({ properties: rows, total: rows.length });
});

// Búsqueda "inteligente" — extrae intención del texto libre
router.post('/ai-search', (req, res) => {
  const text = String(req.body?.text || '').toLowerCase();
  if (!text.trim()) return res.json({ properties: [], interpretation: null });

  const where = [];
  const params = [];
  const interpretation = {};

  // Tipo
  const tipoMap = {
    'departamento': ['depto', 'departamento', 'departamentos'],
    'casa': ['casa', 'casas'],
    'duplex': ['duplex', 'dúplex'],
    'monoambiente': ['monoambiente', 'mono ambiente'],
    'comercial': ['local', 'comercial', 'negocio'],
    'cochera': ['cochera', 'garage'],
    'galpon': ['galpon', 'galpón'],
    'campo': ['campo', 'quinta', 'chacra'],
    'baulera': ['baulera', 'depósito', 'deposito'],
  };
  for (const [tipo, kws] of Object.entries(tipoMap)) {
    if (kws.some(k => text.includes(k))) {
      if (tipo === 'monoambiente') {
        where.push("p.tipo = 'departamento' AND p.ambientes = 1");
        interpretation.tipo = 'monoambiente';
      } else {
        where.push('p.tipo = ?');
        params.push(tipo);
        interpretation.tipo = tipo;
      }
      break;
    }
  }

  // Ambientes
  const ambMatch = text.match(/(\d+)\s*(?:amb|ambientes|dorm|dormitorios)/);
  if (ambMatch) {
    where.push('p.ambientes = ?');
    params.push(Number(ambMatch[1]));
    interpretation.ambientes = Number(ambMatch[1]);
  }

  // Precio máximo (acepta "hasta 300mil", "hasta $300.000", "menos de 250000")
  const precioMatch = text.match(/(?:hasta|menos de|max\.?|menor a)\s*\$?\s*([\d.]+)\s*(mil|k)?/);
  if (precioMatch) {
    let v = Number(precioMatch[1].replace(/\./g, ''));
    if (precioMatch[2]) v *= 1000;
    where.push('p.precio <= ?');
    params.push(v);
    interpretation.precio_max = v;
  }

  // Barrio
  const barrios = db.prepare('SELECT nombre FROM barrios').all();
  for (const b of barrios) {
    if (text.includes(b.nombre.toLowerCase())) {
      where.push('p.barrio = ?');
      params.push(b.nombre);
      interpretation.barrio = b.nombre;
      break;
    }
  }

  // Toggles
  if (/mascot|perro|gato|pet/.test(text)) {
    where.push('p.mascotas = 1'); interpretation.mascotas = true;
  }
  if (/amoblad|muebl/.test(text)) {
    where.push('p.amoblado = 1'); interpretation.amoblado = true;
  }
  if (/sin garant[íi]a/.test(text)) {
    where.push("p.garantia = 'sin'"); interpretation.garantia = 'sin';
  }
  if (/expensas?\s+inclu/.test(text)) {
    where.push('p.expensas_incluidas = 1'); interpretation.expensas = true;
  }

  const sql = `
    SELECT p.*, u.nombre AS publicador, u.empresa, u.telefono
    FROM properties p
    JOIN users u ON u.id = p.user_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.destacado DESC, p.created_at DESC
    LIMIT 24
  `;
  const rows = db.prepare(sql).all(...params).map(r => ({
    ...r,
    mascotas: !!r.mascotas, amoblado: !!r.amoblado,
    expensas_incluidas: !!r.expensas_incluidas, destacado: !!r.destacado, liquidacion: !!r.liquidacion,
  }));
  res.json({ properties: rows, interpretation, total: rows.length });
});

router.get('/cheapest-by-barrio', (_req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.nombre AS publicador, u.empresa
    FROM properties p
    JOIN users u ON u.id = p.user_id
    WHERE p.precio = (SELECT MIN(precio) FROM properties WHERE barrio = p.barrio)
    GROUP BY p.barrio
    ORDER BY p.precio ASC
  `).all().map(rowToProp);
  res.json({ properties: rows });
});

router.get('/mine/list', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id).map(rowToProp);
  res.json({ properties: rows });
});

router.get('/:id', (req, res) => {
  const r = db.prepare(`
    SELECT p.*, u.nombre AS publicador, u.empresa, u.telefono, u.email AS contacto_email
    FROM properties p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!r) return res.status(404).json({ error: 'no encontrada' });
  res.json({ property: rowToProp(r) });
});

router.post('/', authRequired, requireRole('inmobiliaria', 'admin'), (req, res) => {
  const b = req.body || {};
  const required = ['titulo', 'tipo', 'direccion', 'barrio', 'precio'];
  for (const f of required) if (!b[f]) return res.status(400).json({ error: `falta ${f}` });

  const info = db.prepare(`
    INSERT INTO properties (user_id, titulo, tipo, direccion, barrio, precio, precio_anterior, ambientes, banos, superficie, garantia, mascotas, amoblado, expensas_incluidas, destacado, liquidacion, descripcion, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    b.titulo, b.tipo, b.direccion, b.barrio,
    Number(b.precio), b.precio_anterior ? Number(b.precio_anterior) : null,
    Number(b.ambientes || 1), Number(b.banos || 1), Number(b.superficie || 0),
    b.garantia || 'requerida',
    b.mascotas ? 1 : 0, b.amoblado ? 1 : 0, b.expensas_incluidas ? 1 : 0,
    req.user.rol === 'admin' && b.destacado ? 1 : 0,
    b.liquidacion ? 1 : 0,
    b.descripcion || null, b.imagen || null,
  );
  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(Number(info.lastInsertRowid));
  res.json({ property: rowToProp(row) });
});

router.put('/:id', authRequired, (req, res) => {
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'no encontrada' });
  if (existing.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }
  const b = req.body || {};
  const merged = {
    titulo: b.titulo ?? existing.titulo,
    tipo: b.tipo ?? existing.tipo,
    direccion: b.direccion ?? existing.direccion,
    barrio: b.barrio ?? existing.barrio,
    precio: b.precio != null ? Number(b.precio) : existing.precio,
    precio_anterior: b.precio_anterior != null ? Number(b.precio_anterior) : existing.precio_anterior,
    ambientes: b.ambientes != null ? Number(b.ambientes) : existing.ambientes,
    banos: b.banos != null ? Number(b.banos) : existing.banos,
    superficie: b.superficie != null ? Number(b.superficie) : existing.superficie,
    garantia: b.garantia ?? existing.garantia,
    mascotas: b.mascotas != null ? (b.mascotas ? 1 : 0) : existing.mascotas,
    amoblado: b.amoblado != null ? (b.amoblado ? 1 : 0) : existing.amoblado,
    expensas_incluidas: b.expensas_incluidas != null ? (b.expensas_incluidas ? 1 : 0) : existing.expensas_incluidas,
    destacado: req.user.rol === 'admin' && b.destacado != null ? (b.destacado ? 1 : 0) : existing.destacado,
    liquidacion: b.liquidacion != null ? (b.liquidacion ? 1 : 0) : existing.liquidacion,
    descripcion: b.descripcion ?? existing.descripcion,
    imagen: b.imagen ?? existing.imagen,
  };
  db.prepare(`
    UPDATE properties SET titulo=?, tipo=?, direccion=?, barrio=?, precio=?, precio_anterior=?, ambientes=?, banos=?, superficie=?, garantia=?, mascotas=?, amoblado=?, expensas_incluidas=?, destacado=?, liquidacion=?, descripcion=?, imagen=?
    WHERE id = ?
  `).run(
    merged.titulo, merged.tipo, merged.direccion, merged.barrio, merged.precio, merged.precio_anterior,
    merged.ambientes, merged.banos, merged.superficie, merged.garantia,
    merged.mascotas, merged.amoblado, merged.expensas_incluidas, merged.destacado, merged.liquidacion,
    merged.descripcion, merged.imagen, req.params.id
  );
  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  res.json({ property: rowToProp(row) });
});

router.delete('/:id', authRequired, (req, res) => {
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'no encontrada' });
  if (existing.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
