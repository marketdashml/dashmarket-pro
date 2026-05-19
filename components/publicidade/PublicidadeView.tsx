"use client";

import { useMemo } from "react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";

// ─── Seed data ────────────────────────────────────────────────────────────────
const ADS_SEED = [
  { date: "2026-04-20", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 28,  clicks: 84,  impressions: 2800, attrRevenue: 120, totalRevenue: 440  },
  { date: "2026-04-21", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 22,  clicks: 61,  impressions: 2100, attrRevenue: 85,  totalRevenue: 635  },
  { date: "2026-04-22", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 18,  clicks: 45,  impressions: 1600, attrRevenue: 70,  totalRevenue: 468  },
  { date: "2026-04-23", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 35,  clicks: 72,  impressions: 2200, attrRevenue: 200, totalRevenue: 780  },
  { date: "2026-04-24", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 31,  clicks: 92,  impressions: 3100, attrRevenue: 140, totalRevenue: 605  },
  { date: "2026-04-25", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 26,  clicks: 78,  impressions: 2600, attrRevenue: 110, totalRevenue: 889  },
  { date: "2026-04-26", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 20,  clicks: 54,  impressions: 1800, attrRevenue: 90,  totalRevenue: 624  },
  { date: "2026-04-27", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 42,  clicks: 88,  impressions: 2900, attrRevenue: 240, totalRevenue: 1170 },
  { date: "2026-04-28", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 29,  clicks: 86,  impressions: 2900, attrRevenue: 130, totalRevenue: 495  },
  { date: "2026-04-29", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 24,  clicks: 70,  impressions: 2350, attrRevenue: 100, totalRevenue: 762  },
  { date: "2026-04-30", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 22,  clicks: 60,  impressions: 2000, attrRevenue: 95,  totalRevenue: 780  },
  { date: "2026-05-01", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 48,  clicks: 100, impressions: 3200, attrRevenue: 280, totalRevenue: 1560 },
  { date: "2026-05-02", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 38,  clicks: 110, impressions: 3700, attrRevenue: 170, totalRevenue: 770  },
  { date: "2026-05-03", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 32,  clicks: 95,  impressions: 3200, attrRevenue: 145, totalRevenue: 1016 },
  { date: "2026-05-04", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 25,  clicks: 68,  impressions: 2300, attrRevenue: 110, totalRevenue: 936  },
  { date: "2026-05-05", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 44,  clicks: 92,  impressions: 3000, attrRevenue: 260, totalRevenue: 1170 },
  { date: "2026-05-06", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 33,  clicks: 98,  impressions: 3300, attrRevenue: 150, totalRevenue: 660  },
  { date: "2026-05-07", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 28,  clicks: 82,  impressions: 2750, attrRevenue: 120, totalRevenue: 1143 },
  { date: "2026-05-08", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 19,  clicks: 50,  impressions: 1700, attrRevenue: 80,  totalRevenue: 624  },
  { date: "2026-05-09", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 52,  clicks: 110, impressions: 3600, attrRevenue: 300, totalRevenue: 1950 },
  { date: "2026-05-10", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 40,  clicks: 120, impressions: 4000, attrRevenue: 180, totalRevenue: 880  },
  { date: "2026-05-11", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 35,  clicks: 105, impressions: 3500, attrRevenue: 160, totalRevenue: 1270 },
  { date: "2026-05-12", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 28,  clicks: 75,  impressions: 2500, attrRevenue: 125, totalRevenue: 1092 },
  { date: "2026-05-13", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 55,  clicks: 115, impressions: 3800, attrRevenue: 320, totalRevenue: 1560 },
  { date: "2026-05-14", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 36,  clicks: 108, impressions: 3600, attrRevenue: 165, totalRevenue: 715  },
  { date: "2026-05-15", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 38,  clicks: 114, impressions: 3800, attrRevenue: 175, totalRevenue: 1397 },
  { date: "2026-05-16", sku: "MLB-CAPA-AIR-13",      campaign: "Capa Air Boost",     spend: 24,  clicks: 64,  impressions: 2150, attrRevenue: 105, totalRevenue: 780  },
  { date: "2026-05-17", sku: "MLB-SUPORTE-MESA-PRO", campaign: "Suporte Premium",    spend: 60,  clicks: 125, impressions: 4100, attrRevenue: 345, totalRevenue: 2340 },
  { date: "2026-05-18", sku: "MLB-CABO-USB-C-1M",    campaign: "Cabo USB Auto",      spend: 42,  clicks: 126, impressions: 4200, attrRevenue: 190, totalRevenue: 825  },
  { date: "2026-05-19", sku: "MLB-FONE-BT-COMPACT",  campaign: "Fone Bluetooth Pro", spend: 30,  clicks: 90,  impressions: 3000, attrRevenue: 135, totalRevenue: 889  },
];

