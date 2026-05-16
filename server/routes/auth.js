import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { eq, and, gt, ilike } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';
import { db } from '../db/index.js';
import { users, passwordResetTokens } from '../db/schema.js';
import { authRequired, signToken } from '../middleware/auth.js';
import { sendPasswordReset } from '../services/email.js';
import { validate, registerSchema, loginSchema, forgotSchema, resetSchema } from '../middleware/validate.js';

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

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Esperá 1 hora e intentá de nuevo.' },
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

router.post('/register', registerLimiter, validate(registerSchema), wrap(async (req, res) => {
  const { nombre, password, rol, empresa, telefono } = req.body;
  const email = req.body.email.toLowerCase().trim();

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

router.post('/login', loginLimiter, validate(loginSchema), wrap(async (req, res) => {
  const { password } = req.body;
  const email = req.body.email.toLowerCase().trim();

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

// ── POST /forgot-password ─────────────────────────────────────────────────────
// Siempre devuelve el mismo mensaje para no revelar si el email existe o no.
router.post('/forgot-password', forgotLimiter, validate(forgotSchema), wrap(async (req, res) => {
  const { email } = req.body;

  const OK = { ok: true, message: 'Si el email está registrado, vas a recibir un link en breve.' };

  const [user] = await db
    .select({ id: users.id, nombre: users.nombre, email: users.email })
    .from(users)
    .where(ilike(users.email, email.trim()));

  if (!user) return res.json(OK); // email no existe — respuesta idéntica

  // Invalida tokens anteriores de este usuario
  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(and(
      eq(passwordResetTokens.user_id, user.id),
      eq(passwordResetTokens.used, false),
    ));

  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await db.insert(passwordResetTokens).values({
    user_id:    user.id,
    token,
    expires_at: expiresAt,
  });

  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;
  await sendPasswordReset(user.email, user.nombre, resetUrl);

  res.json(OK);
}));

// ── POST /reset-password ──────────────────────────────────────────────────────
router.post('/reset-password', validate(resetSchema), wrap(async (req, res) => {
  const { token, password } = req.body;

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      eq(passwordResetTokens.used, false),
      gt(passwordResetTokens.expires_at, new Date()),
    ));

  if (!record) return res.status(400).json({ error: 'El link expiró o ya fue utilizado.' });

  // Actualiza contraseña e invalida el token
  await Promise.all([
    db.update(users)
      .set({ password_hash: bcrypt.hashSync(password, 10) })
      .where(eq(users.id, record.user_id)),
    db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, record.id)),
  ]);

  res.json({ ok: true });
}));

export default router;
