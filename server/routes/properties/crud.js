import { Router } from 'express';
import { eq, and, gte, lte, ilike, or, desc, asc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { propertyImages } from '../../db/schema.js';
import { authRequired, requireRole } from '../../middleware/auth.js';
import { validate, propertySchema, propertyUpdateSchema } from '../../middleware/validate.js';
import { writeLimiter } from '../../middleware/rateLimit.js';
import { deleteCloudinaryImage } from '../../services/cloudinary.js';
import { parsePagination, buildPageMeta } from '../../utils/pagination.js';
import { wrap } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/parseId.js';
import logger from '../../logger.js';
import { propsTable, users, getDefaultCiudadId, propWithUser, resolveBarrioId } from './_shared.js';

const router = Router();

// ── GET / — listado público con filtros + paginación ────────────────────────
router.get('/', wrap(async (req, res) => {
  const {
    tipo, barrio, minPrecio, maxPrecio, ambientes, garantia,
    mascotas, amoblado, expensas, q, destacado, liquidacion,
  } = req.query;

  const { page, limit, offset } = parsePagination(req, { defaultLimit: 24, maxLimit: 48 });

  const conds = [];
  if (tipo)                      conds.push(eq(propsTable.tipo, tipo));
  if (barrio)                    conds.push(eq(propsTable.barrio, barrio));
  if (minPrecio)                 conds.push(gte(propsTable.precio, Number(minPrecio)));
  if (maxPrecio)                 conds.push(lte(propsTable.precio, Number(maxPrecio)));
  if (ambientes) {
    String(ambientes).endsWith('+')
      ? conds.push(gte(propsTable.ambientes, parseInt(ambientes)))
      : conds.push(eq(propsTable.ambientes, Number(ambientes)));
  }
  if (garantia && garantia !== 'todas') conds.push(eq(propsTable.garantia, garantia));
  if (mascotas    === 'true') conds.push(eq(propsTable.mascotas,           true));
  if (amoblado    === 'true') conds.push(eq(propsTable.amoblado,           true));
  if (expensas    === 'true') conds.push(eq(propsTable.expensas_incluidas, true));
  if (destacado   === 'true') conds.push(eq(propsTable.destacado,          true));
  if (liquidacion === 'true') conds.push(eq(propsTable.liquidacion,        true));
  if (q) {
    conds.push(or(
      ilike(propsTable.titulo,      `%${q}%`),
      ilike(propsTable.direccion,   `%${q}%`),
      ilike(propsTable.descripcion, `%${q}%`),
    ));
  }

  const whereExpr = conds.length ? and(...conds) : undefined;

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

  res.json({ properties: rows, ...buildPageMeta(countResult[0].count, page, limit) });
}));

// ── GET /mine/list — propiedades del usuario logueado (paginadas) ──────────
// IMPORTANTE: este handler debe declararse ANTES de GET /:id para que el
// segmento "mine" no sea capturado como id.
router.get('/mine/list', authRequired, wrap(async (req, res) => {
  const { page, limit, offset } = parsePagination(req, { defaultLimit: 20, maxLimit: 100 });
  const where = eq(propsTable.user_id, req.user.id);

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql`count(*)::int` }).from(propsTable).where(where),
    db.select().from(propsTable)
      .where(where)
      .orderBy(desc(propsTable.created_at))
      .limit(limit)
      .offset(offset),
  ]);

  res.json({ properties: rows, ...buildPageMeta(countResult[0].count, page, limit) });
}));

// ── GET /:id — detalle público (incluye imágenes ordenadas) ─────────────────
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

// ── POST / — crear propiedad ────────────────────────────────────────────────
router.post('/', writeLimiter, authRequired, requireRole('inmobiliaria', 'admin'), validate(propertySchema), wrap(async (req, res) => {
  const b = req.body;
  const ciudadId = await getDefaultCiudadId();

  const [row] = await db.insert(propsTable).values({
    ciudad_id:          ciudadId,
    user_id:            req.user.id,
    titulo:             b.titulo,
    tipo:               b.tipo,
    direccion:          b.direccion,
    barrio:             b.barrio,
    barrio_id:          await resolveBarrioId(b.barrio),
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

// ── PUT /:id — editar propiedad (Zod partial) ───────────────────────────────
router.put('/:id', writeLimiter, authRequired, validate(propertyUpdateSchema), wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  const [existing] = await db.select({ user_id: propsTable.user_id })
    .from(propsTable).where(eq(propsTable.id, id));
  if (!existing) return res.status(404).json({ error: 'no encontrada' });
  if (existing.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }

  const updates = { ...req.body };
  // destacado es admin-only — silenciosamente se descarta si lo manda
  // una inmobiliaria. No es un error: simplemente no aplica.
  if (req.user.rol !== 'admin') delete updates.destacado;

  // Si cambia el barrio (texto), recalculamos la FK para mantener coherencia.
  if (updates.barrio !== undefined) {
    updates.barrio_id = await resolveBarrioId(updates.barrio);
  }

  if (Object.keys(updates).length === 0) {
    const [row] = await db.select().from(propsTable).where(eq(propsTable.id, id));
    return res.json({ property: row });
  }

  const [row] = await db
    .update(propsTable)
    .set(updates)
    .where(eq(propsTable.id, id))
    .returning();

  res.json({ property: row });
}));

// ── DELETE /:id — eliminar propiedad + sus imágenes en Cloudinary ──────────
router.delete('/:id', writeLimiter, authRequired, wrap(async (req, res) => {
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

  // Fire-and-forget. La fila ya está borrada — la imagen huérfana se reclama
  // off-line si Cloudinary falla.
  for (const img of imgs) {
    deleteCloudinaryImage(img.public_id).catch(err =>
      logger.warn({ err, public_id: img.public_id, property_id: id }, 'cloudinary delete falló'),
    );
  }

  res.json({ ok: true });
}));

export default router;
