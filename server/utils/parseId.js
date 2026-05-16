// Valida y parsea un :id de URL. Devuelve null si no es un entero positivo.
export function parseId(param) {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}
