import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Shield, Users, Trash2, Building2, Home, Crown } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  function load() {
    api.get('/admin/users').then(r => setUsers(r.data.users));
    api.get('/stats/summary').then(r => setStats(r.data));
  }
  useEffect(() => { load(); }, []);

  async function changeRol(id, rol) {
    await api.put(`/admin/users/${id}/rol`, { rol });
    load();
  }
  async function delUser(id) {
    if (!confirm('¿Eliminar este usuario y todas sus propiedades?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Error');
    }
  }

  const inmoCount  = users.filter(u => u.rol === 'inmobiliaria').length;
  const userCount  = users.filter(u => u.rol === 'usuario').length;
  const adminCount = users.filter(u => u.rol === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-xl bg-brand dark:bg-accent-orange flex items-center justify-center text-white shadow-soft">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-night-text">Panel de administración</h1>
          <p className="text-sm text-ink-400 dark:text-night-dim">Gestioná usuarios y monitoreá el portal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <Stat icon={<Home className="w-5 h-5" />}     label="Propiedades"     value={stats?.propiedades ?? '—'} color="bg-brand" />
        <Stat icon={<Building2 className="w-5 h-5" />} label="Inmobiliarias"   value={inmoCount}               color="bg-brand-mid" />
        <Stat icon={<Users className="w-5 h-5" />}     label="Usuarios"        value={userCount}               color="bg-accent-orange" />
        <Stat icon={<Crown className="w-5 h-5" />}     label="Administradores" value={adminCount}              color="bg-ink-700" />
      </div>

      <div className="bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 dark:border-night-border">
          <h2 className="font-semibold text-ink-900 dark:text-night-text flex items-center gap-2">
            <Users className="w-4 h-4 text-ink-400 dark:text-night-dim" /> Usuarios registrados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-100/60 dark:bg-night-elevated/60 text-ink-500 dark:text-night-dim text-xs uppercase tracking-widest">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Nombre</th>
                <th className="text-left px-5 py-3 font-semibold">Email</th>
                <th className="text-left px-5 py-3 font-semibold">Empresa</th>
                <th className="text-center px-5 py-3 font-semibold">Props.</th>
                <th className="text-left px-5 py-3 font-semibold">Rol</th>
                <th className="text-right px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-night-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-ink-100/30 dark:hover:bg-night-elevated/50 transition">
                  <td className="px-5 py-3 font-medium text-ink-900 dark:text-night-text">{u.nombre}</td>
                  <td className="px-5 py-3 text-ink-500 dark:text-night-muted">{u.email}</td>
                  <td className="px-5 py-3 text-ink-500 dark:text-night-muted">{u.empresa || '—'}</td>
                  <td className="px-5 py-3 text-center text-ink-700 dark:text-night-muted font-medium">{u.propiedades}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.rol}
                      onChange={e => changeRol(u.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-ink-900 dark:text-night-text text-xs focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 focus:border-brand-mid dark:focus:border-accent-orange outline-none transition"
                    >
                      <option value="usuario">usuario</option>
                      <option value="inmobiliaria">inmobiliaria</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => delUser(u.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border shadow-soft p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-ink-400 dark:text-night-dim">{label}</div>
        <div className="text-2xl font-bold text-ink-900 dark:text-night-text leading-tight">{value}</div>
      </div>
    </div>
  );
}
