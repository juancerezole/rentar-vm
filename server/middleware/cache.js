// Middleware factory para Cache-Control. Pensado para respuestas GET públicas
// y semi-estáticas (catálogos, agregaciones que no cambian por request).
//
// Uso: router.get('/barrios', cacheControl({ maxAge: 60 }), handler)
//
// Nunca aplicar a respuestas autenticadas o que dependan del usuario —
// public + max-age permite que un proxy CDN sirva la misma respuesta a todos.
export function cacheControl({ maxAge = 60, sMaxAge, staleWhileRevalidate } = {}) {
  const parts = ['public', `max-age=${maxAge}`];
  if (sMaxAge !== undefined)           parts.push(`s-maxage=${sMaxAge}`);
  if (staleWhileRevalidate !== undefined) parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  const value = parts.join(', ');

  return (_req, res, next) => {
    res.set('Cache-Control', value);
    next();
  };
}

// Forzar no-cache en endpoints autenticados o que cambian con cada request.
export function noStore(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
