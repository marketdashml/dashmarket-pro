"use client";

import { useState, useMemo } from "react";
import { Tag } from "lucide-react";
import type { SavedProduct } from "@/lib/calculator/types";
import { calculateCosts } from "@/lib/calculator/engine";

interface Props {
  products: SavedProduct[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PromotionCalc({ products }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);

  const selected = products.find(p => p.id === selectedId);

  const sim = useMemo(() => {
    if (!selected || discountValue <= 0) return null;

    const newPrice =
      discountType === "percent"
        ? selected.input.sellingPrice * (1 - discountValue / 100)
        : Math.max(0, selected.input.sellingPrice - discountValue);

    const result = calculateCosts({ ...selected.input, sellingPrice: newPrice });
    return { newPrice, result };
  }, [selected, discountType, discountValue]);

  if (products.length === 0) {
    return (
      <div className="border border-rule p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
          Salve produtos na calculadora para simular promoções.
        </p>
      </div>
    );
  }

  const marginColor = (m: number) =>
    m > 15 ? "text-signal" : m > 0 ? "text-amber-400" : "text-hazard";

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Form */}
      <div className="border border-rule bg-crt-2 p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard flex items-center gap-2 mb-5">
          <Tag className="h-3 w-3" />
          [PROMO] Calculadora de promoção
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">
            Produto
            <select
              className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors"
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setDiscountValue(0); }}
            >
              <option value="">Selecione um produto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fmt(p.input.sellingPrice)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">
              Tipo de desconto
              <select
                className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors"
                value={discountType}
                onChange={e => { setDiscountType(e.target.value as "percent" | "fixed"); setDiscountValue(0); }}
              >
                <option value="percent">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">
              {discountType === "percent" ? "Desconto %" : "Desconto R$"}
              <input
                type="number"
                min={0}
                max={discountType === "percent" ? 99 : selected?.input.sellingPrice ?? 9999}
                step={discountType === "percent" ? 1 : 0.01}
                value={discountValue || ""}
                onChange={e => setDiscountValue(Number(e.target.value))}
                placeholder="0"
                className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors"
              />
            </label>
          </div>
        </div>

        {selected && (
          <div className="mt-5 border-t border-rule pt-4 grid gap-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-muted">Preço original</span>
              <span>{fmt(selected.input.sellingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Margem original</span>
              <span className={marginColor(selected.result.profitMargin)}>
                {selected.result.profitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Lucro original</span>
              <span className={marginColor(selected.result.profitMargin)}>
                {fmt(selected.result.netProfit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="border border-rule">
        <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
          Impacto da promoção
        </div>

        {sim ? (
          <div className="p-5 grid gap-4">
            <div className="grid gap-px bg-rule border border-rule">
              {[
                ["Preço com promoção", fmt(sim.newPrice), "text-phos"],
                ["Lucro líquido", fmt(sim.result.netProfit), marginColor(sim.result.profitMargin)],
                ["Margem líquida", `${sim.result.profitMargin.toFixed(1)}%`, marginColor(sim.result.profitMargin)],
                ["Total de custos", fmt(sim.result.totalCosts), "text-hazard"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex justify-between items-center bg-crt px-4 py-3">
                  <span className="text-[11px] text-muted uppercase tracking-[0.1em]">{label}</span>
                  <span className={`font-display text-[16px] ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Comparison */}
            {selected && (
              <div className="border border-rule p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-faint mb-3">Variação</div>
                <div className="grid gap-2 text-[12px]">
                  {[
                    {
                      label: "Preço",
                      diff: sim.newPrice - selected.input.sellingPrice,
                      fmt: (v: number) => fmt(v)
                    },
                    {
                      label: "Lucro",
                      diff: sim.result.netProfit - selected.result.netProfit,
                      fmt: (v: number) => fmt(v)
                    },
                    {
                      label: "Margem",
                      diff: sim.result.profitMargin - selected.result.profitMargin,
                      fmt: (v: number) => `${v.toFixed(1)}pp`
                    }
                  ].map(({ label, diff, fmt: f }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted">{label}</span>
                      <span className={`font-semibold ${diff >= 0 ? "text-signal" : "text-hazard"}`}>
                        {diff >= 0 ? "▲" : "▼"} {f(Math.abs(diff))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 flex items-center justify-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-faint text-center">
              Selecione um produto e defina o desconto para ver o impacto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
