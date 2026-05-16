import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, confirmLabel = 'Confirmar', danger = true, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 dark:bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-night-card rounded-2xl shadow-lg dark:shadow-dark-card max-w-sm w-full p-6 animate-fadeIn"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-brand-soft dark:bg-night-elevated'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-brand dark:text-accent-orange'}`} />
          </div>
          <div>
            <h3 className="font-bold text-ink-900 dark:text-night-text">{title}</h3>
            {message && <p className="text-sm text-ink-500 dark:text-night-muted mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-ink-200 dark:border-night-border text-ink-600 dark:text-night-muted hover:bg-ink-100 dark:hover:bg-night-elevated text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition shadow-soft ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
