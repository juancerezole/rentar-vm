import { Router } from 'express';
import { eq, and, asc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { propertyImages } from '../../db/schema.js';
import { authRequired } from '../../middleware/auth.js';
import { writeLimiter } from '../../middleware/rateLimit.js';
import { deleteCloudinaryImage } from '../../services/cloudinary.js';
import { wrap } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/parseId.js';
import logger from '../../logger.js';
import { MAX_IMAGES_PER_PROPERTY } from '../../constants.js';
import { propsTable } from './_shared.js';

const router = Router();

// ── POST /:id/images — registra URL de Cloudinary ya subida ────────────────
router.post('/:id/images', writeLimiter, authRequired, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  const { url, public_id } = req.body;
  if (!url || !public_id) return res.status(400).json({ error: 'url y public_id son requeridos' });

  const [prop] = await db.select({ user_id: propsTable.user_id, imagen: propsTable.imagen })
    .from(propsTable).where(eq(propsTable.id, id));
  if (!prop) return res.status(404).json({ error: 'no encontrada' });
  if (prop.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }

  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(propertyImages)
    .where(eq(propertyImages.property_id, id));
  if (count >= MAX_IMAGES_PER_PROPERTY) {
    return res.status(400).json({ error: `Máximo ${MAX_IMAGES_PER_PROPERTY} fotos por propiedad` });
  }

  const [img] = await db.insert(propertyImages)
    .values({ property_id: id, url, public_id, orden: count })
    .returning();

  // La primera foto define la portada (campo `imagen` en properties)
  if (count === 0) {
    await db.update(propsTable).set({ imagen: url }).where(eq(propsTable.id, id));
  }

  res.json({ image: img });
}));

// ── DELETE /:id/images/:imageId — borra de DB + Cloudinary ─────────────────
router.delete('/:id/images/:imageId', writeLimiter, authRequired, wrap(async (req, res) => {
  const id      = parseId(req.params.id);
  const imageId = parseId(req.params.imageId);
  if (!id || !imageId) return res.status(400).json({ error: 'id inválido' });

  const [prop] = await db.select({ user_id: propsTable.user_id })
    .from(propsTable).where(eq(propsTable.id, id));
  if (!prop) return res.status(404).json({ error: 'no encontrada' });
  if (prop.user_id !== req.user.id && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'sin permisos' });
  }

  const [img] = await db.select().from(propertyImages)
    .where(and(eq(propertyImages.id, imageId), eq(propertyImages.property_id, id)));
  if (!img) return res.status(404).json({ error: 'imagen no encontrada' });

  await db.delete(propertyImages).where(eq(propertyImages.id, imageId));

  // Fire-and-forget: la imagen ya está fuera de la DB. Si Cloudinary falla
  // queda como huérfana — la registramos para reclamarla off-line.
  deleteCloudinaryImage(img.public_id).catch(err =>
    logger.warn({ err, public_id: img.public_id, property_id: id }, 'cloudinary delete falló'),
  );

  // Si borramos la portada, recalculamos: tomamos la siguiente por orden.
  const [next] = await db.select({ url: propertyImages.url })
    .from(propertyImages)
    .where(eq(propertyImages.property_id, id))
    .orderBy(asc(propertyImages.orden), asc(propertyImages.created_at))
    .limit(1);
  await db.update(propsTable).set({ imagen: next?.url ?? null }).where(eq(propsTable.id, id));

  res.json({ ok: true });
}));

export default router;
