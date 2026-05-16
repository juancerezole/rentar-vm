import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { eq, and, gt, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, passwordResetTokens } from '../db/schema.js';
import { authRequired, signToken } from '../middleware/auth.js';
import { sendPasswordReset } from '../services/email.js';
import { validate, registerSchema, loginSchema, forgotSchema, resetSchema } from '../middleware/validate.js';
import { loginLimiter, registerLimiter, forgotLimiter } from '../middleware/rateLimit.js';
import { wrap } from '../utils/asyncHandler.js';
import { BCRYPT_COST, PASSWORD_RESET_TOKEN_TTL_MS } from '../constants.js';

const router = Router();

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

  const password_hash = await bcrypt.hash(password, BCRYPT_COST);
  const [user] = await db.insert(users).values({
    nombre,
    email,
    password_hash,
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
  // compare contra un hash dummy si el usuario no existe, para que el tiempo
  // de respuesta sea similar entre email válido e inválido (mitiga timing leaks).
  const hash = row?.password_hash ?? '$2b$10$invalidhashinvalidhashinvalidhashinvalidhashinvalidhash';
  const valid = await bcrypt.compare(password, hash);
  if (!row || !valid) {
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
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

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

  const password_hash = await bcrypt.hash(password, BCRYPT_COST);
  await Promise.all([
    db.update(users)
      .set({ password_hash })
      .where(eq(users.id, record.user_id)),
    db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, record.id)),
  ]);

  res.json({ ok: true });
}));

export default router;
