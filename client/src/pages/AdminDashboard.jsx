import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Shield, Users, Trash2, Building2, Home, Crown, X, Search } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';
import { PAGE_SIZE_TABLE } from '../constants.js';

const PAGE_LIMIT = PAGE_SIZE_TABLE;

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [byRol, setByRol] = useState({ admin: 0, inmobiliaria: 0, usuario: 0 });
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionError, setActionError] = useState('');

  function loadUsers(targetPage = page, q = search) {
    api.get('/admin/users', { params: { page: targetPage, limit: PAGE_LIMIT, q: q || undefined } })
      .then(r => {
        setUsers(r.data.users ?? []);
        setTotalPages(r.data.totalPages ?? 1);
        setTotal(r.data.total ?? 0);
        if (r.data.byRol) setByRol(r.data.byRol);
      })
      .catch(console.error);
  }

  useEffect(() => {
    loadUsers(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    api.get('/stats/summary').then(r => setStats(r.data)).catch(console.error);
  }, []);

  // debounce de búsqueda — 300ms entre tipear y disparar la query
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setPage(1);
        setSearch(searchInput);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  async function changeRol(id, rol) {
    setActionError('');
    try {
      await api.put(`/admin/users/${id}/rol`, { rol });
      loadUsers();
    } catch (e) {
      setActionError(e.response?.data?.error || 'No se pudo cambiar el rol.');
      loadUsers();
    }
  }

  async function delUser(user) {
    setActionError('');
    try {
      await api.delete(`/admin/users/${user.id}`);
      setConfirmDelete(null);
      if (users.length === 1 && page > 1) setPage(p => p - 1);
      else loadUsers();
    } catch (e) {
      setConfirmDelete(null);
      setActionError(e.response?.data?.error || 'No se pudo eliminar el usuario.');
    }
  }

  // Contadores globales — byRol viene del endpoint y no depende de la página actual
  const inmoCount  = byRol.inmobiliaria;
  const userCount  = byRol.usuario;
  const adminCount = byRol.admin;

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

      {actionError && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl px-4 py-3">
          <div className="flex-1 text-sm text-red-700 dark:text-red-400">{actionError}</div>
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <Stat icon={<Home className="w-5 h-5" />}     label="Propiedades"     value={stats?.propiedades ?? '—'} color="bg-brand" />
        <Stat icon={<Building2 className="w-5 h-5" />} label="Inmobiliarias"   value={inmoCount}               color="bg-brand-mid" />
        <Stat icon={<Users className="w-5 h-5" />}     label="Usuarios"        value={userCount}               color="bg-accent-orange" />
        <Stat icon={<Crown className="w-5 h-5" />}     label="Administradores" value={adminCount}              color="bg-ink-700" />
      </div>

      <div className="bg-white dark:bg-night-card rounded-2xl border border-ink-200 dark:border-night-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 dark:border-night-border flex items-center gap-3">
          <h2 className="font-semibold text-ink-900 dark:text-night-text flex items-center gap-2">
            <Users className="w-4 h-4 text-ink-400 dark:text-night-dim" /> Usuarios registrados
            <span className="text-xs font-medium text-ink-400 dark:text-night-dim">({total})</span>
          </h2>
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-night-dim" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-9 pr-3 py-1.5 rounded-lg border border-ink-200 dark:border-night-border bg-white dark:bg-night-elevated text-sm text-ink-900 dark:text-night-text placeholder:text-ink-400 dark:placeholder:text-night-dim focus:border-brand-mid dark:focus:border-accent-orange focus:ring-2 focus:ring-brand-soft dark:focus:ring-accent-orange/15 outline-none transition w-64"
            />
          </div>
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
                      onClick={() => setConfirmDelete(u)}
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
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-ink-100 dark:border-night-border">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Eliminar a ${confirmDelete.nombre}`}
          message={`Esta acción no se puede deshacer. También se eliminarán sus ${confirmDelete.propiedades} propiedad${confirmDelete.propiedades !== 1 ? 'es' : ''}.`}
          confirmLabel="Eliminar"
          onConfirm={() => delUser(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
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
