"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { SavedProduct } from "@/lib/calculator/types";
import { suggestedPrice } from "@/lib/calculator/engine";

interface Props {
  products: SavedProduct[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function MarginAlerts({ products }: Props) {
  const [minMargin, setMinMargin] = useState(15);

  const below = products.filter(p => p.result.profitMargin < minMargin);
  const above = products.filter(p => p.result.profitMargin >= minMargin);

  if (products.length === 0) {
    return (
      <div className="border border-rule p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
          Salve produtos na calculadora para monitorar alertas de margem.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {/* Config */}
      <div className="border border-rule bg-crt-2 p-5 flex items-center gap-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          [ALT] Alerta de margem mínima
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] uppercase tracking-[0.1em] text-muted">Mínimo</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={minMargin}
            onChange={e => setMinMargin(Number(e.target.value))}
            className="w-20 h-8 bg-crt border border-rule px-3 text-phos text-[12px] text-center outline-none focus:border-hazard transition-colors"
          />
          <span className="text-[11px] text-muted">%</span>
        </div>
        <div className="ml-auto flex gap-4 text-[11px] uppercase tracking-[0.1em]">
          <span className="text-hazard">{below.length} abaixo</span>
          <span className="text-signal">{above.length} ok</span>
        </div>
      </div>

      {/* Below threshold */}
      {below.length > 0 && (
        <div className="border border-hazard/40">
          <div className="bg-hazard/[0.06] px-4 py-2.5 border-b border-hazard/40 text-[10px] uppercase tracking-[0.22em] text-hazard">
            Abaixo do limite — {below.length} produto{below.length > 1 ? "s" : ""}
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-phos text-crt">
                {["Produto", "Marketplace", "Preço atual", "Margem atual", "Preço sugerido"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {below.map((p, i) => {
                const suggested = suggestedPrice(p.input, minMargin);
                return (
                  <tr key={p.id} className={`border-t border-rule ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-phos">{p.name}</div>
                      <div className="text-[11px] text-faint">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.marketplace}</td>
                    <td className="px-4 py-3">{fmt(p.input.sellingPrice)}</td>
                    <td className="px-4 py-3 font-bold text-hazard">{p.result.profitMargin.toFixed(1)}%</td>
                    <td className="px-4 py-3 font-bold text-signal">{fmt(suggested)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Above threshold */}
      {above.length > 0 && (
        <div className="border border-rule">
          <div className="bg-crt-2 px-4 py-2.5 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-signal">
            Dentro do limite — {above.length} produto{above.length > 1 ? "s" : ""}
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-phos text-crt">
                {["Produto", "Marketplace", "Preço", "Margem", "Lucro líquido"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {above.map((p, i) => (
                <tr key={p.id} className={`border-t border-rule ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-phos">{p.name}</div>
                    <div className="text-[11px] text-faint">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.marketplace}</td>
                  <td className="px-4 py-3">{fmt(p.input.sellingPrice)}</td>
                  <td className="px-4 py-3 font-bold text-signal">{p.result.profitMargin.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-bold text-signal">{fmt(p.result.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
