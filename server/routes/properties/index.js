import { Router } from 'express';
import searchRouter from './search.js';
import imagesRouter from './images.js';
import crudRouter from './crud.js';

const router = Router();

// Orden importante:
//   1. search: rutas literales (/ai-search, /cheapest-by-barrio)
//   2. images: rutas /:id/images/... (2 segmentos, no chocan con :id)
//   3. crud:   /, /mine/list, /:id, POST, PUT, DELETE — /:id captura último
//
// Si crud va primero, /:id intercepta cualquier path con un solo segmento
// y los handlers de search nunca matchean.
router.use('/', searchRouter);
router.use('/', imagesRouter);
router.use('/', crudRouter);

export default router;
