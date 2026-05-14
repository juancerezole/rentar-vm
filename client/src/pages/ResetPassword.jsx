import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { api } from '../api.js';

export default function ResetPassword() {
  const [searchParams]        = useSearchParams();
  const token                 = searchParams.get('token');
  const navigate              = useNavigate();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [err, setErr]             = useState('');
  const [loading, setLoading]     = useState(false);

  // Sin token en la URL — link inválido
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="bg-white dark:bg-night-card rounded-2xl shadow-card dark:shadow-dark-card border border-ink-200 dark:border-night-border p-8 text-center space-y-4">
          <p className="text-ink-500 dark:text-night-muted">Este link de recuperación no es válido.</p>
          <Link to="/forgot-password" className="text-brand dark:text-accent-orange font-semibold hover:underline text-sm">
            Solicitá uno nuevo
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (password !== confirm) return setErr('Las contraseñas no coinciden.');
    if (password.length < 8)  return setErr('La contraseña debe tener al menos 8 caracteres.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login?reset=ok');
    } catch (e) {
      setErr(e.response?.data?.error || 'Ocurrió un error. El link puede haber expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-night-card rounded-2xl shadow-card dark:shadow-dark-card border border-ink-200 dark:border-night-border p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl bg-brand dark:bg-accent-orange flex items-center justify-center text-white shadow-soft">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-night-text">Nueva contraseña</h1>
            <p className="text-sm text-ink-400 dark:text-night-dim">Elegí una contraseña segura</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-ink-700 dark:text-night-muted mb-1.5">
              Nueva contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-ink-700 dark:text-night-muted mb-1.5">
              Confirmá la contraseña
            </span>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              className={inputCls}
            />
          </label>
          {err && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl px-3 py-2.5">
              {err}
            </div>
          )}
          <button
            disabled={loading}
            className="w-full bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition shadow-soft"
          >
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 dark:text-night-muted mt-6">
          <Link to="/login" className="text-brand dark:text-accent-orange font-semibold hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-sm focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 focus:border-brand-mid dark:focus:border-accent-orange outline-none transition';
