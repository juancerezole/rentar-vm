import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import InmobiliariaDashboard from './pages/InmobiliariaDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-ink-400 dark:text-night-dim">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-full bg-surface dark:bg-night-bg">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/propiedad/:id" element={<PropertyDetail />} />
        <Route path="/panel-inmobiliaria" element={
          <Protected roles={['inmobiliaria', 'admin']}><InmobiliariaDashboard /></Protected>
        } />
        <Route path="/panel-admin" element={
          <Protected roles={['admin']}><AdminDashboard /></Protected>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-brand dark:bg-night-elevated text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-xl mb-2">Rentar</div>
            <p className="text-[12px] text-white/50 leading-relaxed max-w-[200px]">
              El portal inmobiliario de Villa María. Encontrá tu próxima propiedad con datos reales del mercado.
            </p>
          </div>
          <FooterCol title="Propiedades" links={['Todos los alquileres', 'Oportunidades', 'Mapa por barrio', 'Publicar propiedad']} />
          <FooterCol title="Herramientas" links={['Buscador con IA', 'Calculadora de costos', 'Mapa de calor', 'Alertas por WhatsApp']} />
          <FooterCol title="Contacto" links={['info@rentar.com.ar', 'Anunciá tu empresa', 'Soy inmobiliaria', 'Términos y privacidad']} />
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-white/35">
          <span>© 2026 Rentar · Villa María, Córdoba</span>
          <span>Todos los derechos reservados · Demo</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">{title}</div>
      {links.map(l => (
        <a key={l} href="#" className="block text-[12px] text-white/55 hover:text-white mb-2 transition">{l}</a>
      ))}
    </div>
  );
}
