import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, Sparkles, Heart } from 'lucide-react';
import { formatPrice, tipoLabel } from '../api.js';

const TIPO_COLORS = {
  departamento: 'bg-brand text-white',
  casa: 'bg-emerald-50 text-brand border border-brand-border',
  duplex: 'bg-accent-orange text-white',
  comercial: 'bg-accent-blue text-white',
  oficina: 'bg-accent-blue text-white',
  cochera: 'bg-ink-700 text-white',
  galpon: 'bg-ink-900 text-white',
  baulera: 'bg-ink-100 text-ink-700',
  campo: 'bg-emerald-700 text-white',
  contenedor: 'bg-accent-gold text-white',
};

export default function PropertyCard({ property }) {
  const p = property;
  const descuento = p.precio_anterior && p.precio_anterior > p.precio
    ? Math.round(((p.precio_anterior - p.precio) / p.precio_anterior) * 100)
    : 0;

  const tags = [];
  if (p.garantia === 'sin') tags.push({ t: 'Sin garantía', c: 'bg-emerald-50 text-brand border-brand-border' });
  if (p.mascotas) tags.push({ t: 'Mascotas OK', c: 'bg-amber-50 text-amber-800 border-amber-200' });
  if (p.amoblado) tags.push({ t: 'Amoblado', c: 'bg-sky-50 text-sky-800 border-sky-200' });
  if (p.expensas_incluidas) tags.push({ t: 'Expensas inc.', c: 'bg-emerald-50 text-brand border-brand-border' });

  const tipoCls = TIPO_COLORS[p.tipo] || 'bg-ink-700 text-white';

  return (
    <Link to={`/propiedad/${p.id}`} className="group bg-white rounded-2xl border border-ink-200 hover:border-ink-300 hover:shadow-card transition overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-ink-100 overflow-hidden">
        {p.imagen ? (
          <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300">Sin foto</div>
        )}
        <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-soft ${tipoCls}`}>
          {tipoLabel(p.tipo)}
        </span>
        {p.destacado ? (
          <span className="absolute top-3 left-3 mt-7 inline-flex items-center gap-1 bg-accent-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            <Sparkles className="w-3 h-3" /> Destacado
          </span>
        ) : null}
        {descuento > 0 && (
          <span className="absolute top-3 right-12 bg-accent-orange text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow">
            -{descuento}%
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-soft">
          <Heart className="w-3.5 h-3.5 text-ink-500" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[11px] uppercase tracking-wider font-bold text-brand">{p.barrio}</div>
        <h3 className="font-bold text-ink-900 line-clamp-1 mt-0.5">{p.titulo}</h3>
        <div className="flex items-center gap-1 text-xs text-ink-400 mt-0.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{p.direccion}</span>
        </div>

        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-2xl font-extrabold text-ink-900 tracking-tight">{formatPrice(p.precio)}</span>
          <span className="text-[11px] text-ink-400">/mes</span>
          {p.precio_anterior && p.precio_anterior > p.precio && (
            <span className="text-xs text-ink-300 line-through">{formatPrice(p.precio_anterior)}</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 py-2 border-y border-ink-100 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.ambientes} amb.</span>
          <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.banos}</span>
          <span className="inline-flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {p.superficie}m²</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {tags.map((tg, i) => (
              <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tg.c}`}>{tg.t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
