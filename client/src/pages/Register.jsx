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
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-night-card rounded-2xl shadow-card dark:shadow-dark-card border border-ink-200 dark:border-night-border p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl bg-brand dark:bg-accent-orange flex items-center justify-center text-white shadow-soft">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-night-text">Crear cuenta</h1>
            <p className="text-sm text-ink-400 dark:text-night-dim">Registrate como usuario o inmobiliaria</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <RoleBtn
            active={form.rol === 'usuario'}
            onClick={() => set('rol', 'usuario')}
            icon={<User className="w-4 h-4" />}
            label="Soy usuario"
            hint="Busco alquilar"
          />
          <RoleBtn
            active={form.rol === 'inmobiliaria'}
            onClick={() => set('rol', 'inmobiliaria')}
            icon={<Building2 className="w-4 h-4" />}
            label="Soy inmobiliaria"
            hint="Cargo propiedades"
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
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

          {err && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl px-3 py-2.5">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition shadow-soft"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 dark:text-night-muted mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand dark:text-accent-orange font-semibold hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-sm focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 focus:border-brand-mid dark:focus:border-accent-orange outline-none transition';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-700 dark:text-night-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function RoleBtn({ active, onClick, icon, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-xl border text-left transition ${
        active
          ? 'border-brand-mid dark:border-accent-orange bg-brand-soft dark:bg-accent-orange/10'
          : 'border-ink-200 dark:border-night-border hover:border-brand-border dark:hover:border-accent-orange/30 hover:bg-brand-soft/30 dark:hover:bg-accent-orange/5'
      }`}
    >
      <div className={`flex items-center gap-2 font-semibold text-sm ${active ? 'text-brand dark:text-accent-orange' : 'text-ink-700 dark:text-night-muted'}`}>
        {icon}{label}
      </div>
      <div className="text-xs text-ink-400 dark:text-night-dim mt-0.5">{hint}</div>
    </button>
  );
}
