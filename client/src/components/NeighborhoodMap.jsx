import { MapPin } from 'lucide-react';

export default function NeighborhoodMap({ barrios, selected, onSelect }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-200 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-2xl text-ink-900 leading-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand" /> Mapa interactivo
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">Hacé clic en un barrio para filtrar las propiedades disponibles</p>
        </div>
        {selected && (
          <button onClick={() => onSelect('')} className="text-xs px-3 py-1.5 rounded-full bg-brand-soft text-brand border border-brand-border font-semibold hover:bg-brand hover:text-white transition">
            {selected} ✕
          </button>
        )}
      </div>

      <div className="relative aspect-[5/3] bg-gradient-to-br from-surface to-ink-100 rounded-xl border border-ink-200 overflow-hidden">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cdd3cd" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#9BA69B" strokeWidth="0.4" strokeDasharray="2 2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#9BA69B" strokeWidth="0.4" strokeDasharray="2 2" />
        </svg>

        {barrios.map(b => {
          const active = selected === b.nombre;
          const hot = b.cantidad >= 3;
          return (
            <button
              key={b.id}
              onClick={() => onSelect(active ? '' : b.nombre)}
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center transition"
            >
              <span className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shadow-card transition
                ${active ? 'bg-brand text-white scale-110 ring-4 ring-brand-soft'
                  : hot ? 'bg-emerald-500 text-white hover:scale-110'
                  : 'bg-white text-ink-700 hover:bg-ink-100 border border-ink-200'}`}>
                {b.cantidad}
              </span>
              <span className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shadow-soft
                ${active ? 'bg-brand-dark text-white' : 'bg-white text-ink-700 border border-ink-200'}`}>
                {b.nombre}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500" /> 3+ propiedades</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-white border border-ink-300" /> 1-2 propiedades</span>
        <span className="ml-auto text-ink-400">Total: {barrios.reduce((a, b) => a + b.cantidad, 0)} propiedades</span>
      </div>
    </div>
  );
}
