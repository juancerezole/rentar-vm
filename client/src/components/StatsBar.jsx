import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { TrendingUp, Cloud, Building, Flame } from 'lucide-react';

export default function StatsBar() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/stats/summary').then(r => setData(r.data)).catch(() => {});
  }, []);
  if (!data) return null;
  return (
    <div className="bg-white dark:bg-night-card border-b border-ink-200 dark:border-night-border">
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center text-[11.5px] divide-x divide-ink-200 dark:divide-night-border">
        <Item
          label="Dólar blue"
          value={`$${data.dolarBlue.compra} / $${data.dolarBlue.venta}`}
          extra={
            <span className="text-success dark:text-success inline-flex items-center gap-0.5 font-semibold">
              <TrendingUp className="w-3 h-3" />{data.dolarBlue.variacion}
            </span>
          }
          accent
        />
        <Item label="Clima" value={`${data.clima.tempC}°C · ${data.clima.descripcion}`} icon={<Cloud className="w-3.5 h-3.5 text-ink-400 dark:text-night-dim" />} />
        <Item label="Propiedades" value={data.propiedades} icon={<Building className="w-3.5 h-3.5 text-ink-400 dark:text-night-dim" />} />
        <Item label="Inmobiliarias" value={data.inmobiliarias} />
        {data.liquidacion > 0 && (
          <div className="ml-auto pl-4 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-orange bg-accent-orange-soft dark:bg-accent-orange/10 border border-accent-orange-border dark:border-accent-orange/25 rounded-full px-2.5 py-0.5">
              <Flame className="w-3 h-3" /> {data.liquidacion} en liquidación
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ label, value, extra, icon, accent }) {
  return (
    <div className="px-4 first:pl-0 flex items-center gap-2">
      {icon}
      <span className="text-ink-400 dark:text-night-dim">{label}</span>
      <span className={`font-semibold ${accent ? 'text-brand dark:text-accent-orange' : 'text-ink-900 dark:text-night-text'}`}>{value}</span>
      {extra}
    </div>
  );
}
