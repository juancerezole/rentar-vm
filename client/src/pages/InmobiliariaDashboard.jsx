import { useEffect, useState } from 'react';
import { api, formatPrice, tipoLabel, TIPOS } from '../api.js';
import { Plus, Pencil, Trash2, X, Building2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_FORM = {
  titulo: '', tipo: 'departamento', direccion: '', barrio: '',
  precio: '', precio_anterior: '', ambientes: 1, banos: 1, superficie: '',
  garantia: 'requerida', mascotas: false, amoblado: false, expensas_incluidas: false,
  destacado: false, liquidacion: false, descripcion: '', imagen: '',
};

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
];

export default function InmobiliariaDashboard() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/properties/mine/list').then(r => setList(r.data.properties));
  }

  useEffect(() => {
    load();
    api.get('/barrios').then(r => setBarrios(r.data.barrios));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }
  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      titulo: p.titulo, tipo: p.tipo, direccion: p.direccion, barrio: p.barrio,
      precio: p.precio, precio_anterior: p.precio_anterior || '',
      ambientes: p.ambientes, banos: p.banos, superficie: p.superficie,
      garantia: p.garantia,
      mascotas: !!p.mascotas, amoblado: !!p.amoblado, expensas_incluidas: !!p.expensas_incluidas,
      destacado: !!p.destacado, liquidacion: !!p.liquidacion,
      descripcion: p.descripcion || '', imagen: p.imagen || '',
    });
    setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, precio_anterior: form.precio_anterior || null };
      if (editingId) await api.put(`/properties/${editingId}`, payload);
      else await api.post('/properties', payload);
      setOpen(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function onDelete(id) {
    if (!confirm('¿Eliminar esta propiedad?')) return;
    await api.delete(`/properties/${id}`);
    load();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand" />
            Mis propiedades
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.empresa ? `${user.empresa} · ` : ''}Cargá, editá y publicá tus alquileres en segundos.
          </p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Nueva propiedad
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Todavía no cargaste propiedades</p>
            <p className="text-sm text-slate-500 mt-1">Hacé clic en "Nueva propiedad" para empezar.</p>
          </div>
        )}
        {list.map(p => (
          <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            <div className="aspect-video bg-slate-100 relative">
              {p.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
              )}
              {p.destacado ? (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Destacado
                </span>
              ) : null}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{tipoLabel(p.tipo)}</div>
              <h3 className="font-semibold text-sm text-slate-900 line-clamp-1 mt-0.5">{p.titulo}</h3>
              <div className="text-xs text-slate-500 line-clamp-1">{p.direccion} · {p.barrio}</div>
              <div className="font-bold text-brand mt-2">{formatPrice(p.precio)}</div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button onClick={() => startEdit(p)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg py-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={() => onDelete(p.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg py-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/60" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin animate-fadeIn">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar propiedad' : 'Nueva propiedad'}
              </h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-5">
              <Field label="Título de la publicación *">
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required placeholder="Ej: Depto luminoso 2 amb. en pleno centro" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de propiedad *">
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputCls}>
                    {TIPOS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Barrio *">
                  <select value={form.barrio} onChange={e => setForm({ ...form, barrio: e.target.value })} required className={inputCls}>
                    <option value="">Elegí un barrio</option>
                    {barrios.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Dirección *">
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} required placeholder="Ej: Av. Sabattini 1234" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio mensual *">
                  <input type="number" min="0" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} required placeholder="$" className={inputCls} />
                </Field>
                <Field label="Precio anterior (si está en liquidación)">
                  <input type="number" min="0" value={form.precio_anterior} onChange={e => setForm({ ...form, precio_anterior: e.target.value })} placeholder="$ (opcional)" className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Ambientes">
                  <input type="number" min="1" value={form.ambientes} onChange={e => setForm({ ...form, ambientes: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Baños">
                  <input type="number" min="0" value={form.banos} onChange={e => setForm({ ...form, banos: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Superficie (m²)">
                  <input type="number" min="0" value={form.superficie} onChange={e => setForm({ ...form, superficie: e.target.value })} className={inputCls} />
                </Field>
              </div>

              <Field label="Garantía">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'requerida', l: 'Requerida' },
                    { v: 'sin', l: 'Sin garantía' },
                    { v: 'ambas', l: 'Ambas opciones' },
                  ].map(g => (
                    <button key={g.v} type="button"
                      onClick={() => setForm({ ...form, garantia: g.v })}
                      className={`py-2 rounded-lg text-sm font-medium border transition ${form.garantia === g.v ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Check label="🐶 Acepta mascotas" checked={form.mascotas} onChange={v => setForm({ ...form, mascotas: v })} />
                <Check label="🛋️ Amoblado" checked={form.amoblado} onChange={v => setForm({ ...form, amoblado: v })} />
                <Check label="✅ Expensas incluidas" checked={form.expensas_incluidas} onChange={v => setForm({ ...form, expensas_incluidas: v })} />
                <Check label="🔥 En liquidación" checked={form.liquidacion} onChange={v => setForm({ ...form, liquidacion: v })} />
                {user?.rol === 'admin' && (
                  <Check label="⭐ Destacar (admin)" checked={form.destacado} onChange={v => setForm({ ...form, destacado: v })} />
                )}
              </div>

              <Field label="Descripción">
                <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className={inputCls} placeholder="Detalles, comodidades, ubicación..." />
              </Field>

              <Field label="URL de imagen principal">
                <input value={form.imagen} onChange={e => setForm({ ...form, imagen: e.target.value })} placeholder="https://..." className={inputCls} />
                <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-thin">
                  {SAMPLE_IMAGES.map(src => (
                    <button key={src} type="button" onClick={() => setForm({ ...form, imagen: src })} className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition ${form.imagen === src ? 'border-emerald-500' : 'border-transparent hover:border-slate-300'}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tip: usá una de las imágenes de muestra o pegá una URL.</p>
              </Field>

              <div className="flex gap-2 pt-4 border-t">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                <button disabled={saving} className="flex-1 py-2.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold">
                  {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Publicar propiedad')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center justify-between text-sm px-3 py-2.5 rounded-lg border transition ${checked ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
      <span>{label}</span>
      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${checked ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
        {checked ? '✓' : ''}
      </span>
    </button>
  );
}
