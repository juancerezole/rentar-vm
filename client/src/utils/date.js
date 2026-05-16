const TZ = 'America/Argentina/Buenos_Aires';

// "15 may. 2026"
export function formatDate(date) {
  return new Intl.DateTimeFormat('es-AR', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
    timeZone: TZ,
  }).format(new Date(date));
}

// "15 may. 2026, 14:30"
export function formatDateTime(date) {
  return new Intl.DateTimeFormat('es-AR', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(date));
}

// "hace 3 días" / "hace 2 horas"
export function formatRelative(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'ahora mismo';
  if (mins < 60)  return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days < 30)  return `hace ${days} días`;
  return formatDate(date);
}
