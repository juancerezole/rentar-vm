import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice, tipoLabel } from '../api.js';
import { ArrowLeft, MapPin, BedDouble, Bath, Maximize, Phone, Mail, Building2, Sparkles } from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => setP(r.data.property))
      .catch(() => setErr(true));
  }, [id]);

  if (err) return (
    <div className="max-w-3xl mx-auto p-8 text-center text-ink-400">
      Propiedad no encontrada.
    </div>
  );
  if (!p) return (
    <div className="max-w-3xl mx-auto p-8 text-center text-ink-400">
      Cargando...
    </div>
  );

  const desc = p.precio_anterior && p.precio_anterior > p.precio
    ? Math.round(((p.precio_anterior - p.precio) / p.precio_anterior) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al listado
      </Link>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
        <div className="aspect-[16/9] bg-ink-100 relative">
          {p.imagen && (
            <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover" />
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
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="text-[10px] uppercase tracking-widest font-bold text-brand-mid">{tipoLabel(p.tipo)}</div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900 mt-1.5">{p.titulo}</h1>
            <div className="flex items-center gap-1.5 text-ink-400 mt-1 text-sm">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{p.direccion} · {p.barrio}, Villa María</span>
            </div>

            <div className="flex flex-wrap gap-4 mt-6 pb-6 border-b border-ink-100">
              <Spec icon={<BedDouble className="w-5 h-5" />} label="Ambientes" value={p.ambientes} />
              <Spec icon={<Bath className="w-5 h-5" />} label="Baños" value={p.banos} />
              <Spec icon={<Maximize className="w-5 h-5" />} label="Superficie" value={`${p.superficie} m²`} />
            </div>

            <h2 className="text-base font-bold text-ink-900 mt-5">Descripción</h2>
            <p className="text-ink-500 mt-2 whitespace-pre-line leading-relaxed text-sm">{p.descripcion || 'Sin descripción.'}</p>

            <div className="flex flex-wrap gap-2 mt-5">
              {p.garantia === 'sin' && <Tag color="success">Sin garantía</Tag>}
              {p.garantia === 'requerida' && <Tag color="neutral">Requiere garantía</Tag>}
              {p.garantia === 'ambas' && <Tag color="blue">Acepta garantía o seguro</Tag>}
              {p.mascotas && <Tag color="amber">Acepta mascotas</Tag>}
              {p.amoblado && <Tag color="sky">Amoblado</Tag>}
              {p.expensas_incluidas && <Tag color="success">Expensas incluidas</Tag>}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-brand-soft border border-brand-border rounded-2xl p-5 sticky top-24">
              <div className="text-xs text-ink-400 uppercase tracking-wide font-semibold">Precio mensual</div>
              <div className="text-3xl font-bold text-brand mt-1">{formatPrice(p.precio)}</div>
              {p.precio_anterior && p.precio_anterior > p.precio && (
                <div className="text-sm text-ink-300 line-through mt-0.5">{formatPrice(p.precio_anterior)}</div>
              )}

              <div className="mt-5 pt-5 border-t border-brand-border">
                <div className="text-[10px] text-ink-400 uppercase tracking-widest font-bold mb-2">Publicado por</div>
                <div className="flex items-center gap-2 text-ink-700">
                  <Building2 className="w-4 h-4 text-brand-mid" />
                  <span className="font-semibold text-ink-900">{p.empresa || p.publicador}</span>
                </div>
                {p.telefono && (
                  <a
                    href={`tel:${p.telefono}`}
                    className="flex items-center gap-2 text-sm text-ink-500 mt-2 hover:text-brand transition"
                  >
                    <Phone className="w-4 h-4" /> {p.telefono}
                  </a>
                )}
                {p.contacto_email && (
                  <a
                    href={`mailto:${p.contacto_email}`}
                    className="flex items-center gap-2 text-sm text-ink-500 mt-1 hover:text-brand transition"
                  >
                    <Mail className="w-4 h-4" /> {p.contacto_email}
                  </a>
                )}
              </div>

              <button className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl mt-5 transition shadow-soft">
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
      <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand-mid">
        {icon}
      </div>
      <div>
        <div className="text-xs text-ink-400">{label}</div>
        <div className="font-semibold text-ink-900">{value}</div>
      </div>
    </div>
  );
}

function Tag({ children, color }) {
  const map = {
    success: 'bg-success-soft text-success border border-success-border',
    neutral: 'bg-ink-100 text-ink-600 border border-ink-200',
    blue: 'bg-brand-soft text-brand border border-brand-border',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    sky: 'bg-sky-50 text-sky-700 border border-sky-200',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}
