"use client";

import { useMemo } from "react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";

// ─── Seed data ────────────────────────────────────────────────────────────────
// Stock value = available * (price * (1 - commission%) - fixedFee - shipping)
const STOCK_SEED = [
  {
    sku: "MLB-CABO-USB-C-1M",
    title: "Cabo USB-C turbo 1m",
    channel: "Full",
    available: 420,
    reserved: 36,
    transfer: 280,
    priceGross: 55,
    commissionPct: 16,
    fixedFee: 0,
    shipping: 0,
    avgDailySales: 4.2,
    status: "Saudavel",
  },
  {
    sku: "MLB-CAPA-AIR-13",
    title: "Capa notebook Air 13",
    channel: "Full",
    available: 96,
    reserved: 12,
    transfer: 40,
    priceGross: 156,
    commissionPct: 16,
    fixedFee: 0,
    shipping: 0,
    avgDailySales: 2.8,
    status: "Atencao",
  },
  {
    sku: "MLB-SUPORTE-MESA-PRO",
    title: "Suporte articulado de mesa",
    channel: "Full",
    available: 31,
    reserved: 8,
    transfer: 20,
    priceGross: 390,
    commissionPct: 16,
    fixedFee: 0,
    shipping: 0,
    avgDailySales: 1.5,
    status: "Critico",
  },
  {
    sku: "MLB-FONE-BT-COMPACT",
    title: "Fone bluetooth compacto",
    channel: "Full",
    available: 188,
    reserved: 19,
    transfer: 0,
    priceGross: 127,
    commissionPct: 16,
    fixedFee: 0,
    shipping: 0,
    avgDailySales: 3.1,
    status: "Saudavel",
  },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v: number) => v.toLocaleString("pt-BR");

const STATUS_COLOR: Record<string, string> = {
  Saudavel: "text-signal",
  Atencao:  "text-amber-400",
  Critico:  "text-hazard",
};

function stockValue(item: typeof STOCK_SEED[0]) {
  const netPrice = item.priceGross * (1 - item.commissionPct / 100) - item.fixedFee - item.shipping;
  return item.available * netPrice;
}

function daysOfStock(item: typeof STOCK_SEED[0]) {
  if (item.avgDailySales <= 0) return Infinity;
  return Math.floor(item.available / item.avgDailySales);
}

interface Props {
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
}

export function EstoqueFullView({ dateRange, onDateChange }: Props) {
  const enriched = useMemo(() => STOCK_SEED.map(item => ({
    ...item,
    netPrice: item.priceGross * (1 - item.commissionPct / 100) - item.fixedFee - item.shipping,
    stockValue: stockValue(item),
    daysOfStock: daysOfStock(item),
  })), []);

  const totals = useMemo(() => ({
    totalValue:     enriched.reduce((s, i) => s + i.stockValue, 0),
    totalUnits:     enriched.reduce((s, i) => s + i.available, 0),
    totalReserved:  enriched.reduce((s, i) => s + i.reserved, 0),
    totalTransfer:  enriched.reduce((s, i) => s + i.transfer, 0),
    criticalCount:  enriched.filter(i => i.status === "Critico").length,
    attentionCount: enriched.filter(i => i.status === "Atencao").length,
  }), [enriched]);

  return (
    <div className="grid gap-5">
      {/* Date picker */}
      <div className="border border-rule bg-crt-2 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[EST] Estoque Full · Mercado Livre</div>
        <DateRangePicker value={dateRange} onChange={onDateChange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
        {[
          { label: "Valor em estoque",   value: fmt(totals.totalValue),    delta: "Preço venda − taxas ML", alert: false },
          { label: "Unidades disponíveis", value: fmtN(totals.totalUnits), delta: `${fmtN(totals.totalReserved)} reservadas`, alert: false },
          { label: "Em transferência",   value: fmtN(totals.totalTransfer), delta: "A caminho do CD Full", alert: false },
          { label: "Críticos / Atenção", value: `${totals.criticalCount} / ${totals.attentionCount}`, delta: "SKUs abaixo do nível seguro", alert: totals.criticalCount > 0 },
        ].map(({ label, value, delta, alert }) => (
          <div key={label} className={`p-5 flex flex-col justify-between ${alert ? "bg-hazard/[0.08]" : "bg-crt"}`}>
            <span className={`text-[10px] uppercase tracking-[0.22em] ${alert ? "text-hazard" : "text-faint"}`}>{label}</span>
            <div>
              <div className={`font-display text-[26px] leading-none tracking-tight ${alert ? "text-hazard" : "text-phos"}`}>{value}</div>
              <div className="text-[11px] mt-1.5 text-muted">{delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock table */}
      <div className="border border-rule">
        <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
          Posição detalhada por SKU
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[860px] text-[12px]">
            <thead>
              <tr className="bg-phos text-crt">
                {["SKU", "Produto", "Canal", "Disponível", "Reservado", "Em transf.", "Preço venda", "Preço líq.", "Valor estoque", "Cobertura (dias)", "Status"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.sort((a, b) => b.stockValue - a.stockValue).map((item, i) => {
                const days = item.daysOfStock;
                const daysColor = days < 15 ? "text-hazard" : days < 30 ? "text-amber-400" : "text-signal";
                return (
                  <tr key={item.sku} className={`border-t border-rule hover:bg-rule/20 ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                    <td className="px-4 py-3 font-semibold text-phos text-[11px]">{item.sku}</td>
                    <td className="px-4 py-3 text-muted">{item.title}</td>
                    <td className="px-4 py-3 text-muted">{item.channel}</td>
                    <td className="px-4 py-3 font-semibold">{fmtN(item.available)}</td>
                    <td className="px-4 py-3 text-muted">{fmtN(item.reserved)}</td>
                    <td className="px-4 py-3 text-muted">{fmtN(item.transfer)}</td>
                    <td className="px-4 py-3">{fmt(item.priceGross)}</td>
                    <td className="px-4 py-3 text-muted">{fmt(item.netPrice)}</td>
                    <td className="px-4 py-3 font-bold text-phos">{fmt(item.stockValue)}</td>
                    <td className={`px-4 py-3 font-bold ${daysColor}`}>{isFinite(days) ? days : "∞"}</td>
                    <td className={`px-4 py-3 font-bold text-[11px] uppercase tracking-[0.1em] ${STATUS_COLOR[item.status] ?? "text-muted"}`}>
                      {item.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule bg-crt-2">
                <td className="px-4 py-2.5 font-semibold text-[10.5px] uppercase tracking-[0.1em]" colSpan={3}>Total</td>
                <td className="px-4 py-2.5 font-semibold">{fmtN(totals.totalUnits)}</td>
                <td className="px-4 py-2.5 text-muted">{fmtN(totals.totalReserved)}</td>
                <td className="px-4 py-2.5 text-muted">{fmtN(totals.totalTransfer)}</td>
                <td colSpan={3} className="px-4 py-2.5 font-bold text-phos">{fmt(totals.totalValue)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="border border-rule bg-crt-2 p-4 grid grid-cols-3 gap-4 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-1">Cálculo do valor</div>
          <div className="text-muted">Valor estoque = Disponível × (Preço − Comissão% − Taxa fixa − Frete)</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-1">Cobertura</div>
          <div className="text-muted">Disponível ÷ Média de vendas por dia. &lt;15d = crítico, &lt;30d = atenção</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-1">Dados</div>
          <div className="text-muted">Demonstrativos · Conecte o ML para snapshot real do Full</div>
        </div>
      </div>
    </div>
  );
}
