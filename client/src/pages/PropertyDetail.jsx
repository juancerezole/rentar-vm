import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice, tipoLabel } from '../api.js';
import { ArrowLeft, MapPin, BedDouble, Bath, Maximize, Phone, Mail, Building2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const [p, setP]         = useState(null);
  const [err, setErr]     = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => { setP(r.data.property); setCurrent(0); })
      .catch(() => setErr(true));
  }, [id]);

  if (err) return (
    <div className="max-w-3xl mx-auto p-8 text-center text-ink-400 dark:text-night-dim">
      Propiedad no encontrada.
    </div>
  );
  if (!p) return (
    <div className="max-w-3xl mx-auto p-8 text-center text-ink-400 dark:text-night-dim">
      Cargando...
    </div>
  );

  const desc = p.precio_anterior && p.precio_anterior > p.precio
    ? Math.round(((p.precio_anterior - p.precio) / p.precio_anterior) * 100) : 0;

  const photos = p.images?.length > 0
    ? p.images.map(i => i.url)
    : p.imagen ? [p.imagen] : [];

  const mainPhoto = photos[current] ?? null;

  function prev() { setCurrent(c => (c - 1 + photos.length) % photos.length); }
  function next() { setCurrent(c => (c + 1) % photos.length); }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-night-muted hover:text-ink-900 dark:hover:text-night-text mb-5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al listado
      </Link>

      <div className="bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border shadow-soft dark:shadow-dark-card overflow-hidden">

        {/* Galería de fotos */}
        <div className="aspect-[16/9] bg-ink-100 dark:bg-night-elevated relative group">
          {mainPhoto ? (
            <img src={mainPhoto} alt={p.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-300 dark:text-night-dim text-sm">
              Sin fotos
            </div>
          )}
          {p.destacado && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-accent-gold text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-soft">
              <Sparkles className="w-3.5 h-3.5" /> Destacado
            </span>
          )}
          {desc > 0 && (
            <span className="absolute top-4 right-4 bg-accent-orange text-white text-sm font-bold px-3 py-1 rounded-full shadow-soft">
              -{desc}% liquidación
            </span>
          )}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-1.5 h-1.5 rounded-full transition ${i === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tiras de miniaturas */}
        {photos.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-thin border-b border-ink-100 dark:border-night-border bg-ink-50 dark:bg-night-elevated">
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${
                  i === current
                    ? 'border-brand dark:border-accent-orange shadow-soft'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="text-[10px] uppercase tracking-widest font-bold text-brand-mid dark:text-accent-orange">{tipoLabel(p.tipo)}</div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900 dark:text-night-text mt-1.5">{p.titulo}</h1>
            <div className="flex items-center gap-1.5 text-ink-400 dark:text-night-dim mt-1 text-sm">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{p.direccion} · {p.barrio}, Villa María</span>
            </div>

            <div className="flex flex-wrap gap-4 mt-6 pb-6 border-b border-ink-100 dark:border-night-border">
              <Spec icon={<BedDouble className="w-5 h-5" />} label="Ambientes" value={p.ambientes} />
              <Spec icon={<Bath className="w-5 h-5" />} label="Baños" value={p.banos} />
              <Spec icon={<Maximize className="w-5 h-5" />} label="Superficie" value={`${p.superficie} m²`} />
            </div>

            <h2 className="text-base font-bold text-ink-900 dark:text-night-text mt-5">Descripción</h2>
            <p className="text-ink-500 dark:text-night-muted mt-2 whitespace-pre-line leading-relaxed text-sm">{p.descripcion || 'Sin descripción.'}</p>

            <div className="flex flex-wrap gap-2 mt-5">
              {p.garantia === 'sin'      && <Tag color="success">Sin garantía</Tag>}
              {p.garantia === 'requerida' && <Tag color="neutral">Requiere garantía</Tag>}
              {p.garantia === 'ambas'    && <Tag color="blue">Acepta garantía o seguro</Tag>}
              {p.mascotas               && <Tag color="amber">Acepta mascotas</Tag>}
              {p.amoblado               && <Tag color="sky">Amoblado</Tag>}
              {p.expensas_incluidas     && <Tag color="success">Expensas incluidas</Tag>}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-brand-soft dark:bg-night-elevated border border-brand-border dark:border-night-border rounded-2xl p-5 sticky top-24">
              <div className="text-[10px] text-ink-400 dark:text-night-dim uppercase tracking-widest font-semibold">Precio mensual</div>
              <div className="text-3xl font-bold text-brand dark:text-accent-orange mt-1">{formatPrice(p.precio)}</div>
              {p.precio_anterior && p.precio_anterior > p.precio && (
                <div className="text-sm text-ink-300 dark:text-night-dim line-through mt-0.5">{formatPrice(p.precio_anterior)}</div>
              )}

              <div className="mt-5 pt-5 border-t border-brand-border dark:border-night-border">
                <div className="text-[10px] text-ink-400 dark:text-night-dim uppercase tracking-widest font-bold mb-2">Publicado por</div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-mid dark:text-accent-orange" />
                  <span className="font-semibold text-ink-900 dark:text-night-text">{p.empresa || p.publicador}</span>
                </div>
                {p.telefono && (
                  <a href={`tel:${p.telefono}`} className="flex items-center gap-2 text-sm text-ink-500 dark:text-night-muted mt-2 hover:text-brand dark:hover:text-accent-orange transition">
                    <Phone className="w-4 h-4" /> {p.telefono}
                  </a>
                )}
                {p.contacto_email && (
                  <a href={`mailto:${p.contacto_email}`} className="flex items-center gap-2 text-sm text-ink-500 dark:text-night-muted mt-1 hover:text-brand dark:hover:text-accent-orange transition">
                    <Mail className="w-4 h-4" /> {p.contacto_email}
                  </a>
                )}
              </div>

              <button className="w-full bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 text-white font-semibold py-2.5 rounded-xl mt-5 transition shadow-soft">
                Solicitar más información
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-xl bg-brand-soft dark:bg-night-elevated flex items-center justify-center text-brand-mid dark:text-accent-orange">
        {icon}
      </div>
      <div>
        <div className="text-xs text-ink-400 dark:text-night-dim">{label}</div>
        <div className="font-semibold text-ink-900 dark:text-night-text">{value}</div>
      </div>
    </div>
  );
}

function Tag({ children, color }) {
  const map = {
    success: 'bg-success-soft text-success border border-success-border dark:bg-success/10 dark:text-success dark:border-success/25',
    neutral: 'bg-ink-100 text-ink-600 border border-ink-200 dark:bg-night-border dark:text-night-muted dark:border-night-border',
    blue:    'bg-brand-soft text-brand border border-brand-border dark:bg-accent-orange/10 dark:text-accent-orange dark:border-accent-orange/25',
    amber:   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30',
    sky:     'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-700/30',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}
