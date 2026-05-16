import { useEffect, useState } from 'react';
import { api, formatPrice, tipoLabel, TIPOS } from '../api.js';
import { Plus, Pencil, Trash2, X, Building2, Image as ImageIcon, Sparkles, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { inputCls, Field } from '../components/ui/FormField.jsx';

const EMPTY_FORM = {
  titulo: '', tipo: 'departamento', direccion: '', barrio: '',
  precio: '', precio_anterior: '', ambientes: 1, banos: 1, superficie: '',
  garantia: 'requerida', mascotas: false, amoblado: false, expensas_incluidas: false,
  destacado: false, liquidacion: false, descripcion: '',
};

export default function InmobiliariaDashboard() {
  const { user } = useAuth();
  const [list, setList]                 = useState([]);
  const [barrios, setBarrios]           = useState([]);
  const [open, setOpen]                 = useState(false);
  const [step, setStep]                 = useState('form'); // 'form' | 'photos'
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formError, setFormError]       = useState('');
  const [images, setImages]             = useState([]);

  function load() {
    api.get('/properties/mine/list').then(r => setList(r.data.properties ?? [])).catch(console.error);
  }

  useEffect(() => {
    load();
    api.get('/barrios').then(r => setBarrios(r.data.barrios ?? [])).catch(console.error);
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImages([]);
    setStep('form');
    setOpen(true);
  }

  async function startEdit(p) {
    setEditingId(p.id);
    setForm({
      titulo: p.titulo, tipo: p.tipo, direccion: p.direccion, barrio: p.barrio,
      precio: p.precio, precio_anterior: p.precio_anterior || '',
      ambientes: p.ambientes, banos: p.banos, superficie: p.superficie,
      garantia: p.garantia,
      mascotas: !!p.mascotas, amoblado: !!p.amoblado, expensas_incluidas: !!p.expensas_incluidas,
      destacado: !!p.destacado, liquidacion: !!p.liquidacion,
      descripcion: p.descripcion || '',
    });
    setImages([]);
    setStep('form');
    setOpen(true);
    try {
      const r = await api.get(`/properties/${p.id}`);
      setImages(r.data.property.images ?? []);
    } catch { /* ignore */ }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { ...form, precio_anterior: form.precio_anterior || null };
      if (editingId) {
        await api.put(`/properties/${editingId}`, payload);
        setStep('photos');
      } else {
        const r = await api.post('/properties', payload);
        setEditingId(r.data.property.id);
        setStep('photos');
      }
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setStep('form');
    setEditingId(null);
    setImages([]);
  }

  async function onDelete(id) {
    await api.delete(`/properties/${id}`);
    setConfirmDelete(null);
    load();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-night-text flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-mid dark:text-accent-orange" />
            Mis propiedades
          </h1>
          <p className="text-sm text-ink-400 dark:text-night-dim mt-0.5">
            {user?.empresa ? `${user.empresa} · ` : ''}Cargá, editá y publicá tus alquileres.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 text-white font-semibold px-4 py-2.5 rounded-xl shadow-soft transition"
        >
          <Plus className="w-4 h-4" /> Nueva propiedad
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.length === 0 && (
          <div className="col-span-full bg-white dark:bg-night-card rounded-2xl border-2 border-dashed border-ink-200 dark:border-night-border p-14 text-center">
            <Building2 className="w-10 h-10 text-ink-300 dark:text-night-border mx-auto mb-3" />
            <p className="text-ink-700 dark:text-night-muted font-medium">Todavía no cargaste propiedades</p>
            <p className="text-sm text-ink-400 dark:text-night-dim mt-1">Hacé clic en "Nueva propiedad" para empezar.</p>
          </div>
        )}
        {list.map(p => (
          <div key={p.id} className="bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border shadow-soft hover:shadow-card dark:hover:shadow-dark-card hover:border-brand-border dark:hover:border-accent-orange/30 transition-all overflow-hidden flex flex-col">
            <div className="aspect-video bg-ink-100 dark:bg-night-elevated relative">
              {p.imagen ? (
                <img src={p.imagen} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-300 dark:text-night-border">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              {p.destacado && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-accent-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Destacado
                </span>
              )}
            </div>
            <div className="p-3.5 flex-1 flex flex-col">
              <div className="text-[10px] uppercase tracking-widest text-ink-400 dark:text-night-dim font-semibold">{tipoLabel(p.tipo)}</div>
              <h3 className="font-semibold text-sm text-ink-900 dark:text-night-text line-clamp-1 mt-0.5">{p.titulo}</h3>
              <div className="text-xs text-ink-400 dark:text-night-dim line-clamp-1 mt-0.5">{p.direccion} · {p.barrio}</div>
              <div className="font-bold text-brand dark:text-accent-orange mt-2">{formatPrice(p.precio)}</div>
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-ink-100 dark:border-night-border">
                <button onClick={() => startEdit(p)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-ink-600 dark:text-night-muted hover:bg-ink-100 dark:hover:bg-night-elevated rounded-lg py-1.5 transition">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={() => setConfirmDelete(p.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg py-1.5 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Eliminar propiedad"
          message="Esta acción no se puede deshacer. La propiedad se eliminará permanentemente."
          confirmLabel="Eliminar"
          onConfirm={() => onDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-ink-900/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-night-card rounded-2xl shadow-lg dark:shadow-dark-card max-w-3xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin animate-fadeIn"
          >
            <div className="sticky top-0 bg-white dark:bg-night-card border-b border-ink-100 dark:border-night-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-ink-900 dark:text-night-text">
                  {editingId ? 'Editar propiedad' : 'Nueva propiedad'}
                </h2>
                <div className="flex items-center gap-1">
                  <StepDot active={step === 'form'} done={step === 'photos'} label="Datos" />
                  <div className="w-6 h-px bg-ink-200 dark:bg-night-border" />
                  <StepDot active={step === 'photos'} done={false} label="Fotos" />
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-night-elevated transition">
                <X className="w-5 h-5 text-ink-500 dark:text-night-muted" />
              </button>
            </div>

            {step === 'form' ? (
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
                      <button key={g.v} type="button" onClick={() => setForm({ ...form, garantia: g.v })}
                        className={`py-2 rounded-xl text-sm font-medium border transition ${
                          form.garantia === g.v
                            ? 'bg-brand-soft dark:bg-accent-orange/10 border-brand-mid dark:border-accent-orange text-brand dark:text-accent-orange'
                            : 'border-ink-200 dark:border-night-border text-ink-600 dark:text-night-muted hover:bg-ink-100/50 dark:hover:bg-night-elevated'
                        }`}>
                        {g.l}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Check label="Acepta mascotas"    checked={form.mascotas}           onChange={v => setForm({ ...form, mascotas: v })} />
                  <Check label="Amoblado"            checked={form.amoblado}           onChange={v => setForm({ ...form, amoblado: v })} />
                  <Check label="Expensas incluidas"  checked={form.expensas_incluidas} onChange={v => setForm({ ...form, expensas_incluidas: v })} />
                  <Check label="En liquidación"      checked={form.liquidacion}        onChange={v => setForm({ ...form, liquidacion: v })} />
                  {user?.rol === 'admin' && (
                    <Check label="Destacar (admin)"  checked={form.destacado}          onChange={v => setForm({ ...form, destacado: v })} />
                  )}
                </div>

                <Field label="Descripción">
                  <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className={inputCls} placeholder="Detalles, comodidades, ubicación..." />
                </Field>

                {formError && (
                  <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl px-3 py-2.5">
                    {formError}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-ink-100 dark:border-night-border">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-ink-200 dark:border-night-border font-semibold text-ink-600 dark:text-night-muted hover:bg-ink-100 dark:hover:bg-night-elevated transition">
                    Cancelar
                  </button>
                  <button disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 disabled:opacity-60 text-white font-semibold transition shadow-soft">
                    {saving ? 'Guardando...' : 'Siguiente: agregar fotos →'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 text-ink-600 dark:text-night-muted">
                  <Camera className="w-5 h-5 text-brand-mid dark:text-accent-orange" />
                  <span className="text-sm font-medium">Agregá hasta 10 fotos de la propiedad. La primera es la portada.</span>
                </div>

                <ImageUploader
                  propertyId={editingId}
                  images={images}
                  onImagesChange={setImages}
                />

                <div className="flex gap-2 pt-4 border-t border-ink-100 dark:border-night-border">
                  <button type="button" onClick={() => setStep('form')}
                    className="py-2.5 px-4 rounded-xl border border-ink-200 dark:border-night-border font-semibold text-ink-600 dark:text-night-muted hover:bg-ink-100 dark:hover:bg-night-elevated transition text-sm">
                    ← Volver a datos
                  </button>
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 text-white font-semibold transition shadow-soft">
                    {images.length > 0 ? `Listo · ${images.length} foto${images.length !== 1 ? 's' : ''}` : 'Listo sin fotos'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
        active ? 'bg-brand dark:bg-accent-orange text-white' :
        done   ? 'bg-success text-white' :
                 'bg-ink-100 dark:bg-night-border text-ink-400 dark:text-night-muted'
      }`}>
        {done ? '✓' : ''}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-ink-900 dark:text-night-text' : 'text-ink-400 dark:text-night-muted'}`}>
        {label}
      </span>
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center justify-between text-sm px-3 py-2.5 rounded-xl border transition ${
        checked
          ? 'bg-success-soft dark:bg-success/10 border-success-border dark:border-success/30 text-success-dark dark:text-success'
          : 'bg-white dark:bg-night-elevated border-ink-200 dark:border-night-border text-ink-600 dark:text-night-muted hover:bg-ink-100/50 dark:hover:bg-night-border/30'
      }`}>
      <span>{label}</span>
      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold transition ${
        checked ? 'bg-success text-white' : 'bg-ink-100 dark:bg-night-border'
      }`}>
        {checked ? '✓' : ''}
      </span>
    </button>
  );
}
