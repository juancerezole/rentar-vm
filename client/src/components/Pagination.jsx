import { ChevronLeft, ChevronRight } from 'lucide-react';

function buildPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const near = new Set([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...near].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);

  const btn = 'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={`${btn} border border-ink-200 dark:border-night-border text-ink-500 dark:text-night-muted hover:bg-ink-50 dark:hover:bg-night-elevated disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-9 h-9 inline-flex items-center justify-center text-ink-400 dark:text-night-dim text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page
                ? 'bg-brand dark:bg-accent-orange text-white border border-brand dark:border-accent-orange shadow-sm'
                : 'border border-ink-200 dark:border-night-border text-ink-600 dark:text-night-muted hover:bg-ink-50 dark:hover:bg-night-elevated'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
        className={`${btn} border border-ink-200 dark:border-night-border text-ink-500 dark:text-night-muted hover:bg-ink-50 dark:hover:bg-night-elevated disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
