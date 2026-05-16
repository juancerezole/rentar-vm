import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { api } from '../api.js';
import { inputCls } from '../components/ui/FormField.jsx';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-night-card rounded-2xl shadow-card dark:shadow-dark-card border border-ink-200 dark:border-night-border p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl bg-brand dark:bg-accent-orange flex items-center justify-center text-white shadow-soft">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-night-text">Recuperar contraseña</h1>
            <p className="text-sm text-ink-400 dark:text-night-dim">Te mandamos un link a tu email</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl px-4 py-3.5 text-sm text-green-700 dark:text-green-400 leading-relaxed">
              <p className="font-semibold mb-1">Revisá tu bandeja de entrada</p>
              <p>Si el email está registrado, vas a recibir un link para restablecer tu contraseña en los próximos minutos.</p>
            </div>
            <p className="text-xs text-ink-400 dark:text-night-dim text-center">
              ¿No llegó? Revisá la carpeta de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-ink-500 dark:text-night-muted">
              Ingresá el email de tu cuenta y te vamos a mandar un link para crear una nueva contraseña.
            </p>
            <label className="block">
              <span className="block text-sm font-medium text-ink-700 dark:text-night-muted mb-1.5">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
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
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-ink-500 dark:text-night-muted mt-6">
          <Link to="/login" className="text-brand dark:text-accent-orange font-semibold hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

