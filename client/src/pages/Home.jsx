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
import Pagination from '../components/Pagination.jsx';

const EMPTY = {
  q: '', tipo: '', ambientes: '', barrio: '', garantia: '',
  minPrecio: '', maxPrecio: '', mascotas: '', amoblado: '', expensas: '',
};
const LIMIT = 24;

export default function Home() {
  const [tab, setTab]       = useState('alquileres');
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage]     = useState(1);
  const [result, setResult] = useState({ properties: [], total: 0, totalPages: 1 });
  const [barrios, setBarrios] = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/barrios').then(r => setBarrios(r.data.barrios ?? [])).catch(console.error);
    api.get('/stats/summary').then(r => setStats(r.data)).catch(console.error);
  }, []);

  // Cambia filtros y vuelve a página 1
  const changeFilters = (updater) => {
    setFilters(updater);
    setPage(1);
  };

  const params = useMemo(() => {
    const o = { page, limit: LIMIT };
    Object.entries(filters).forEach(([k, v]) => { if (v) o[k] = v; });
    return o;
  }, [filters, page]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/properties', { params, signal: controller.signal })
        .then(r => setResult({
          properties: r.data.properties,
          total:      r.data.total,
          totalPages: r.data.totalPages,
        }))
        .catch(err => { if (!api.isCancel?.(err) && err.code !== 'ERR_CANCELED') console.error(err); })
        .finally(() => setLoading(false));
    }, 200);
    return () => { clearTimeout(t); controller.abort(); };
  }, [params]);

  const changePage = (newPage) => {
    setPage(newPage);
    document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tabs = [
    { id: 'alquileres',    label: 'Alquileres',      icon: Building,  badge: stats?.propiedades },
    { id: 'oportunidades', label: 'Oportunidades',   icon: Flame,     badge: stats?.liquidacion },
    { id: 'mapa',          label: 'Mapa por barrio', icon: MapPinned },
    { id: 'herramientas',  label: 'Herramientas',    icon: Calculator },
  ];

  return (
    <>
      <AdBanner />
      <StatsBar />

      <div className="bg-gradient-to-b from-brand-soft dark:from-night-card via-brand-soft/40 dark:via-night-bg/60 to-transparent border-b border-ink-200 dark:border-night-border">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="max-w-3xl mb-7">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-night-elevated border border-brand-border dark:border-night-border text-brand-mid dark:text-accent-orange text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-soft">
              <Sparkles className="w-3 h-3" /> Portal de Villa María
            </span>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-ink-900 dark:text-night-text leading-[1.1] mt-4">
              Tu próximo alquiler en{' '}
              <span className="text-brand dark:text-accent-orange">Villa María</span>,{' '}
              encontrado en segundos.
            </h1>
            <p className="text-ink-500 dark:text-night-muted mt-3 text-[15px] max-w-2xl leading-relaxed">
              Departamentos, casas, locales y más — actualizados cada día por las inmobiliarias de la ciudad.
              Filtros precisos, datos de mercado y herramientas pensadas para vos.
            </p>
          </div>
          <AISearchBar />
        </div>
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'alquileres' && (
          <AlquileresTab
            filters={filters}
            setFilters={changeFilters}
            barrios={barrios}
            result={result}
            page={page}
            loading={loading}
            onChangePage={changePage}
            onMapBarrio={(b) => changeFilters(f => ({ ...f, barrio: b }))}
          />
        )}
        {tab === 'oportunidades' && <Oportunidades />}
        {tab === 'mapa' && (
          <MapaTab
            barrios={barrios}
            selected={filters.barrio}
            onSelect={(b) => { changeFilters(f => ({ ...f, barrio: b })); setTab('alquileres'); }}
          />
        )}
        {tab === 'herramientas' && <HerramientasTab />}
      </main>
    </>
  );
}

function AlquileresTab({ filters, setFilters, barrios, result, page, loading, onChangePage, onMapBarrio }) {
  const { properties, total, totalPages } = result;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
        <Filters
          filters={filters}
          setFilters={setFilters}
          barrios={barrios}
          onClear={() => setFilters(EMPTY)}
        />
      </aside>

      <section id="resultados" className="space-y-5 scroll-mt-24">
        <div className="bg-white dark:bg-night-card border border-ink-200 dark:border-night-border rounded-xl px-4 h-11 flex items-center justify-between shadow-soft">
          <div className="text-sm text-ink-500 dark:text-night-muted">
            <strong className="text-ink-900 dark:text-night-text font-semibold">{total} propiedades</strong>
            {filters.barrio && (
              <span> en <span className="font-semibold text-brand dark:text-accent-orange">{filters.barrio}</span></span>
            )}
            {totalPages > 1 && (
              <span className="text-ink-400 dark:text-night-dim"> · pág. {page} de {totalPages}</span>
            )}
          </div>
          {loading && <span className="text-xs text-ink-400 dark:text-night-dim animate-pulse">Buscando...</span>}
        </div>

        {properties.length === 0 && !loading ? (
          <div className="bg-white dark:bg-night-card border border-dashed border-ink-200 dark:border-night-border rounded-2xl p-14 text-center">
            <p className="text-ink-500 dark:text-night-muted font-medium">Sin resultados para los filtros aplicados</p>
            <p className="text-xs text-ink-400 dark:text-night-dim mt-1">Probá cambiando el barrio, tipo o rango de precio.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
              {properties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={onChangePage} />
          </>
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
      <div className="bg-white dark:bg-night-card border border-ink-200 dark:border-night-border rounded-2xl p-8 text-center">
        <p className="text-sm text-ink-500 dark:text-night-muted">Próximamente: simulador de garantía, comparador de barrios, índice de inflación de alquileres.</p>
      </div>
    </div>
  );
}
