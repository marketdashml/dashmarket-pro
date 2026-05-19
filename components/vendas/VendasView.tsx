"use client";

import { useMemo } from "react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";

// ─── Seed data ────────────────────────────────────────────────────────────────
const ORDER_SEED = [
  { date: "2026-04-20", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 8,  gross: 440,  fee: 67,  ship: 0,  status: "entregue"   },
  { date: "2026-04-21", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 5,  gross: 635,  fee: 99,  ship: 0,  status: "entregue"   },
  { date: "2026-04-22", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 3,  gross: 468,  fee: 73,  ship: 0,  status: "entregue"   },
  { date: "2026-04-23", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 2,  gross: 780,  fee: 127, ship: 0,  status: "entregue"   },
  { date: "2026-04-24", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 11, gross: 605,  fee: 92,  ship: 0,  status: "entregue"   },
  { date: "2026-04-25", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 7,  gross: 889,  fee: 138, ship: 0,  status: "entregue"   },
  { date: "2026-04-26", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 4,  gross: 624,  fee: 97,  ship: 0,  status: "cancelado"  },
  { date: "2026-04-27", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 3,  gross: 1170, fee: 190, ship: 0,  status: "entregue"   },
  { date: "2026-04-28", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 9,  gross: 495,  fee: 75,  ship: 0,  status: "entregue"   },
  { date: "2026-04-29", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 6,  gross: 762,  fee: 118, ship: 0,  status: "entregue"   },
  { date: "2026-04-30", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 5,  gross: 780,  fee: 121, ship: 0,  status: "entregue"   },
  { date: "2026-05-01", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 4,  gross: 1560, fee: 254, ship: 0,  status: "entregue"   },
  { date: "2026-05-02", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 14, gross: 770,  fee: 117, ship: 0,  status: "entregue"   },
  { date: "2026-05-03", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 8,  gross: 1016, fee: 158, ship: 0,  status: "entregue"   },
  { date: "2026-05-04", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 6,  gross: 936,  fee: 145, ship: 0,  status: "entregue"   },
  { date: "2026-05-05", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 3,  gross: 1170, fee: 190, ship: 0,  status: "entregue"   },
  { date: "2026-05-06", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 12, gross: 660,  fee: 100, ship: 0,  status: "entregue"   },
  { date: "2026-05-07", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 9,  gross: 1143, fee: 178, ship: 0,  status: "entregue"   },
  { date: "2026-05-08", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 4,  gross: 624,  fee: 97,  ship: 0,  status: "devolvido"  },
  { date: "2026-05-09", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 5,  gross: 1950, fee: 317, ship: 0,  status: "entregue"   },
  { date: "2026-05-10", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 16, gross: 880,  fee: 134, ship: 0,  status: "entregue"   },
  { date: "2026-05-11", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 10, gross: 1270, fee: 197, ship: 0,  status: "entregue"   },
  { date: "2026-05-12", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 7,  gross: 1092, fee: 169, ship: 0,  status: "entregue"   },
  { date: "2026-05-13", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 4,  gross: 1560, fee: 254, ship: 0,  status: "entregue"   },
  { date: "2026-05-14", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 13, gross: 715,  fee: 109, ship: 0,  status: "entregue"   },
  { date: "2026-05-15", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 11, gross: 1397, fee: 217, ship: 0,  status: "entregue"   },
  { date: "2026-05-16", sku: "MLB-CAPA-AIR-13",      title: "Capa notebook Air 13",       qty: 5,  gross: 780,  fee: 121, ship: 0,  status: "entregue"   },
  { date: "2026-05-17", sku: "MLB-SUPORTE-MESA-PRO", title: "Suporte articulado de mesa", qty: 6,  gross: 2340, fee: 380, ship: 0,  status: "entregue"   },
  { date: "2026-05-18", sku: "MLB-CABO-USB-C-1M",    title: "Cabo USB-C turbo 1m",        qty: 15, gross: 825,  fee: 125, ship: 0,  status: "entregue"   },
  { date: "2026-05-19", sku: "MLB-FONE-BT-COMPACT",  title: "Fone bluetooth compacto",    qty: 7,  gross: 889,  fee: 138, ship: 0,  status: "entregue"   },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v: number) => v.toLocaleString("pt-BR");

const STATUS_COLOR: Record<string, string> = {
  entregue:  "text-signal",
  cancelado: "text-hazard",
  devolvido: "text-amber-400",
};

interface Props {
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
}

