export default function SectionTabs({ tabs, value, onChange }) {
  return (
    <div className="bg-white dark:bg-night-card border-b border-ink-200 dark:border-night-border sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 flex gap-0 overflow-x-auto scrollbar-thin">
        {tabs.map(t => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`relative shrink-0 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2
                ${active
                  ? 'text-brand dark:text-accent-orange border-brand dark:border-accent-orange font-semibold'
                  : 'text-ink-500 dark:text-night-muted hover:text-ink-900 dark:hover:text-night-text border-transparent hover:border-ink-200 dark:hover:border-night-border'
                }`}
            >
              {t.icon && <t.icon className="w-4 h-4" />}
              <span>{t.label}</span>
              {t.badge != null && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active
                    ? 'bg-accent-orange text-white'
                    : 'bg-ink-100 dark:bg-night-border text-ink-500 dark:text-night-muted'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
