import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdBanner() {
  const [banners, setBanners] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.get('/banners').then(r => setBanners(r.data.banners)).catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;
  const b = banners[idx];

  return (
    <div className="bg-brand-mid dark:bg-night-elevated text-white">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4 relative">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 border border-white/20 px-2 py-0.5 rounded shrink-0">
          Publicidad
        </span>
        <div className="w-px h-5 bg-white/15 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] truncate">{b.titulo}</div>
          {b.subtitulo && <div className="text-[11px] text-white/50 truncate hidden sm:block">{b.subtitulo}</div>}
        </div>
        <button className="text-[11px] font-semibold text-white border border-white/30 hover:bg-white/10 hover:border-white/55 px-3 py-1.5 rounded-lg transition shrink-0">
          Contactar
        </button>
        {banners.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <div key={i} className={`h-0.5 rounded-full transition-all ${i === idx ? 'bg-white/60 w-4' : 'bg-white/20 w-1.5'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
