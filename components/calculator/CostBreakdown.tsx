"use client";

import type { CalculatorResult } from "@/lib/calculator/types";

interface Props {
  result: CalculatorResult | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (v: number) => `${v.toFixed(2)}%`;

export function CostBreakdown({ result }: Props) {
  if (!result) {
    return (
      <div className="border border-rule h-full flex items-center justify-center p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint text-center">
          Preencha os campos ao lado<br />para ver a análise de custos.
        </p>
      </div>
    );
  }

  const margin = result.profitMargin;
  const marginColor =
    margin > 15 ? "text-signal" : margin > 0 ? "text-amber-400" : "text-hazard";
  const marginLabel =
    margin > 15 ? "SAUDAVEL" : margin > 0 ? "ATENCAO" : "CRITICO";

  const rows: { label: string; value: number; isCredit?: boolean }[] = [
    { label: "Custo do produto",        value: -result.productCost },
    { label: "Comissão marketplace",    value: -result.commission },
    { label: "Taxa fixa",               value: -result.fixedFee },
    { label: "Impostos",                value: -result.taxes },
    { label: "Frete",                   value: -result.shippingCost },
    { label: "Embalagem",               value: -result.packagingCost },
    { label: "Coleta (Full)",           value: -result.collectionCost },
    { label: "Armazenagem",             value: -result.storageCost },
    { label: "Operacional",             value: -result.operationalCost },
    { label: "Comissão afiliado",       value: -result.affiliateCommission },
    { label: `TACOS (${pct(result.tacosPercentage)})`, value: -result.tacosCost },
    { label: "Crédito promoção",        value: result.promotionCredit, isCredit: true },
  ].filter(r => r.value !== 0);

  return (
    <div className="border border-rule flex flex-col h-full">
      {/* Header */}
      <div className="bg-crt-2 px-4 py-3 border-b border-rule flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">
          Análise de custos
        </div>
        <div className={`text-[10px] uppercase tracking-[0.18em] font-semibold border px-2 py-1 ${
          margin > 15 ? "border-signal text-signal" :
          margin > 0  ? "border-amber-400 text-amber-400" :
                        "border-hazard text-hazard"
        }`}>
          {marginLabel} · {pct(margin)}
        </div>
      </div>

      {/* Selling price */}
      <div className="px-4 py-3 border-b border-rule flex justify-between items-center">
        <span className="text-[12px] font-semibold text-phos">Preço de venda</span>
        <span className="font-display text-[18px] text-phos">{fmt(result.sellingPrice)}</span>
      </div>

      {/* Cost rows */}
      <div className="flex-1 overflow-auto">
        {rows.map(({ label, value, isCredit }) => (
          <div
            key={label}
            className="flex justify-between items-center px-4 py-2 border-b border-rule/50 text-[12px]"
          >
            <span className="text-muted pl-2 border-l border-rule">{label}</span>
            <span className={isCredit ? "text-signal" : value < 0 ? "text-hazard" : "text-phos"}>
              {value < 0 ? `− ${fmt(Math.abs(value))}` : `+ ${fmt(value)}`}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-rule">
        <div className="flex justify-between items-center px-4 py-2.5 text-[12px]">
          <span className="text-muted uppercase tracking-[0.1em]">Total de custos</span>
          <span className="text-hazard font-semibold">− {fmt(result.totalCosts)}</span>
        </div>
        <div className={`flex justify-between items-center px-4 py-3 bg-crt-2 ${marginColor}`}>
          <span className="text-[13px] font-semibold uppercase tracking-[0.1em]">Lucro líquido</span>
          <div className="text-right">
            <div className="font-display text-[22px] leading-none">{fmt(result.netProfit)}</div>
            <div className="text-[11px] mt-0.5 opacity-70">Markup: {pct(result.markup)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
