import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authRequired, signToken } from '../middleware/auth.js';

// Almacenamiento en memoria — aceptable para un solo servidor.
// Al escalar a múltiples instancias, reemplazar con RedisStore.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta IP. Esperá 1 hora.' },
});

const router = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

const PUBLIC_FIELDS = {
  id:       users.id,
  nombre:   users.nombre,
  email:    users.email,
  rol:      users.rol,
  empresa:  users.empresa,
  telefono: users.telefono,
};

router.post('/register', registerLimiter, wrap(async (req, res) => {
  const { nombre, email, password, rol = 'usuario', empresa, telefono } = req.body || {};
  if (!nombre || !email || !password) return res.status(400).json({ error: 'faltan campos' });
  if (!['usuario', 'inmobiliaria'].includes(rol)) return res.status(400).json({ error: 'rol invalido' });

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (exists) return res.status(409).json({ error: 'email ya registrado' });

  const [user] = await db.insert(users).values({
    nombre,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    rol,
    empresa:  empresa  || null,
    telefono: telefono || null,
  }).returning(PUBLIC_FIELDS);

  res.json({ token: signToken(user), user });
}));

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'faltan campos' });

  const [row] = await db.select().from(users).where(eq(users.email, email));
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'credenciales invalidas' });
  }

  const user = { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, empresa: row.empresa, telefono: row.telefono };
  res.json({ token: signToken(user), user });
}));

router.get('/me', authRequired, wrap(async (req, res) => {
  const [user] = await db.select(PUBLIC_FIELDS).from(users).where(eq(users.id, req.user.id));
  if (!user) return res.status(404).json({ error: 'usuario no encontrado' });
  res.json({ user });
}));

export default router;
