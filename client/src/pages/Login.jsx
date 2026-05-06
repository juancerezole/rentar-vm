import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn } from 'lucide-react';

const QUICK = [
  { label: 'Admin', email: 'admin@rentar.com.ar', password: 'admin123' },
  { label: 'Inmobiliaria', email: 'inmo@rentar.com.ar', password: 'inmo123' },
  { label: 'Usuario', email: 'user@rentar.com.ar', password: 'user123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Iniciar sesión</h1>
            <p className="text-sm text-slate-500">Ingresá a tu cuenta de Rentar</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Contraseña">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
          </Field>
          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{err}</div>}
          <button disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-slate-500 mb-2 font-medium">Acceso rápido (demo):</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map(q => (
              <button
                key={q.label}
                type="button"
                onClick={() => { setEmail(q.email); setPassword(q.password); }}
                className="text-xs py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 mt-6">
          ¿No tenés cuenta? <Link to="/register" className="text-brand font-semibold hover:underline">Registrate</Link>
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
