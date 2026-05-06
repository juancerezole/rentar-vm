// Borra el archivo de la DB para regenerar todo desde cero.
// Uso: npm run reset
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

const files = [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`, `${DB_PATH}-journal`];
let removed = 0;
for (const f of files) {
  try { fs.unlinkSync(f); removed++; console.log('[reset] borrado', path.basename(f)); }
  catch (e) { if (e.code !== 'ENOENT') console.error('[reset] error en', f, e.message); }
}
console.log(`[reset] ${removed} archivo(s) eliminado(s). Próximo "npm run dev" regenera el seed.`);
