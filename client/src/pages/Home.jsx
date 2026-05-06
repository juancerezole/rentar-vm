import { useEffect, useMemo, useState } from 'react';
import { Building, Sparkles, MapPinned, Calculator, Flame } from 'lucide-react';
import { api } from '../api.js';
import StatsBar from '../components/StatsBar.jsx';
import AdBanner from '../components/AdBanner.jsx';
import Filters from '../components/Filters.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import NeighborhoodMap from '../components/NeighborhoodMap.jsx';
import Oportunidades from '../components/Oportunidades.jsx';
import AISearchBar from '../components/AISearchBar.jsx';
import HeatMap from '../components/HeatMap.jsx';
import Calculadora from '../components/Calculadora.jsx';
import SectionTabs from '../components/SectionTabs.jsx';

const EMPTY = {
  q: '', tipo: '', ambientes: '', barrio: '', garantia: '',
  minPrecio: '', maxPrecio: '', mascotas: '', amoblado: '', expensas: '',
};

export default function Home() {
  const [tab, setTab] = useState('alquileres');
  const [filters, setFilters] = useState(EMPTY);
  const [props, setProps] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/barrios').then(r => setBarrios(r.data.barrios));
    api.get('/stats/summary').then(r => setStats(r.data));
  }, []);

  const params = useMemo(() => {
    const o = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) o[k] = v; });
    return o;
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/properties', { params })
        .then(r => setProps(r.data.properties))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [params]);

  const tabs = [
    { id: 'alquileres', label: 'Alquileres', icon: Building, badge: stats?.propiedades },
    { id: 'oportunidades', label: 'Oportunidades', icon: Flame, badge: stats?.liquidacion },
    { id: 'mapa', label: 'Mapa por barrio', icon: MapPinned },
    { id: 'herramientas', label: 'Herramientas', icon: Calculator },
  ];

  return (
    <>
      <AdBanner />
      <StatsBar />

      <div className="bg-gradient-to-b from-brand-soft to-transparent border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mb-6">
            <span className="inline-flex items-center gap-1.5 bg-white border border-brand-border text-brand text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-soft">
              <Sparkles className="w-3 h-3" /> Portal de Villa María
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-ink-900 leading-[1.05] mt-3">
              Tu próximo alquiler en <span className="text-brand italic">Villa María</span>, encontrado en segundos.
            </h1>
            <p className="text-ink-500 mt-3 text-[15px] max-w-2xl">
              Departamentos, casas, locales y más — actualizados cada día por las inmobiliarias de la ciudad. Filtros precisos, datos de mercado y herramientas pensadas para vos.
            </p>
          </div>
          <AISearchBar />
        </div>
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'alquileres' && (
          <AlquileresTab
            filters={filters} setFilters={setFilters} barrios={barrios}
            props={props} loading={loading}
            onMapBarrio={(b) => setFilters(f => ({ ...f, barrio: b }))}
          />
        )}
        {tab === 'oportunidades' && <Oportunidades />}
        {tab === 'mapa' && (
          <MapaTab
            barrios={barrios}
            selected={filters.barrio}
            onSelect={(b) => { setFilters(f => ({ ...f, barrio: b })); setTab('alquileres'); }}
          />
        )}
        {tab === 'herramientas' && <HerramientasTab />}
      </main>
    </>
  );
}

function AlquileresTab({ filters, setFilters, barrios, props, loading, onMapBarrio }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
        <Filters filters={filters} setFilters={setFilters} barrios={barrios} onClear={() => setFilters({ q: '', tipo: '', ambientes: '', barrio: '', garantia: '', minPrecio: '', maxPrecio: '', mascotas: '', amoblado: '', expensas: '' })} />
      </aside>

      <section className="space-y-6">
        <div className="bg-white border border-ink-200 rounded-xl px-4 h-12 flex items-center justify-between shadow-soft">
          <div className="text-sm text-ink-700">
            Mostrando <strong className="text-ink-900">{props.length} propiedades</strong>
            {filters.barrio && <span className="text-ink-500"> en <span className="font-semibold text-brand">{filters.barrio}</span></span>}
          </div>
          {loading && <span className="text-xs text-ink-400">Buscando...</span>}
        </div>
        {props.length === 0 && !loading ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center text-ink-500">
            No hay propiedades que coincidan con los filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
            {props.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function MapaTab({ barrios, selected, onSelect }) {
  return (
    <div className="space-y-6">
      <HeatMap onSelect={onSelect} />
      <NeighborhoodMap barrios={barrios} selected={selected} onSelect={onSelect} />
    </div>
  );
}

function HerramientasTab() {
  return (
    <div className="space-y-6">
      <Calculadora />
      <div className="bg-white border border-ink-200 rounded-2xl p-6 text-center text-ink-500">
        <p className="text-sm">Próximamente: simulador de garantía, comparador de barrios, índice de inflación de alquileres.</p>
      </div>
    </div>
  );
}
