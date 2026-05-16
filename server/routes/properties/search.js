import { Router } from 'express';
import { pool } from '../../db/index.js';
import { aiSearchLimiter } from '../../middleware/rateLimit.js';
import { wrap } from '../../utils/asyncHandler.js';

const router = Router();

// ── POST /ai-search — búsqueda en lenguaje natural (raw SQL) ──────────────
// Usa SQL crudo porque construye condiciones dinámicas no triviales (ej:
// "monoambiente" = tipo + ambientes). Las queries dinámicas siempre usan
// parámetros posicionales para evitar SQL injection.
router.post('/ai-search', aiSearchLimiter, wrap(async (req, res) => {
  const text = String(req.body?.text || '').toLowerCase();
  if (!text.trim()) return res.json({ properties: [], interpretation: null });

  const where  = [];
  const params = [];
  const interpretation = {};
  const addParam = (v) => { params.push(v); return `$${params.length}`; };

  // Tipo
  const tipoMap = {
    departamento: ['depto', 'departamento', 'departamentos'],
    casa:         ['casa', 'casas'],
    duplex:       ['duplex', 'dúplex'],
    monoambiente: ['monoambiente', 'mono ambiente'],
    comercial:    ['local', 'comercial', 'negocio'],
    cochera:      ['cochera', 'garage'],
    galpon:       ['galpon', 'galpón'],
    campo:        ['campo', 'quinta', 'chacra'],
    baulera:      ['baulera', 'depósito', 'deposito'],
  };
  for (const [tipo, kws] of Object.entries(tipoMap)) {
    if (kws.some(k => text.includes(k))) {
      if (tipo === 'monoambiente') {
        where.push(`p.tipo = 'departamento' AND p.ambientes = 1`);
        interpretation.tipo = 'monoambiente';
      } else {
        where.push(`p.tipo = ${addParam(tipo)}`);
        interpretation.tipo = tipo;
      }
      break;
    }
  }

  // Ambientes
  const ambMatch = text.match(/(\d+)\s*(?:amb|ambientes|dorm|dormitorios)/);
  if (ambMatch) {
    where.push(`p.ambientes = ${addParam(Number(ambMatch[1]))}`);
    interpretation.ambientes = Number(ambMatch[1]);
  }

  // Precio máximo ("hasta 300mil", "hasta $300.000", "menos de 250000")
  const precioMatch = text.match(/(?:hasta|menos de|max\.?|menor a)\s*\$?\s*([\d.]+)\s*(mil|k)?/);
  if (precioMatch) {
    let v = Number(precioMatch[1].replace(/\./g, ''));
    if (precioMatch[2]) v *= 1000;
    where.push(`p.precio <= ${addParam(v)}`);
    interpretation.precio_max = v;
  }

  // Barrio — consultamos la tabla para no hardcodear los nombres
  const { rows: barrioRows } = await pool.query('SELECT nombre FROM barrios');
  for (const b of barrioRows) {
    if (text.includes(b.nombre.toLowerCase())) {
      where.push(`p.barrio = ${addParam(b.nombre)}`);
      interpretation.barrio = b.nombre;
      break;
    }
  }

  // Toggles
  if (/mascot|perro|gato|pet/.test(text))   { where.push('p.mascotas = true');          interpretation.mascotas = true; }
  if (/amoblad|muebl/.test(text))           { where.push('p.amoblado = true');           interpretation.amoblado = true; }
  if (/sin garant[íi]a/.test(text))         { where.push(`p.garantia = 'sin'`);          interpretation.garantia = 'sin'; }
  if (/expensas?\s+inclu/.test(text))       { where.push('p.expensas_incluidas = true'); interpretation.expensas = true; }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const { rows } = await pool.query(`
    SELECT p.*, u.nombre AS publicador, u.empresa, u.telefono
    FROM properties p
    JOIN users u ON u.id = p.user_id
    ${whereClause}
    ORDER BY p.destacado DESC, p.created_at DESC
    LIMIT 24
  `, params);

  res.json({ properties: rows, interpretation, total: rows.length });
}));

// ── GET /cheapest-by-barrio — propiedad más barata de cada barrio ──────────
router.get('/cheapest-by-barrio', wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT * FROM (
      SELECT DISTINCT ON (p.barrio)
        p.*, u.nombre AS publicador, u.empresa
      FROM properties p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.barrio, p.precio ASC
    ) t
    ORDER BY t.precio ASC
  `);
  res.json({ properties: rows });
}));

export default router;