export function VendasView({ dateRange, onDateChange }: Props) {
  const filtered = useMemo(() =>
    ORDER_SEED.filter(o => o.date >= dateRange.from && o.date <= dateRange.to),
    [dateRange]
  );

  const totals = useMemo(() => {
    const entregues = filtered.filter(o => o.status === "entregue");
    return {
      gmv:       filtered.reduce((s, o) => s + o.gross, 0),
      net:       entregues.reduce((s, o) => s + (o.gross - o.fee - o.ship), 0),
      fees:      filtered.reduce((s, o) => s + o.fee, 0),
      orders:    filtered.length,
      units:     filtered.reduce((s, o) => s + o.qty, 0),
      ticket:    filtered.length > 0 ? filtered.reduce((s, o) => s + o.gross, 0) / filtered.length : 0,
      cancelados: filtered.filter(o => o.status === "cancelado" || o.status === "devolvido").length,
    };
  }, [filtered]);

  // Group by SKU
  const bySku = useMemo(() => {
    const map = new Map<string, { title: string; qty: number; gross: number; fee: number; orders: number }>();
    filtered.filter(o => o.status === "entregue").forEach(o => {
      const cur = map.get(o.sku) ?? { title: o.title, qty: 0, gross: 0, fee: 0, orders: 0 };
      map.set(o.sku, { title: o.title, qty: cur.qty + o.qty, gross: cur.gross + o.gross, fee: cur.fee + o.fee, orders: cur.orders + 1 });
    });
    return [...map.entries()].sort((a, b) => b[1].gross - a[1].gross);
  }, [filtered]);

  // Bar chart data — daily GMV
  const dailyGmv = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(o => map.set(o.date, (map.get(o.date) ?? 0) + o.gross));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const maxGmv = Math.max(...dailyGmv.map(([, v]) => v), 1);

  return (
    <div className="grid gap-5">
      {/* Date picker */}
      <div className="border border-rule bg-crt-2 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[VND] Vendas · Mercado Livre</div>
        <DateRangePicker value={dateRange} onChange={onDateChange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
        {[
          { label: "GMV bruto",      value: fmt(totals.gmv),         delta: `${fmtN(totals.orders)} pedidos` },
          { label: "Receita líquida", value: fmt(totals.net),         delta: `Após taxas e frete` },
          { label: "Taxas ML",        value: fmt(totals.fees),        delta: `${totals.gmv > 0 ? ((totals.fees/totals.gmv)*100).toFixed(1) : 0}% do GMV`, alert: true },
          { label: "Ticket médio",    value: fmt(totals.ticket),      delta: `${fmtN(totals.units)} unidades · ${totals.cancelados} cancel.` },
        ].map(({ label, value, delta, alert }) => (
          <div key={label} className={`p-5 flex flex-col justify-between ${alert ? "bg-hazard/[0.05]" : "bg-crt"}`}>
            <span className={`text-[10px] uppercase tracking-[0.22em] ${alert ? "text-hazard" : "text-faint"}`}>{label}</span>
            <div>
              <div className={`font-display text-[26px] leading-none tracking-tight ${alert ? "text-hazard" : "text-phos"}`}>{value}</div>
              <div className="text-[11px] mt-1.5 text-muted">{delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily bar chart */}
      {dailyGmv.length > 0 && (
        <div className="border border-rule">
          <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
            GMV por dia
          </div>
          <div className="p-4 flex items-end gap-1 h-28 overflow-x-auto">
            {dailyGmv.map(([date, val]) => (
              <div key={date} className="flex flex-col items-center gap-1 flex-1 min-w-[20px]">
                <div
                  className="w-full bg-hazard/60 hover:bg-hazard transition-colors"
                  style={{ height: `${Math.round((val / maxGmv) * 60)}px` }}
                  title={`${date}: ${fmt(val)}`}
                />
                <span className="text-[8px] text-faint rotate-90 origin-center hidden sm:block">
                  {date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKU breakdown */}
      <div className="border border-rule">
        <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
          Vendas por SKU (apenas entregues)
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-phos text-crt">
              {["SKU", "Produto", "Qtd", "Pedidos", "GMV Bruto", "Taxas ML", "Receita Líq."].map(h => (
                <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bySku.map(([sku, d], i) => (
              <tr key={sku} className={`border-t border-rule hover:bg-rule/20 ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                <td className="px-4 py-2.5 font-semibold text-phos text-[11px]">{sku}</td>
                <td className="px-4 py-2.5 text-muted">{d.title}</td>
                <td className="px-4 py-2.5">{fmtN(d.qty)}</td>
                <td className="px-4 py-2.5 text-muted">{d.orders}</td>
                <td className="px-4 py-2.5 font-semibold">{fmt(d.gross)}</td>
                <td className="px-4 py-2.5 text-hazard">{fmt(d.fee)}</td>
                <td className="px-4 py-2.5 font-bold text-signal">{fmt(d.gross - d.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order log */}
      <div className="border border-rule">
        <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
          Log de pedidos
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[700px] text-[12px]">
            <thead>
              <tr className="bg-phos text-crt">
                {["Data", "SKU", "Qtd", "GMV", "Taxas", "Líquido", "Status"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map((o, i) => (
                <tr key={`${o.date}-${o.sku}-${i}`} className={`border-t border-rule ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                  <td className="px-4 py-2 text-faint">{o.date}</td>
                  <td className="px-4 py-2 text-phos font-semibold text-[11px]">{o.sku}</td>
                  <td className="px-4 py-2">{o.qty}</td>
                  <td className="px-4 py-2">{fmt(o.gross)}</td>
                  <td className="px-4 py-2 text-hazard">{fmt(o.fee)}</td>
                  <td className="px-4 py-2 font-semibold">{fmt(o.gross - o.fee - o.ship)}</td>
                  <td className={`px-4 py-2 font-bold text-[11px] uppercase tracking-[0.1em] ${STATUS_COLOR[o.status] ?? "text-muted"}`}>
                    {o.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.14em] text-faint border-t border-rule pt-3">
        Dados demonstrativos · Conecte a API do Mercado Livre para dados reais
      </div>
    </div>
  );
}
