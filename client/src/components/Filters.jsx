import { Search, RotateCcw } from 'lucide-react';
import { TIPOS } from '../api.js';

const AMBIENTES = ['1', '2', '3', '4', '5+'];

export default function Filters({ filters, setFilters, barrios, onClear }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border p-5 shadow-soft space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900 dark:text-night-text text-[15px]">Filtros</h3>
        <button
          onClick={onClear}
          className="text-xs inline-flex items-center gap-1 text-ink-400 dark:text-night-dim hover:text-ink-700 dark:hover:text-night-muted transition"
        >
          <RotateCcw className="w-3 h-3" /> Limpiar
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-night-dim" />
        <input
          value={filters.q || ''}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Título, dirección..."
          className={inputCls}
        />
      </div>

      <Group label="Tipo de propiedad">
        <div className="flex flex-wrap gap-1.5">
          {TIPOS.map(t => (
            <button
              key={t.v}
              type="button"
              onClick={() => set('tipo', filters.tipo === t.v ? '' : t.v)}
              className={`text-xs font-medium rounded-full border px-2.5 py-1 transition
                ${filters.tipo === t.v
                  ? 'bg-brand dark:bg-accent-orange text-white border-brand dark:border-accent-orange shadow-soft'
                  : 'bg-white dark:bg-night-elevated text-ink-500 dark:text-night-muted border-ink-200 dark:border-night-border hover:border-brand-border dark:hover:border-accent-orange/40 hover:text-ink-900 dark:hover:text-night-text'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Ambientes">
        <div className="grid grid-cols-5 gap-1">
          {AMBIENTES.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => set('ambientes', filters.ambientes === a ? '' : a)}
              className={`py-1.5 text-sm font-semibold rounded-lg border transition
                ${filters.ambientes === a
                  ? 'bg-brand dark:bg-accent-orange text-white border-brand dark:border-accent-orange shadow-soft'
                  : 'bg-white dark:bg-night-elevated text-ink-500 dark:text-night-muted border-ink-200 dark:border-night-border hover:border-brand-border dark:hover:border-accent-orange/40'
                }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Precio mensual">
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Mín." value={filters.minPrecio || ''} onChange={e => set('minPrecio', e.target.value)} className={priceCls} />
          <input type="number" placeholder="Máx." value={filters.maxPrecio || ''} onChange={e => set('maxPrecio', e.target.value)} className={priceCls} />
        </div>
      </Group>

      <Group label="Barrio">
        <select
          value={filters.barrio || ''}
          onChange={(e) => set('barrio', e.target.value)}
          className={selectCls}
        >
          <option value="">Todos los barrios</option>
          {barrios.map(b => (
            <option key={b.id} value={b.nombre}>{b.nombre} ({b.cantidad})</option>
          ))}
        </select>
      </Group>

      <Group label="Garantía">
        <div className="space-y-1">
          {[
            { v: 'requerida', l: 'Con garantía' },
            { v: 'sin',      l: 'Sin garantía' },
            { v: 'ambas',    l: 'Ambas opciones' },
          ].map(g => {
            const sel = filters.garantia === g.v;
            return (
              <button
                key={g.v}
                type="button"
                onClick={() => set('garantia', sel ? '' : g.v)}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition text-left
                  ${sel
                    ? 'bg-brand-soft dark:bg-accent-orange/10 text-brand dark:text-accent-orange border-brand-border dark:border-accent-orange/35'
                    : 'bg-white dark:bg-night-elevated text-ink-500 dark:text-night-muted border-ink-200 dark:border-night-border hover:border-brand-border dark:hover:border-accent-orange/30'
                  }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition ${sel ? 'border-brand dark:border-accent-orange bg-brand dark:bg-accent-orange' : 'border-ink-300 dark:border-night-dim'}`} />
                {g.l}
              </button>
            );
          })}
        </div>
      </Group>

      <div className="border-t border-ink-100 dark:border-night-border pt-4 space-y-1.5">
        <Toggle label="Acepta mascotas" sub="Solo pet-friendly" value={filters.mascotas === 'true'} onChange={v => set('mascotas', v ? 'true' : '')} />
        <Toggle label="Expensas incluidas" value={filters.expensas === 'true'} onChange={v => set('expensas', v ? 'true' : '')} />
        <Toggle label="Amoblado" value={filters.amoblado === 'true'} onChange={v => set('amoblado', v ? 'true' : '')} />
      </div>
    </div>
  );
}

const inputCls = 'w-full pl-9 pr-3 py-2.5 rounded-xl border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-sm placeholder:text-ink-400 dark:placeholder:text-night-dim focus:border-brand-mid dark:focus:border-accent-orange focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 outline-none transition';
const priceCls = 'w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-sm text-center focus:border-brand-mid dark:focus:border-accent-orange focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 outline-none transition';
const selectCls = 'w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-sm focus:border-brand-mid dark:focus:border-accent-orange focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 outline-none transition';

function Group({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 dark:text-night-dim mb-2">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ label, sub, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-1.5 text-left">
      <div>
        <div className="text-sm font-medium text-ink-700 dark:text-night-muted">{label}</div>
        {sub && <div className="text-[10px] text-ink-400 dark:text-night-dim">{sub}</div>}
      </div>
      <span className={`w-9 h-5 rounded-full relative transition-colors ${value ? 'bg-brand-mid dark:bg-accent-orange' : 'bg-ink-200 dark:bg-night-border'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
