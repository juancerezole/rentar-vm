import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, LogIn, LogOut, UserPlus, LayoutDashboard, Shield, Building2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-white/15 text-white'
        : 'text-white/65 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-brand dark:bg-night-elevated shadow-soft">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
            <Home className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg text-white tracking-tight">Rentar</span>
            <span className="hidden sm:inline text-[10px] text-white/40 font-normal">Villa María</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 ml-6">
          <NavLink to="/" end className={linkClass}>Alquileres</NavLink>
          {user?.rol === 'inmobiliaria' && (
            <NavLink to="/panel-inmobiliaria" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Mi panel
              </span>
            </NavLink>
          )}
          {user?.rol === 'admin' && (
            <>
              <NavLink to="/panel-inmobiliaria" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Propiedades
                </span>
              </NavLink>
              <NavLink to="/panel-admin" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {(user?.rol === 'inmobiliaria' || user?.rol === 'admin') && (
            <Link
              to="/panel-inmobiliaria"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-accent-orange text-brand dark:text-white hover:bg-white/90 dark:hover:bg-accent-orange/90 px-3.5 py-2 rounded-lg transition shadow-soft ml-1"
            >
              <Plus className="w-4 h-4" /> Publicar
            </Link>
          )}

          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-tight ml-1">
                <span className="text-sm font-semibold text-white">{user.nombre}</span>
                <span className="text-[10px] text-white/45 capitalize">{user.rol}</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <LogIn className="w-4 h-4" /> Ingresar
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-brand-mid dark:bg-accent-orange text-white hover:bg-brand-mid/90 dark:hover:bg-accent-orange/90 transition shadow-soft"
              >
                <UserPlus className="w-4 h-4" /> Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
