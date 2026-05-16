import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import logger from '../logger.js';

// Error handler único — usado por la app y por la app de tests.
// Filtra detalles internos en producción y correlaciona con logs vía errorId.
export function errorHandler(err, _req, res, _next) {
  const errorId = randomUUID();
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;

  logger.error({ err, errorId, status }, 'request failed');

  const body = { errorId };

  // 4xx: el message viene del code path que lanzó (Zod, validaciones, etc.)
  // y es seguro mostrarlo al cliente.
  if (status >= 400 && status < 500) {
    body.error = err.message || 'request invalido';
    return res.status(status).json(body);
  }

  // 5xx: en producción nunca filtramos message ni stack — pueden contener
  // paths, credenciales en URLs, nombres de columnas. En dev sí, para debug.
  if (config.isProd) {
    body.error = 'error interno';
  } else {
    body.error = err?.message || 'error interno';
    if (err?.stack) body.stack = err.stack;
  }
  res.status(status).json(body);
}
