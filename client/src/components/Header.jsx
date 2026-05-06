import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, LogIn, LogOut, UserPlus, LayoutDashboard, Shield, Building2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-brand-soft text-brand' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'}`;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-ink-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white">
            <Home className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-lg text-brand tracking-tight">Rentar</span>
            <span className="hidden sm:inline text-[10px] text-ink-400 font-normal">Villa María</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          <NavLink to="/" end className={linkClass}>Alquileres</NavLink>
          {user?.rol === 'inmobiliaria' && (
            <NavLink to="/panel-inmobiliaria" className={linkClass}>
              <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Mi panel</span>
            </NavLink>
          )}
          {user?.rol === 'admin' && (
            <>
              <NavLink to="/panel-inmobiliaria" className={linkClass}>
                <span className="inline-flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Propiedades</span>
              </NavLink>
              <NavLink to="/panel-admin" className={linkClass}>
                <span className="inline-flex items-center gap-1.5"><Shield className="w-4 h-4" /> Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user?.rol === 'inmobiliaria' || user?.rol === 'admin' ? (
            <Link to="/panel-inmobiliaria" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white px-3.5 py-2 rounded-lg transition">
              <Plus className="w-4 h-4" /> Publicar
            </Link>
          ) : null}
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-ink-900">{user.nombre}</span>
                <span className="text-[11px] text-ink-400 capitalize">{user.rol}</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-ink-100"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-100">
                <LogIn className="w-4 h-4" /> Ingresar
              </Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark">
                <UserPlus className="w-4 h-4" /> Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
