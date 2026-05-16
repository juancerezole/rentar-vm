import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, Sparkles, Heart } from 'lucide-react';
import { formatPrice, tipoLabel } from '../api.js';
import { calcularDescuento } from '../utils/property.js';

const TIPO_COLORS = {
  departamento: 'bg-brand text-white',
  casa:         'bg-brand-soft text-brand border border-brand-border dark:bg-night-elevated dark:text-brand-mid dark:border-night-border',
  duplex:       'bg-accent-orange text-white',
  comercial:    'bg-brand-mid text-white',
  oficina:      'bg-brand-mid text-white',
  cochera:      'bg-ink-700 text-white',
  galpon:       'bg-ink-900 text-white',
  baulera:      'bg-ink-100 text-ink-700 dark:bg-night-border dark:text-night-muted',
  campo:        'bg-success text-white',
  contenedor:   'bg-accent-gold text-white',
};

export default function PropertyCard({ property }) {
  const p = property;
  const descuento = calcularDescuento(p);

  const tags = [];
  if (p.garantia === 'sin')      tags.push({ t: 'Sin garantía',    c: 'bg-success-soft text-success border-success-border dark:bg-success/10 dark:text-success dark:border-success/25' });
  if (p.mascotas)                tags.push({ t: 'Mascotas OK',     c: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30' });
  if (p.amoblado)                tags.push({ t: 'Amoblado',        c: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-700/30' });
  if (p.expensas_incluidas)      tags.push({ t: 'Expensas inc.',   c: 'bg-success-soft text-success border-success-border dark:bg-success/10 dark:text-success dark:border-success/25' });

  const tipoCls = TIPO_COLORS[p.tipo] || 'bg-ink-700 text-white';

  return (
    <Link
      to={`/propiedad/${p.id}`}
      className="group bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border hover:border-brand-border dark:hover:border-accent-orange/30 hover:shadow-card dark:hover:shadow-dark-card transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-ink-100 dark:bg-night-elevated overflow-hidden">
        {p.imagen ? (
          <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 dark:text-night-dim text-sm">Sin foto</div>
        )}
        <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-soft ${tipoCls}`}>
          {tipoLabel(p.tipo)}
        </span>
        {p.destacado && (
          <span className="absolute top-3 left-3 mt-7 inline-flex items-center gap-1 bg-accent-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft">
            <Sparkles className="w-3 h-3" /> Destacado
          </span>
        )}
        {descuento > 0 && (
          <span className="absolute top-3 right-12 bg-accent-orange text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-soft">
            -{descuento}%
          </span>
        )}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 dark:bg-night-elevated/95 hover:bg-white dark:hover:bg-night-elevated flex items-center justify-center shadow-soft transition"
        >
          <Heart className="w-3.5 h-3.5 text-ink-400 dark:text-night-muted" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-widest font-bold text-brand-mid dark:text-accent-orange">{p.barrio}</div>
        <h3 className="font-semibold text-ink-900 dark:text-night-text line-clamp-1 mt-0.5 text-[15px]">{p.titulo}</h3>
        <div className="flex items-center gap-1 text-xs text-ink-400 dark:text-night-dim mt-0.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{p.direccion}</span>
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-ink-900 dark:text-night-text tracking-tight">{formatPrice(p.precio)}</span>
          <span className="text-[11px] text-ink-400 dark:text-night-dim font-medium">/mes</span>
          {p.precio_anterior && p.precio_anterior > p.precio && (
            <span className="text-xs text-ink-300 dark:text-night-dim line-through">{formatPrice(p.precio_anterior)}</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 py-2.5 border-y border-ink-100 dark:border-night-border text-xs text-ink-500 dark:text-night-muted">
          <span className="inline-flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5 text-ink-400 dark:text-night-dim" /> {p.ambientes} amb.</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="w-3.5 h-3.5 text-ink-400 dark:text-night-dim" /> {p.banos}</span>
          <span className="inline-flex items-center gap-1.5"><Maximize className="w-3.5 h-3.5 text-ink-400 dark:text-night-dim" /> {p.superficie}m²</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {tags.map((tg, i) => (
              <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tg.c}`}>
                {tg.t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
