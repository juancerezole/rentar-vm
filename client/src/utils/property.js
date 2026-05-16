// % de descuento entre el precio anterior y el actual.
// Devuelve 0 si no hay precio anterior o si no representa una rebaja real.
export function calcularDescuento(property) {
  if (!property?.precio_anterior || property.precio_anterior <= property.precio) {
    return 0;
  }
  return Math.round(((property.precio_anterior - property.precio) / property.precio_anterior) * 100);
}
