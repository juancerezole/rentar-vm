import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn } from 'lucide-react';

const QUICK = [
  { label: 'Admin',       email: 'admin@rentar.com.ar', password: 'admin123' },
  { label: 'Inmobiliaria', email: 'inmo@rentar.com.ar',  password: 'inmo123' },
  { label: 'Usuario',     email: 'user@rentar.com.ar',   password: 'user123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetOk = searchParams.get('reset') === 'ok';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const u = await login(email, password);
      navigate(u.rol === 'admin' ? '/panel-admin' : u.rol === 'inmobiliaria' ? '/panel-inmobiliaria' : '/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-night-card rounded-2xl shadow-card dark:shadow-dark-card border border-ink-200 dark:border-night-border p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl bg-brand dark:bg-accent-orange flex items-center justify-center text-white shadow-soft">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-night-text">Iniciar sesión</h1>
            <p className="text-sm text-ink-400 dark:text-night-dim">Ingresá a tu cuenta de Rentar</p>
          </div>
        </div>

        {resetOk && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
            ¡Contraseña actualizada! Ya podés iniciar sesión.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Contraseña">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
            <div className="text-right mt-1.5">
              <Link to="/forgot-password" className="text-xs text-brand-mid dark:text-accent-orange hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-ink-100 dark:border-night-border">
          <p className="text-xs text-ink-400 dark:text-night-dim mb-2.5 font-medium">Acceso rápido (demo):</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map(q => (
              <button
                key={q.label}
                type="button"
                onClick={() => { setEmail(q.email); setPassword(q.password); }}
                className="text-xs py-2 px-2 rounded-lg bg-ink-100 dark:bg-night-elevated hover:bg-ink-200 dark:hover:bg-night-border text-ink-700 dark:text-night-muted font-medium transition"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-ink-500 dark:text-night-muted mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-brand dark:text-accent-orange font-semibold hover:underline">
            Registrate
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
