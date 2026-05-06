import { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { formatPrice } from '../api.js';

export default function Calculadora() {
  const [alquiler, setAlquiler] = useState(280000);
  const [expensas, setExpensas] = useState(35000);
  const [meses, setMeses] = useState(1);
  const [honorariosPct, setHonorariosPct] = useState(4);
  const [sellado, setSellado] = useState(true);

  const calc = useMemo(() => {
    const a = Number(alquiler) || 0;
    const e = Number(expensas) || 0;
    const m = Number(meses) || 0;
    const h = Number(honorariosPct) || 0;
    const deposito = a * m;
    const honorarios = a * (h / 100);
    const selladoMonto = sellado ? a * 12 * 0.012 : 0; // 1.2% del contrato 12m
    const total = a + e + deposito + honorarios + selladoMonto;
    const recurrente = a + e;
    return { a, e, deposito, honorarios, sellado: selladoMonto, total, recurrente };
  }, [alquiler, expensas, meses, honorariosPct, sellado]);

  return (
    <div className="bg-white border border-ink-200 rounded-2xl shadow-soft overflow-hidden">
      <div className="p-5 border-b border-ink-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center">
          <Calculator className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-ink-900 leading-tight">Calculadora de costo real</h3>
          <p className="text-xs text-ink-500">Calculá lo que necesitás tener disponible para firmar — sin sorpresas.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="p-5 space-y-3">
          <Input label="Alquiler mensual" value={alquiler} onChange={setAlquiler} prefix="$" />
          <Input label="Expensas estimadas" value={expensas} onChange={setExpensas} prefix="$" />
          <Input label="Meses de depósito" value={meses} onChange={setMeses} max={3} />
          <Input label="Honorarios inmobiliaria" value={honorariosPct} onChange={setHonorariosPct} suffix="%" />
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={sellado} onChange={e => setSellado(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded" />
            <span className="text-sm text-ink-700">Incluir sellado de contrato (1,2% sobre 12 meses)</span>
          </label>
          <div className="flex items-start gap-2 mt-4 p-3 bg-surface rounded-lg text-xs text-ink-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-ink-400" />
            <span>Los valores son estimados. Honorarios y sellado pueden variar según la inmobiliaria y la jurisdicción.</span>
          </div>
        </div>

        <div className="bg-brand text-white p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4">Resumen — Primer mes</div>
          <Row k="Alquiler" v={calc.a} />
          <Row k="Expensas" v={calc.e} />
          <Row k={`Depósito (${meses} mes${meses != 1 ? 'es' : ''})`} v={calc.deposito} />
          <Row k={`Honorarios (${honorariosPct}%)`} v={calc.honorarios} />
          {sellado && <Row k="Sellado contrato" v={calc.sellado} />}
          <div className="mt-4 pt-4 border-t border-white/15">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">Total a desembolsar</span>
              <span className="text-3xl font-extrabold tracking-tight">{formatPrice(calc.total)}</span>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm text-white/70">
              <span>Mes a mes después del primero</span>
              <span className="font-semibold text-white">{formatPrice(calc.recurrente)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, prefix, suffix, max }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-500 mb-1">{label}</span>
      <div className="flex items-center bg-surface border-2 border-ink-200 rounded-lg focus-within:border-brand transition">
        {prefix && <span className="pl-3 text-ink-400 font-medium">{prefix}</span>}
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-transparent outline-none text-ink-900 font-semibold text-right"
        />
        {suffix && <span className="pr-3 text-ink-400 font-medium">{suffix}</span>}
      </div>
    </label>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-none">
      <span className="text-sm text-white/75">{k}</span>
      <span className="text-sm font-semibold">{formatPrice(v)}</span>
    </div>
  );
}
