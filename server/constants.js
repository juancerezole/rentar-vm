// Constantes no configurables por env (no tienen razón de variar por ambiente).
// Para valores que sí dependen del ambiente (URLs, secretos, límites de pool),
// usar config.js.

export const BCRYPT_COST = 10;

export const MAX_IMAGES_PER_PROPERTY = 10;

// Token de password reset expira en 1 hora.
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Límite del body parseado por express.json — sube si subís imágenes en base64
// (no es el caso: las imágenes van por Cloudinary directo desde el browser).
export const JSON_BODY_LIMIT = '2mb';
