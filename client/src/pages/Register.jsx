import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UserPlus, Building2, User } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    rol: 'usuario', nombre: '', email: '', password: '', empresa: '', telefono: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const u = await register(form);
      navigate(u.rol === 'inmobiliaria' ? '/panel-inmobiliaria' : '/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al registrarse');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Crear cuenta</h1>
            <p className="text-sm text-slate-500">Registrate como usuario o inmobiliaria</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <RoleBtn active={form.rol === 'usuario'} onClick={() => set('rol', 'usuario')} icon={<User className="w-4 h-4" />} label="Soy usuario" hint="Busco alquilar" />
          <RoleBtn active={form.rol === 'inmobiliaria'} onClick={() => set('rol', 'inmobiliaria')} icon={<Building2 className="w-4 h-4" />} label="Soy inmobiliaria" hint="Cargo propiedades" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nombre completo">
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Contraseña">
            <input type="password" minLength={4} value={form.password} onChange={e => set('password', e.target.value)} required className={inputCls} />
          </Field>
          {form.rol === 'inmobiliaria' && (
            <Field label="Nombre de la inmobiliaria">
              <input value={form.empresa} onChange={e => set('empresa', e.target.value)} required className={inputCls} />
            </Field>
          )}
          <Field label="Teléfono (opcional)">
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} />
          </Field>

          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</div>}

          <button disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          ¿Ya tenés cuenta? <Link to="/login" className="text-brand font-semibold hover:underline">Ingresá</Link>
        </p>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function RoleBtn({ active, onClick, icon, label, hint }) {
  return (
    <button type="button" onClick={onClick} className={`p-3 rounded-xl border text-left transition ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className={`flex items-center gap-2 font-semibold text-sm ${active ? 'text-emerald-800' : 'text-slate-700'}`}>{icon}{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
    </button>
  );
}
