import { eq, getTableColumns } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { properties as propsTable, users, ciudades, barrios } from '../../db/schema.js';

export { propsTable, users };

// Ciudad por defecto (Villa María). Se resuelve una sola vez y se cachea.
// Si más adelante se soportan múltiples ciudades, se invalida el cache y se
// resuelve por request (ej: header o subdomain).
let _defaultCiudadId = null;
export async function getDefaultCiudadId() {
  if (_defaultCiudadId) return _defaultCiudadId;
  const [c] = await db.select({ id: ciudades.id })
    .from(ciudades)
    .where(eq(ciudades.slug, 'villa-maria'));
  if (!c) throw new Error('Ciudad "villa-maria" no encontrada. ¿Corriste el seed?');
  _defaultCiudadId = c.id;
  return _defaultCiudadId;
}

// Columnas de properties + campos públicos del publicador.
// Reutilizado por el listado y el detalle.
export const propWithUser = () => ({
  ...getTableColumns(propsTable),
  publicador:     users.nombre,
  empresa:        users.empresa,
  telefono:       users.telefono,
  contacto_email: users.email,
});

// Cache de barrios → id. Los barrios son configuración del sistema y casi
// nunca cambian, así que cachear es seguro. Si en el futuro se agregan en
// runtime, exponer un invalidate.
let _barrioMap = null;
export async function resolveBarrioId(nombre) {
  if (!nombre) return null;
  if (!_barrioMap) {
    const rows = await db.select({ id: barrios.id, nombre: barrios.nombre }).from(barrios);
    _barrioMap = Object.fromEntries(rows.map(b => [b.nombre, b.id]));
  }
  return _barrioMap[nombre] ?? null;
}
