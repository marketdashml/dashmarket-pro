"use client";

import type { SavedProduct } from "@/lib/calculator/types";

interface Props {
  products: SavedProduct[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ParetoRanking({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="border border-rule p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
          Salve produtos na calculadora para ver o ranking Pareto.
        </p>
      </div>
    );
  }

  const sorted = [...products].sort((a, b) => b.result.profitMargin - a.result.profitMargin);
  const totalProfit = sorted.reduce((sum, p) => sum + p.result.netProfit, 0);
  let cumulative = 0;

  return (
    <div className="border border-rule">
      <div className="bg-crt-2 px-4 py-3 border-b border-rule flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">
          [PAR] Ranking Pareto — lucratividade por SKU
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-faint">
          {sorted.length} produtos · total {fmt(totalProfit)}
        </span>
      </div>

      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-phos text-crt">
            {["#", "Produto", "Marketplace", "Preço", "Custo", "Lucro líquido", "Margem %", "% acumulado"].map(h => (
              <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            cumulative += p.result.netProfit;
            const cumulativePct = totalProfit > 0 ? (cumulative / totalProfit) * 100 : 0;
            const isPareto = cumulativePct <= 80;

            return (
              <tr
                key={p.id}
                className={`border-t border-rule ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}
              >
                <td className="px-4 py-3">
                  <span className={`font-display text-[13px] ${i < 3 ? "text-hazard" : "text-faint"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-phos">{p.name}</div>
                  <div className="text-[11px] text-faint">{p.sku}</div>
                </td>
                <td className="px-4 py-3 text-muted">{p.marketplace}</td>
                <td className="px-4 py-3">{fmt(p.input.sellingPrice)}</td>
                <td className="px-4 py-3 text-muted">{fmt(p.result.productCost)}</td>
                <td className={`px-4 py-3 font-bold ${p.result.netProfit >= 0 ? "text-signal" : "text-hazard"}`}>
                  {fmt(p.result.netProfit)}
                </td>
                <td className={`px-4 py-3 font-bold ${p.result.profitMargin >= 15 ? "text-signal" : p.result.profitMargin >= 0 ? "text-amber-400" : "text-hazard"}`}>
                  {p.result.profitMargin.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-rule">
                      <div
                        className={`h-1.5 ${isPareto ? "bg-signal" : "bg-rule-strong"}`}
                        style={{ width: `${Math.min(cumulativePct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-mono w-10 text-right ${isPareto ? "text-signal" : "text-faint"}`}>
                      {cumulativePct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t border-rule bg-crt-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-faint">
        Produtos até 80% do lucro acumulado são destacados em verde — princípio de Pareto.
      </div>
    </div>
  );
}
