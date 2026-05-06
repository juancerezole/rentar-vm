import { useState } from 'react';
import { Sparkles, Send, Bell, Loader2 } from 'lucide-react';
import { api, formatPrice, tipoLabel } from '../api.js';
import { Link } from 'react-router-dom';

const CHIPS = [
  'Soy estudiante y busco mi primer alquiler en el Centro',
  'Departamento 2 amb. con balcón hasta $300.000',
  'Casa para mi familia, 3 dormitorios, acepta mascotas',
  'Local comercial sobre peatonal',
];

export default function AISearchBar() {
  const [text, setText] = useState('Departamento 2 amb. en Centro hasta $300.000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function search(q) {
    const value = q ?? text;
    if (!value.trim()) return;
    setText(value);
    setLoading(true);
    try {
      const { data } = await api.post('/properties/ai-search', { text: value });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
      <div className="flex items-start gap-3 mb-4">
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-orange text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">+</span>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-ink-900">Buscador inteligente con IA</h2>
          <p className="text-xs text-ink-500 mt-0.5">Describí lo que buscás en lenguaje natural — extraemos los filtros automáticamente.</p>
        </div>
        <span className="hidden md:inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-accent-orange bg-accent-orange-soft border border-accent-orange-border px-2 py-1 rounded-full">Beta</span>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder='Ej: "Departamento 2 amb. en Centro con balcón, hasta $300.000"'
          className="flex-1 px-4 py-3 rounded-xl border-2 border-ink-200 text-sm bg-surface focus:bg-white focus:border-brand outline-none transition"
        />
        <button
          onClick={() => search()}
          disabled={loading}
          className="w-12 h-12 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white flex items-center justify-center transition"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {CHIPS.map(c => (
          <button key={c} onClick={() => search(c)}
            className="text-xs text-ink-500 bg-surface border border-ink-200 hover:bg-brand-soft hover:text-brand hover:border-brand-border rounded-full px-3 py-1.5 transition">
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2 text-xs text-ink-500">
        <Bell className="w-3.5 h-3.5" />
        <span><strong className="text-ink-700">Alertas activas</strong> — recibís un aviso por WhatsApp cuando aparece una propiedad que coincide.</span>
        <button className="ml-auto text-brand font-semibold hover:underline">Configurar alerta</button>
      </div>

      {result && (
        <div className="mt-4 pt-4 border-t border-ink-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">
              <span className="font-semibold text-ink-900">{result.total} resultado{result.total !== 1 ? 's' : ''}</span>
              {result.interpretation && Object.keys(result.interpretation).length > 0 && (
                <span className="text-ink-500 ml-2 text-xs">
                  Filtros detectados:
                  {Object.entries(result.interpretation).map(([k, v]) => (
                    <span key={k} className="inline-block ml-1.5 px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-medium">{k}: {String(v)}</span>
                  ))}
                </span>
              )}
            </div>
            <button onClick={() => setResult(null)} className="text-xs text-ink-400 hover:text-ink-700">Cerrar</button>
          </div>
          {result.properties.length === 0 ? (
            <div className="text-sm text-ink-500 py-6 text-center bg-surface rounded-lg">No encontramos propiedades con esos criterios.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.properties.slice(0, 6).map(p => (
                <Link key={p.id} to={`/propiedad/${p.id}`} className="bg-surface hover:bg-white border border-ink-200 hover:border-brand-border rounded-lg p-3 transition flex gap-3">
                  <div className="w-16 h-16 rounded-md bg-ink-100 shrink-0 overflow-hidden">
                    {p.imagen && <img src={p.imagen} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-brand font-bold">{tipoLabel(p.tipo)}</div>
                    <div className="text-sm font-semibold text-ink-900 truncate">{p.titulo}</div>
                    <div className="text-xs text-ink-500 truncate">{p.barrio}</div>
                    <div className="text-sm font-bold text-brand mt-0.5">{formatPrice(p.precio)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
