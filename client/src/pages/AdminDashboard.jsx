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

  const inmoCount = users.filter(u => u.rol === 'inmobiliaria').length;
  const userCount = users.filter(u => u.rol === 'usuario').length;
  const adminCount = users.filter(u => u.rol === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de administración</h1>
          <p className="text-sm text-slate-500">Gestioná usuarios y monitoreá el portal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat icon={<Home className="w-5 h-5" />} label="Propiedades" value={stats?.propiedades ?? '—'} color="from-brand to-brand-dark" />
        <Stat icon={<Building2 className="w-5 h-5" />} label="Inmobiliarias" value={inmoCount} color="from-blue-500 to-indigo-600" />
        <Stat icon={<Users className="w-5 h-5" />} label="Usuarios" value={userCount} color="from-orange-500 to-amber-600" />
        <Stat icon={<Crown className="w-5 h-5" />} label="Administradores" value={adminCount} color="from-violet-500 to-purple-600" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" /> Usuarios registrados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Empresa</th>
                <th className="text-center px-4 py-3 font-semibold">Propiedades</th>
                <th className="text-left px-4 py-3 font-semibold">Rol</th>
                <th className="text-right px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.empresa || '—'}</td>
                  <td className="px-4 py-3 text-center">{u.propiedades}</td>
                  <td className="px-4 py-3">
                    <select value={u.rol} onChange={e => changeRol(u.id, e.target.value)}
                      className="px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="usuario">usuario</option>
                      <option value="inmobiliaria">inmobiliaria</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => delUser(u.id)} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md">
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
    <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
      </div>
    </div>
  );
}
