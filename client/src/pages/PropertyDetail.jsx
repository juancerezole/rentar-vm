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

  if (err) return <div className="max-w-3xl mx-auto p-8 text-center text-slate-500">Propiedad no encontrada.</div>;
  if (!p) return <div className="max-w-3xl mx-auto p-8 text-center text-slate-500">Cargando...</div>;

  const desc = p.precio_anterior && p.precio_anterior > p.precio
    ? Math.round(((p.precio_anterior - p.precio) / p.precio_anterior) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver al listado
      </Link>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="aspect-[16/9] bg-slate-100 relative">
          {p.imagen && <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover" />}
          {p.destacado ? (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
              <Sparkles className="w-3.5 h-3.5" /> Destacado
            </span>
          ) : null}
          {desc > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
              -{desc}% en liquidación
            </span>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-wide text-brand font-bold">{tipoLabel(p.tipo)}</div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{p.titulo}</h1>
            <div className="flex items-center gap-1 text-slate-500 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{p.direccion} · {p.barrio}, Villa María</span>
            </div>

            <div className="flex flex-wrap gap-4 mt-5 pb-5 border-b">
              <Spec icon={<BedDouble className="w-5 h-5" />} label="Ambientes" value={p.ambientes} />
              <Spec icon={<Bath className="w-5 h-5" />} label="Baños" value={p.banos} />
              <Spec icon={<Maximize className="w-5 h-5" />} label="Superficie" value={`${p.superficie} m²`} />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-5">Descripción</h2>
            <p className="text-slate-700 mt-2 whitespace-pre-line">{p.descripcion || 'Sin descripción.'}</p>

            <div className="flex flex-wrap gap-2 mt-5">
              {p.garantia === 'sin' && <Tag color="purple">Sin garantía</Tag>}
              {p.garantia === 'requerida' && <Tag color="slate">Requiere garantía</Tag>}
              {p.garantia === 'ambas' && <Tag color="indigo">Acepta garantía o seguro</Tag>}
              {p.mascotas && <Tag color="amber">Acepta mascotas</Tag>}
              {p.amoblado && <Tag color="sky">Amoblado</Tag>}
              {p.expensas_incluidas && <Tag color="emerald">Expensas incluidas</Tag>}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 sticky top-24">
              <div className="text-sm text-slate-600">Precio mensual</div>
              <div className="text-3xl font-extrabold text-brand mt-1">{formatPrice(p.precio)}</div>
              {p.precio_anterior && p.precio_anterior > p.precio && (
                <div className="text-sm text-slate-500 line-through mt-0.5">{formatPrice(p.precio_anterior)}</div>
              )}

              <div className="mt-5 pt-5 border-t border-emerald-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Publicado por</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Building2 className="w-4 h-4 text-brand" />
                  <span className="font-semibold">{p.empresa || p.publicador}</span>
                </div>
                {p.telefono && (
                  <a href={`tel:${p.telefono}`} className="flex items-center gap-2 text-sm text-slate-700 mt-2 hover:text-brand">
                    <Phone className="w-4 h-4" /> {p.telefono}
                  </a>
                )}
                {p.contacto_email && (
                  <a href={`mailto:${p.contacto_email}`} className="flex items-center gap-2 text-sm text-slate-700 mt-1 hover:text-brand">
                    <Mail className="w-4 h-4" /> {p.contacto_email}
                  </a>
                )}
              </div>

              <button className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-lg mt-5">
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
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function Tag({ children, color }) {
  const map = {
    purple: 'bg-purple-100 text-purple-700',
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-brand',
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[color]}`}>{children}</span>;
}