const fmt  = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct  = (v: number) => `${v.toFixed(1)}%`;
const fmtN = (v: number) => v.toLocaleString("pt-BR");

function acosColor(acos: number) {
  if (acos > 30) return "text-hazard";
  if (acos > 15) return "text-amber-400";
  return "text-signal";
}

interface Props {
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
}

export function PublicidadeView({ dateRange, onDateChange }: Props) {
  const filtered = useMemo(() =>
    ADS_SEED.filter(r => r.date >= dateRange.from && r.date <= dateRange.to),
    [dateRange]
  );

  const totals = useMemo(() => {
    const spend       = filtered.reduce((s, r) => s + r.spend, 0);
    const attrRev     = filtered.reduce((s, r) => s + r.attrRevenue, 0);
    const totalRev    = filtered.reduce((s, r) => s + r.totalRevenue, 0);
    const clicks      = filtered.reduce((s, r) => s + r.clicks, 0);
    const impressions = filtered.reduce((s, r) => s + r.impressions, 0);
    const acos        = attrRev > 0 ? (spend / attrRev) * 100 : 0;
    const roas        = spend > 0 ? attrRev / spend : 0;
    const tacos       = totalRev > 0 ? (spend / totalRev) * 100 : 0;
    const ctr         = impressions > 0 ? (clicks / impressions) * 100 : 0;
    return { spend, attrRev, totalRev, clicks, impressions, acos, roas, tacos, ctr };
  }, [filtered]);

  // By SKU
  const bySku = useMemo(() => {
    const map = new Map<string, { campaign: string; spend: number; attrRevenue: number; totalRevenue: number; clicks: number; impressions: number }>();
    filtered.forEach(r => {
      const cur = map.get(r.sku) ?? { campaign: r.campaign, spend: 0, attrRevenue: 0, totalRevenue: 0, clicks: 0, impressions: 0 };
      map.set(r.sku, {
        campaign: r.campaign,
        spend: cur.spend + r.spend,
        attrRevenue: cur.attrRevenue + r.attrRevenue,
        totalRevenue: cur.totalRevenue + r.totalRevenue,
        clicks: cur.clicks + r.clicks,
        impressions: cur.impressions + r.impressions,
      });
    });
    return [...map.entries()].sort((a, b) => b[1].spend - a[1].spend);
  }, [filtered]);

  return (
    <div className="grid gap-5">
      {/* Date picker */}
      <div className="border border-rule bg-crt-2 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[PUB] Publicidade · ADS Mercado Livre</div>
        <DateRangePicker value={dateRange} onChange={onDateChange} />
      </div>

      {/* KPI telemetry grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
        {[
          { label: "Investimento total",  value: fmt(totals.spend),             delta: `${fmtN(totals.clicks)} cliques · CTR ${pct(totals.ctr)}`, alert: false },
          { label: "ACOS",               value: pct(totals.acos),              delta: "Ad spend ÷ Receita atribuída",                             alert: totals.acos > 20 },
          { label: "ROAS",               value: `${totals.roas.toFixed(2)}×`,  delta: "Receita atribuída ÷ Ad spend",                             alert: totals.roas < 3  },
          { label: "TACOS",              value: pct(totals.tacos),             delta: "Ad spend ÷ Receita total",                                  alert: totals.tacos > 15 },
        ].map(({ label, value, delta, alert }) => (
          <div key={label} className={`p-5 flex flex-col justify-between ${alert ? "bg-hazard/[0.08]" : "bg-crt"}`}>
            <span className={`text-[10px] uppercase tracking-[0.22em] ${alert ? "text-hazard" : "text-faint"}`}>{label}</span>
            <div>
              <div className={`font-display text-[28px] leading-none tracking-tight ${alert ? "text-hazard" : "text-phos"}`}>{value}</div>
              <div className="text-[11px] mt-1.5 text-muted">{delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
        {[
          { label: "Receita atribuída", value: fmt(totals.attrRev),       delta: "Diretamente dos ADS" },
          { label: "Receita total",     value: fmt(totals.totalRev),      delta: "Período selecionado" },
          { label: "Impressões",        value: fmtN(totals.impressions),  delta: `CTR ${pct(totals.ctr)}` },
          { label: "Cliques",           value: fmtN(totals.clicks),       delta: `CPC médio ${fmt(totals.clicks > 0 ? totals.spend / totals.clicks : 0)}` },
        ].map(({ label, value, delta }) => (
          <div key={label} className="bg-crt p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-faint">{label}</span>
            <div>
              <div className="font-display text-[20px] leading-none tracking-tight text-phos">{value}</div>
              <div className="text-[11px] mt-1 text-muted">{delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* By SKU */}
      <div className="border border-rule">
        <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
          Métricas por SKU / Campanha
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[860px] text-[12px]">
            <thead>
              <tr className="bg-phos text-crt">
                {["SKU", "Campanha", "Investido", "Cliques", "Impressões", "CTR", "Rec. Atrib.", "ACOS", "ROAS", "TACOS"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bySku.map(([sku, d], i) => {
                const acos  = d.attrRevenue > 0 ? (d.spend / d.attrRevenue) * 100 : 0;
                const roas  = d.spend > 0 ? d.attrRevenue / d.spend : 0;
                const tacos = d.totalRevenue > 0 ? (d.spend / d.totalRevenue) * 100 : 0;
                const ctr   = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
                return (
                  <tr key={sku} className={`border-t border-rule hover:bg-rule/20 ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                    <td className="px-4 py-2.5 font-semibold text-phos text-[11px]">{sku}</td>
                    <td className="px-4 py-2.5 text-muted">{d.campaign}</td>
                    <td className="px-4 py-2.5">{fmt(d.spend)}</td>
                    <td className="px-4 py-2.5">{fmtN(d.clicks)}</td>
                    <td className="px-4 py-2.5 text-muted">{fmtN(d.impressions)}</td>
                    <td className="px-4 py-2.5 text-muted">{pct(ctr)}</td>
                    <td className="px-4 py-2.5">{fmt(d.attrRevenue)}</td>
                    <td className={`px-4 py-2.5 font-bold ${acosColor(acos)}`}>{pct(acos)}</td>
                    <td className={`px-4 py-2.5 font-bold ${roas >= 3 ? "text-signal" : "text-amber-400"}`}>{roas.toFixed(2)}×</td>
                    <td className={`px-4 py-2.5 font-bold ${tacos > 15 ? "text-hazard" : tacos > 10 ? "text-amber-400" : "text-signal"}`}>{pct(tacos)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Definitions */}
      <div className="border border-rule bg-crt-2 p-4 grid grid-cols-3 gap-4 text-[11px]">
        <div><div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-1">ACOS</div><div className="text-muted">Ad Cost of Sales = Gasto / Receita atribuída. Ideal &lt;15%.</div></div>
        <div><div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-1">ROAS</div><div className="text-muted">Return on Ad Spend = Receita atribuída / Gasto. Ideal &gt;3×.</div></div>
        <div><div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-1">TACOS</div><div className="text-muted">Total Ad Cost of Sales = Gasto / Receita total (inclui orgânico). Ideal &lt;10%.</div></div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.14em] text-faint border-t border-rule pt-3">
        Dados demonstrativos · Conecte a API do Mercado Livre para dados reais de ADS
      </div>
    </div>
  );
}
