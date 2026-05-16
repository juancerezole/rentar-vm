import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { NOTIFY_EVENT } from '../utils/notify.js';

const ICONS = {
  error:   { Icon: AlertCircle,    cls: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400' },
  success: { Icon: CheckCircle2,   cls: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-400' },
  info:    { Icon: Info,           cls: 'bg-brand-soft border-brand-border text-brand dark:bg-night-elevated dark:border-night-border dark:text-night-text' },
};

const AUTO_DISMISS_MS = 5000;

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onNotify(e) {
      const id = Date.now() + Math.random();
      setItems(s => [...s, { id, ...e.detail }]);
      setTimeout(() => {
        setItems(s => s.filter(i => i.id !== id));
      }, AUTO_DISMISS_MS);
    }
    window.addEventListener(NOTIFY_EVENT, onNotify);
    return () => window.removeEventListener(NOTIFY_EVENT, onNotify);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {items.map(item => {
        const { Icon, cls } = ICONS[item.type] ?? ICONS.info;
        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card animate-fadeIn ${cls}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="flex-1 text-sm">{item.message}</span>
            <button
              onClick={() => setItems(s => s.filter(i => i.id !== item.id))}
              className="opacity-60 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
