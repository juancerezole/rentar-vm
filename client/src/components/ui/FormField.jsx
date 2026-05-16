// Clase de inputs reutilizable en todos los formularios
export const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-sm focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 focus:border-brand-mid dark:focus:border-accent-orange outline-none transition';

// Label + campo agrupados
export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-700 dark:text-night-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
