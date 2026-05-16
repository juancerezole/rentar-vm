import { Router } from 'express';
import { eq, and, gte, lte, ilike, or, desc, asc, getTableColumns, sql } from 'drizzle-orm';
import { db, pool } from '../db/index.js';
import { properties as propsTable, users, ciudades, propertyImages } from '../db/schema.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { validate, propertySchema } from '../middleware/validate.js';
import { deleteCloudinaryImage } from '../services/cloudinary.js';
import logger from '../logger.js';

const router = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

function parseId(param) {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Ciudad por defecto (Villa María). Se resuelve una sola vez en la primera llamada.
let _defaultCiudadId = null;
async function getDefaultCiudadId() {
  if (_defaultCiudadId) return _defaultCiudadId;
  const [c] = await db.select({ id: ciudades.id }).from(ciudades).where(eq(ciudades.slug, 'villa-maria'));
  if (!c) throw new Error('Ciudad "villa-maria" no encontrada. ¿Corriste el seed?');
  _defaultCiudadId = c.id;
  return _defaultCiudadId;
}

// Columnas de properties + campos de usuario que se devuelven en los listados
const propWithUser = () => ({
  ...getTableColumns(propsTable),
  publicador:    users.nombre,
  empresa:       users.empresa,
  telefono:      users.telefono,
  contacto_email: users.email,
});

// ── GET / — listado con filtros + paginación (Drizzle ORM) ──────────────────
router.get('/', wrap(async (req, res) => {
  const {
    tipo, barrio, minPrecio, maxPrecio, ambientes, garantia,
    mascotas, amoblado, expensas, q, destacado, liquidacion,
  } = req.query;

  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
  const offset = (page - 1) * limit;

  const conds = [];
  if (tipo)                     conds.push(eq(propsTable.tipo, tipo));
  if (barrio)                   conds.push(eq(propsTable.barrio, barrio));
  if (minPrecio)                conds.push(gte(propsTable.precio, Number(minPrecio)));
  if (maxPrecio)                conds.push(lte(propsTable.precio, Number(maxPrecio)));
  if (ambientes) {
    String(ambientes).endsWith('+')
      ? conds.push(gte(propsTable.ambientes, parseInt(ambientes)))
      : conds.push(eq(propsTable.ambientes, Number(ambientes)));
  }
  if (garantia && garantia !== 'todas') conds.push(eq(propsTable.garantia, garantia));
  if (mascotas   === 'true') conds.push(eq(propsTable.mascotas,           true));
  if (amoblado   === 'true') conds.push(eq(propsTable.amoblado,           true));
  if (expensas   === 'true') conds.push(eq(propsTable.expensas_incluidas, true));
  if (destacado  === 'true') conds.push(eq(propsTable.destacado,          true));
  if (liquidacion === 'true') conds.push(eq(propsTable.liquidacion,       true));
  if (q) {
    conds.push(or(
      ilike(propsTable.titulo,      `%${q}%`),
      ilike(propsTable.direccion,   `%${q}%`),
      ilike(propsTable.descripcion, `%${q}%`),
    ));
  }

  const whereExpr = conds.length ? and(...conds) : undefined;

  // Count y datos en paralelo sobre el mismo filtro
  const [countResult, rows] = await Promise.all([
    db.select({ count: sql`count(*)::int` })
      .from(propsTable)
      .innerJoin(users, eq(users.id, propsTable.user_id))
      .where(whereExpr),
    db.select(propWithUser())
      .from(propsTable)
      .innerJoin(users, eq(users.id, propsTable.user_id))
      .where(whereExpr)
      .orderBy(desc(propsTable.destacado), desc(propsTable.created_at))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countResult[0].count;
  res.json({ properties: rows, total, page, totalPages: Math.ceil(total / limit) });
}));

// ── POST /ai-search — búsqueda en lenguaje natural (Raw SQL + pg pool) ────────
// Usa raw SQL porque construye condiciones compuestas dinámicamente que no se
// expresan limpiamente con el builder de Drizzle (ej: monoambiente = tipo + ambientes).
router.post('/ai-search', wrap(async (req, res) => {
  const text = String(req.body?.text || '').toLowerCase();
  if (!text.trim()) return res.json({ properties: [], interpretation: null });

  const where  = [];
  const params = [];
  const interpretation = {};
  const addParam = (v) => { params.push(v); return `$${params.length}`; };

  // Tipo
  const tipoMap = {
    departamento: ['depto', 'departamento', 'departamentos'],
    casa:         ['casa', 'casas'],
    duplex:       ['duplex', 'dúplex'],
    monoambiente: ['monoambiente', 'mono ambiente'],
    comercial:    ['local', 'comercial', 'negocio'],
    cochera:      ['cochera', 'garage'],
    galpon:       ['galpon', 'galpón'],
    campo:        ['campo', 'quinta', 'chacra'],
    baulera:      ['baulera', 'depósito', 'deposito'],
  };
  for (const [tipo, kws] of Object.entries(tipoMap)) {
    if (kws.some(k => text.includes(k))) {
      if (tipo === 'monoambiente') {
        where.push(`p.tipo = 'departamento' AND p.ambientes = 1`);
        interpretation.tipo = 'monoambiente';
      } else {
        where.push(`p.tipo = ${addParam(tipo)}`);
        interpretation.tipo = tipo;
      }
      break;
    }
  }

  // Ambientes
  const ambMatch = text.match(/(\d+)\s*(?:amb|ambientes|dorm|dormitorios)/);
  if (ambMatch) {
    where.push(`p.ambientes = ${addParam(Number(ambMatch[1]))}`);
    interpretation.ambientes = Number(ambMatch[1]);
  }

  // Precio máximo ("hasta 300mil", "hasta $300.000", "menos de 250000")
  const precioMatch = text.match(/(?:hasta|menos de|max\.?|menor a)\s*\$?\s*([\d.]+)\s*(mil|k)?/);
  if (precioMatch) {
    let v = Number(precioMatch[1].replace(/\./g, ''));
    if (precioMatch[2]) v *= 1000;
    where.push(`p.precio <= ${addParam(v)}`);
    interpretation.precio_max = v;
  }

  // Barrio — consultamos la tabla para no hardcodear los nombres
  const { rows: barrioRows } = await pool.query('SELECT nombre FROM barrios');
  for (const b of barrioRows) {
    if (text.includes(b.nombre.toLowerCase())) {
      where.push(`p.barrio = ${addParam(b.nombre)}`);
      interpretation.barrio = b.nombre;
      break;
    }
  }

  // Toggles
  if (/mascot|perro|gato|pet/.test(text))        { where.push('p.mascotas = true');          interpretation.mascotas = true; }
  if (/amoblad|muebl/.test(text))                { where.push('p.amoblado = true');           interpretation.amoblado = true; }
  if (/sin garant[íi]a/.test(text))              { where.push(`p.garantia = 'sin'`);          interpretation.garantia = 'sin'; }
  if (/expensas?\s+inclu/.test(text))            { where.push('p.expensas_incluidas = true'); interpretation.expensas = true; }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const { rows } = await pool.query(`
    SELECT p.*, u.nombre AS publicador, u.empresa, u.telefono
    FROM properties p
    JOIN users u ON u.id = p.user_id
    ${whereClause}
    ORDER BY p.destacado DESC, p.created_at DESC
    LIMIT 24
  `, params);

  res.json({ properties: rows, interpretation, total: rows.length });
}));

// ── GET /cheapest-by-barrio (Raw SQL: DISTINCT ON — subquery correlacionada) ──
router.get('/cheapest-by-barrio', wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT * FROM (
      SELECT DISTINCT ON (p.barrio)
        p.*, u.nombre AS publicador, u.empresa
      FROM properties p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.barrio, p.precio ASC
    ) t
    ORDER BY t.precio ASC
  `);
  res.json({ properties: rows });
}));

// ── GET /mine/list (Drizzle ORM) ──────────────────────────────────────────────
router.get('/mine/list', authRequired, wrap(async (req, res) => {
  const rows = await db
    .select()
    .from(propsTable)
    .where(eq(propsTable.user_id, req.user.id))
    .orderBy(desc(propsTable.created_at));
  res.json({ properties: rows });
}));

// ── GET /:id (Drizzle ORM) ────────────────────────────────────────────────────
router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  const [row] = await db
    .select(propWithUser())
    .from(propsTable)
    .innerJoin(users, eq(users.id, propsTable.user_id))
    .where(eq(propsTable.id, id));
  if (!row) return res.status(404).json({ error: 'no encontrada' });
  const images = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.property_id, id))
    .orderBy(asc(propertyImages.orden), asc(propertyImages.created_at));
  res.json({ property: { ...row, images } });
}));

// ── POST /:id/images — registra URL de Cloudinary ya subida ──────────────────
router.post('/:id/images', authRequired, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  const { url, public_id } = req.body;
  if (!url || !public_id) return res.status(400).json({ error: 'url y public_id son requeridos' });

  const [prop] = await db.select({ user_id: propsTable.user_id, imagen: propsTable.imagen })
    .from(propsTable).where(eq(propsTable.id, id));
  if (!prop) return res.status(404).json({ error: 'no encontrada' });
  if (prop.user_id !== req.user.id && req.user.rol !== 'admin') return res.status(403).json({ error: 'sin permisos' });

  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(propertyImages)
    .where(eq(propertyImages.property_id, id));
  if (count >= 10) return res.status(400).json({ error: 'Máximo 10 fotos por propiedad' });

  const [img] = await db.insert(propertyImages)
    .values({ property_id: id, url, public_id, orden: count })
    .returning();

  if (count === 0) {
    await db.update(propsTable).set({ imagen: url }).where(eq(propsTable.id, id));
  }

  res.json({ image: img });
}));

// ── DELETE /:id/images/:imageId — elimina imagen de DB y Cloudinary ──────────
router.delete('/:id/images/:imageId', authRequired, wrap(async (req, res) => {
  const id      = parseId(req.params.id);
  const imageId = parseId(req.params.imageId);
  if (!id || !imageId) return res.status(400).json({ error: 'id inválido' });

  const [prop] = await db.select({ user_id: propsTable.user_id })
    .from(propsTable).where(eq(propsTable.id, id));
  if (!prop) return res.status(404).json({ error: 'no encontrada' });
  if (prop.user_id !== req.user.id && req.user.rol !== 'admin') return res.status(403).json({ error: 'sin permisos' });

  const [img] = await db.select().from(propertyImages)
    .where(and(eq(propertyImages.id, imageId), eq(propertyImages.property_id, id)));
  if (!img) return res.status(404).json({ error: 'imagen no encontrada' });

  await db.delete(propertyImages).where(eq(propertyImages.id, imageId));
  // Fire-and-forget: si Cloudinary falla, la fila ya está borrada de la DB —
  // loggeamos para poder reclamar la imagen huérfana después.
  deleteCloudinaryImage(img.public_id).catch(err =>
    logger.warn({ err, public_id: img.public_id, property_id: id }, 'cloudinary delete falló'),
  );

  const [next] = await db.select({ url: propertyImages.url })
    .from(propertyImages)
    .where(eq(propertyImages.property_id, id))
    .orderBy(asc(propertyImages.orden), asc(propertyImages.created_at))
    .limit(1);
  await db.update(propsTable).set({ imagen: next?.url ?? null }).where(eq(propsTable.id, id));

  res.json({ ok: true });
}));

// ── POST / — crear propiedad (Drizzle ORM) ────────────────────────────────────
router.post('/', authRequired, requireRole('inmobiliaria', 'admin'), validate(propertySchema), wrap(async (req, res) => {
  const b = req.body;
  const ciudadId = await getDefaultCiudadId();

  const [row] = await db.insert(propsTable).values({
    ciudad_id:          ciudadId,
    user_id:            req.user.id,
    titulo:             b.titulo,
    tipo:               b.tipo,
    direccion:          b.direccion,
    barrio:             b.barrio,
    precio:             b.precio,
    precio_anterior:    b.precio_anterior || null,
    ambientes:          b.ambientes,
    banos:              b.banos,
    superficie:         b.superficie,
    garantia:           b.garantia,
    mascotas:           b.mascotas,
    amoblado:           b.amoblado,
    expensas_incluidas: b.expensas_incluidas,
    destacado:          req.user.rol === 'admin' ? b.destacado : false,
    liquidacion:        b.liquidacion,
    descripcion:        b.descripcion || null,
    imagen:             b.imagen      || null,
  }).returning();

  res.json({ property: row });
}));

// ── PUT /:id — editar propiedad (Drizzle ORM) ─────────────────────────────────
router.put('/:id', authRequired, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  const [existing] = await db
    .select()
    .from(propsTable)
    .where(eq(propsTable.id, id));
  if (!existing) return res.status(404).json({ error: 'no encontrada' });
  if (existing.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }

  const b = req.body || {};
  const merged = {
    titulo:             b.titulo             ?? existing.titulo,
    tipo:               b.tipo               ?? existing.tipo,
    direccion:          b.direccion          ?? existing.direccion,
    barrio:             b.barrio             ?? existing.barrio,
    precio:             b.precio       != null ? Number(b.precio)      : existing.precio,
    precio_anterior:    b.precio_anterior != null ? Number(b.precio_anterior) : existing.precio_anterior,
    ambientes:          b.ambientes    != null ? Number(b.ambientes)   : existing.ambientes,
    banos:              b.banos        != null ? Number(b.banos)       : existing.banos,
    superficie:         b.superficie   != null ? Number(b.superficie)  : existing.superficie,
    garantia:           b.garantia           ?? existing.garantia,
    mascotas:           b.mascotas     != null ? !!b.mascotas          : existing.mascotas,
    amoblado:           b.amoblado     != null ? !!b.amoblado          : existing.amoblado,
    expensas_incluidas: b.expensas_incluidas != null ? !!b.expensas_incluidas : existing.expensas_incluidas,
    destacado:          req.user.rol === 'admin' && b.destacado != null ? !!b.destacado : existing.destacado,
    liquidacion:        b.liquidacion  != null ? !!b.liquidacion       : existing.liquidacion,
    descripcion:        b.descripcion        ?? existing.descripcion,
    imagen:             b.imagen             ?? existing.imagen,
  };

  const [row] = await db
    .update(propsTable)
    .set(merged)
    .where(eq(propsTable.id, id))
    .returning();

  res.json({ property: row });
}));

// ── DELETE /:id (Drizzle ORM) ─────────────────────────────────────────────────
router.delete('/:id', authRequired, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  const [existing] = await db
    .select({ id: propsTable.id, user_id: propsTable.user_id })
    .from(propsTable)
    .where(eq(propsTable.id, id));
  if (!existing) return res.status(404).json({ error: 'no encontrada' });
  if (existing.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }
  const imgs = await db.select({ public_id: propertyImages.public_id })
    .from(propertyImages).where(eq(propertyImages.property_id, id));
  await db.delete(propsTable).where(eq(propsTable.id, id));
  for (const img of imgs) {
    deleteCloudinaryImage(img.public_id).catch(err =>
      logger.warn({ err, public_id: img.public_id, property_id: id }, 'cloudinary delete falló'),
    );
  }
  res.json({ ok: true });
}));

export default router;
