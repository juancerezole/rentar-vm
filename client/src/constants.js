// Constantes compartidas en el cliente. Si una constante también vive en el
// server (ej. MAX_IMAGES_PER_PROPERTY), el server es la source of truth —
// validar siempre del lado del server, el cliente sólo lo usa para UX.

export const MAX_IMAGES_PER_PROPERTY = 10;
export const MAX_UPLOAD_MB           = 5;

// Tamaños de página por defecto para tablas/dashboards. Los listados públicos
// usan 24 (cards en grid de 3).
export const PAGE_SIZE_DASHBOARD = 24;
export const PAGE_SIZE_TABLE     = 25;
