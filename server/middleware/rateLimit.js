import rateLimit from 'express-rate-limit';

// Almacenamiento en memoria — aceptable mientras corra un solo proceso.
// Al escalar a múltiples instancias, migrar a RedisStore.

const base = {
  standardHeaders: true,
  legacyHeaders:   false,
};

export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.' },
});

export const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados registros desde esta IP. Esperá 1 hora.' },
});

export const forgotLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Demasiadas solicitudes. Esperá 1 hora e intentá de nuevo.' },
});

// ai-search hace queries dinámicas + un lookup a barrios por request.
// 30 req/min es generoso para uso humano y corta un script abusivo.
export const aiSearchLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas búsquedas. Esperá un momento.' },
});

// Para mutaciones autenticadas (crear/editar/borrar propiedades, subir
// imágenes). Auth ya filtra anónimos, pero un usuario con script puede
// generar carga. 60 ops/min cubre cualquier flujo manual razonable.
export const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Demasiadas operaciones. Esperá un momento.' },
});
