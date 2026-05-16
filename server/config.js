// Configuración central del server.
// Valida y normaliza variables de entorno al boot — si falta algo crítico,
// el proceso falla acá antes de aceptar requests.
import 'dotenv/config';

function readEnv(name) {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

function requireEnv(name) {
  const v = readEnv(name);
  if (v === undefined) throw new Error(`Variable de entorno requerida: ${name}`);
  return v;
}

function parseBool(v, fallback = false) {
  if (v === undefined) return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(v).toLowerCase());
}

function parseInteger(v, fallback) {
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Valor inválido (se esperaba entero): ${v}`);
  }
  return n;
}

// trust proxy admite boolean, número de hops o string (IP/CIDR).
function parseTrustProxy(v) {
  if (v === undefined || v === '' || v.toLowerCase() === 'false') return false;
  if (v.toLowerCase() === 'true') return true;
  const n = Number(v);
  return Number.isInteger(n) ? n : v;
}

const env = readEnv('NODE_ENV') ?? 'development';
const isProd = env === 'production';
const isTest = env === 'test';

// En producción los secretos débiles dejan al sistema indefenso —
// fallamos al boot antes que aceptar un JWT_SECRET trivial.
function ensureStrongSecret(name, value) {
  if (!isProd) return value;
  const weak = ['dev-secret', 'changeme', 'secret', 'password', 'admin'];
  if (value.length < 32 || weak.includes(value.toLowerCase())) {
    throw new Error(`${name} no cumple los requisitos de producción (mínimo 32 caracteres, no triviales)`);
  }
  return value;
}

export const config = {
  env,
  isProd,
  isTest,

  port:         parseInteger(readEnv('PORT'), 4000),
  clientOrigin: readEnv('CLIENT_ORIGIN') ?? 'http://localhost:5173',
  trustProxy:   parseTrustProxy(readEnv('TRUST_PROXY') ?? (isProd ? '1' : 'false')),
  logLevel:     readEnv('LOG_LEVEL') ?? 'info',

  database: {
    url:     requireEnv('DATABASE_URL'),
    poolMax: parseInteger(readEnv('DB_POOL_MAX'), 10),
  },

  jwt: {
    secret:    ensureStrongSecret('JWT_SECRET', requireEnv('JWT_SECRET')),
    expiresIn: readEnv('JWT_EXPIRES_IN') ?? '7d',
  },

  cloudinary: {
    cloudName: readEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey:    readEnv('CLOUDINARY_API_KEY'),
    apiSecret: readEnv('CLOUDINARY_API_SECRET'),
    get enabled() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  email: {
    resendApiKey: readEnv('RESEND_API_KEY'),
    from:         readEnv('EMAIL_FROM') ?? 'Rentar <noreply@rentar.com.ar>',
  },

  seedData: parseBool(readEnv('SEED_DATA'), false),
};

export default config;
