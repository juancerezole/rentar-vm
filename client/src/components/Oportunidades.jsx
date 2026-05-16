import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice, tipoLabel } from '../api.js';
import { calcularDescuento } from '../utils/property.js';
import { Flame, TrendingDown } from 'lucide-react';

export default function Oportunidades() {
  const [liquidacion, setLiquidacion] = useState([]);
  const [cheapest, setCheapest] = useState([]);

  useEffect(() => {
    api.get('/properties', { params: { liquidacion: 'true' } }).then(r => setLiquidacion(r.data.properties ?? [])).catch(console.error);
    api.get('/properties/cheapest-by-barrio').then(r => setCheapest(r.data.properties ?? [])).catch(console.error);
  }, []);

  return (
    <section className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-3xl text-ink-900 leading-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-accent-orange" /> En liquidación
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest text-accent-orange">{liquidacion.length} propiedades</span>
        </div>
        <p className="text-sm text-ink-500 mb-4">Precios bajados por la inmobiliaria. Disponibilidad limitada — actualizadas diariamente.</p>

        {liquidacion.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-10 text-center text-ink-500">
            No hay propiedades en liquidación por ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liquidacion.map(p => {
              const desc = calcularDescuento(p);
              return (
                <Link key={p.id} to={`/propiedad/${p.id}`} className="group bg-white rounded-2xl border border-accent-orange-border hover:border-accent-orange shadow-soft hover:shadow-card transition overflow-hidden">
                  <div className="relative h-32 bg-ink-100 overflow-hidden">
                    {p.imagen && <img src={p.imagen} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />}
                    <span className="absolute top-0 left-0 bg-accent-orange text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-br-lg">Liquidación</span>
                    {desc > 0 && (
                      <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-extrabold px-2 py-0.5 rounded-full backdrop-blur">−{desc}%</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-widest text-brand font-bold">{p.barrio}</div>
                    <h4 className="font-bold text-ink-900 mt-0.5 line-clamp-1">{p.titulo}</h4>
                    <div className="text-xs text-ink-500 mt-0.5">{p.direccion}</div>
                    <div className="flex items-baseline gap-2 mt-2.5">
                      <span className="text-xl font-extrabold text-accent-orange tracking-tight">{formatPrice(p.precio)}</span>
                      {p.precio_anterior && <span className="text-sm text-ink-300 line-through">{formatPrice(p.precio_anterior)}</span>}
                    </div>
                    <div className="text-xs text-brand font-semibold mt-1">Disponible de inmediato</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-3xl text-ink-900 leading-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-brand" /> Lo más económico por barrio
          </h2>
          <span className="text-xs text-ink-400">Actualizado al día</span>
        </div>
        <p className="text-sm text-ink-500 mb-4">El alquiler más bajo en cada zona de Villa María.</p>

        <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-ink-100">
            {cheapest.map(p => (
              <Link key={p.id} to={`/propiedad/${p.id}`} className="p-4 hover:bg-surface transition group">
                <div className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">{p.barrio}</div>
                <div className="text-2xl font-extrabold text-brand tracking-tight mt-1">{formatPrice(p.precio)}</div>
                <div className="text-[10px] text-ink-400">desde /mes</div>
                <div className="text-xs text-ink-500 mt-2 line-clamp-1">{tipoLabel(p.tipo)} · {p.ambientes} amb.</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
