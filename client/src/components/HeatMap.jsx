import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api, formatPrice } from '../api.js';

export default function HeatMap({ onSelect }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/barrios/heatmap').then(r => setData(r.data.heatmap));
  }, []);

  if (!data.length) return null;

  function bgFor(intensidad) {
    // gradiente de verde claro a verde oscuro según intensidad de precio
    const palette = [
      'from-emerald-400 to-emerald-500',
      'from-emerald-500 to-emerald-600',
      'from-emerald-600 to-emerald-700',
      'from-emerald-700 to-emerald-800',
      'from-emerald-800 to-emerald-900',
    ];
    const idx = Math.min(palette.length - 1, Math.floor(intensidad * palette.length));
    return palette[idx];
  }

  const sorted = [...data].sort((a, b) => b.precio_promedio - a.precio_promedio);

  return (
    <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
      <div className="flex items-end justify-between mb-1">
        <h3 className="font-display text-2xl text-ink-900 leading-tight">Mapa de calor por barrio</h3>
        <div className="text-xs text-ink-400">Promedio depto + casa + dúplex</div>
      </div>
      <p className="text-sm text-ink-500 mb-4">Precio promedio mensual · variación vs mes anterior</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {sorted.map(b => {
          const trend = b.delta_pct > 0.5
            ? { Icon: TrendingUp, color: 'text-white' }
            : b.delta_pct < -0.5
            ? { Icon: TrendingDown, color: 'text-white' }
            : { Icon: Minus, color: 'text-white/70' };
          const Tr = trend.Icon;
          return (
            <button
              key={b.id}
              onClick={() => onSelect?.(b.nombre)}
              className={`text-left bg-gradient-to-br ${bgFor(b.intensidad)} rounded-xl p-3.5 hover:scale-[1.02] hover:shadow-card transition`}
            >
              <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{b.cantidad} prop.</div>
              <div className="text-white font-bold text-sm mt-0.5 mb-1.5">{b.nombre}</div>
              <div className="text-white text-lg font-extrabold leading-tight">
                {b.precio_promedio > 0 ? formatPrice(b.precio_promedio) : '—'}
              </div>
              <div className={`flex items-center gap-1 mt-1 text-[11px] ${trend.color}`}>
                <Tr className="w-3 h-3" />
                <span className="font-semibold">{b.delta_pct > 0 ? '+' : ''}{b.delta_pct}%</span>
                <span className="text-white/60">vs mes ant.</span>
              </div>
              <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white/60 rounded-full" style={{ width: `${Math.max(15, b.intensidad * 100)}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
