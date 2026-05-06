import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authRequired, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { nombre, email, password, rol = 'usuario', empresa, telefono } = req.body || {};
  if (!nombre || !email || !password) return res.status(400).json({ error: 'faltan campos' });
  if (!['usuario', 'inmobiliaria'].includes(rol)) return res.status(400).json({ error: 'rol invalido' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'email ya registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (nombre, email, password_hash, rol, empresa, telefono) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(nombre, email, hash, rol, empresa || null, telefono || null);

  const user = db.prepare('SELECT id, nombre, email, rol, empresa, telefono FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  res.json({ token: signToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'faltan campos' });
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'credenciales invalidas' });
  }
  const user = { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, empresa: row.empresa, telefono: row.telefono };
  res.json({ token: signToken(user), user });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, nombre, email, rol, empresa, telefono FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'usuario no encontrado' });
  res.json({ user });
});

export default router;
