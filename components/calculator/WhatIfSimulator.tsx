"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { SavedProduct } from "@/lib/calculator/types";
import { simulateWhatIf } from "@/lib/calculator/engine";

interface Props {
  products: SavedProduct[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CrtSlider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const display = `${value > 0 ? "+" : ""}${value.toFixed(unit === "R$" ? 2 : 1)}${unit}`;
  const color = value > 0 ? "text-signal" : value < 0 ? "text-hazard" : "text-faint";

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between items-center text-[11px] uppercase tracking-[0.1em]">
        <span className="text-muted">{label}</span>
        <span className={`font-mono font-semibold ${color}`}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-rule appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-phos
          [&::-webkit-slider-thumb]:rounded-none
          accent-phos"
      />
      <div className="flex justify-between text-[9px] text-faint">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function WhatIfSimulator({ products }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [priceAdjust, setPriceAdjust] = useState(0);
  const [commissionAdjust, setCommissionAdjust] = useState(0);
  const [shippingAdjust, setShippingAdjust] = useState(0);
  const [taxAdjust, setTaxAdjust] = useState(0);

  const selected = products.find(p => p.id === selectedId);

  const sim = useMemo(() => {
    if (!selected) return null;
    return simulateWhatIf(selected.input, selected.result, {
      priceAdjust,
      commissionAdjust,
      shippingAdjust,
      taxAdjust
    });
  }, [selected, priceAdjust, commissionAdjust, shippingAdjust, taxAdjust]);

  const reset = () => {
    setPriceAdjust(0);
    setCommissionAdjust(0);
    setShippingAdjust(0);
    setTaxAdjust(0);
  };

  if (products.length === 0) {
    return (
      <div className="border border-rule p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
          Salve produtos na calculadora para usar o simulador.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Controls */}
      <div className="border border-rule bg-crt-2 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-hazard flex items-center gap-2">
            <SlidersHorizontal className="h-3 w-3" />
            [SIM] Simulador &ldquo;E se?&rdquo;
          </div>
          <button
            onClick={reset}
            className="text-[10px] uppercase tracking-[0.16em] text-faint border border-rule px-2 py-1 hover:text-muted hover:border-muted transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted mb-3">
          Produto
        </div>
        <select
          className="w-full h-9 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors mb-5"
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); reset(); }}
        >
          <option value="">Selecione um produto salvo</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.marketplace}
            </option>
          ))}
        </select>

        {selected && (
          <div className="grid gap-5">
            <CrtSlider label="Ajuste de preço" unit="%" value={priceAdjust} min={-50} max={50} step={1} onChange={setPriceAdjust} />
            <CrtSlider label="Ajuste de comissão" unit="pp" value={commissionAdjust} min={-10} max={10} step={0.5} onChange={setCommissionAdjust} />
            <CrtSlider label="Ajuste de frete" unit="R$" value={shippingAdjust} min={-20} max={20} step={0.5} onChange={setShippingAdjust} />
            <CrtSlider label="Ajuste de imposto" unit="pp" value={taxAdjust} min={-10} max={10} step={0.5} onChange={setTaxAdjust} />
          </div>
        )}
      </div>

      {/* Results */}
      {sim && selected ? (
        <div className="border border-rule">
          <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
            Resultado da simulação
          </div>

          <div className="grid grid-cols-2 gap-px bg-rule">
            {/* Original */}
            <div className="bg-crt p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-faint mb-3">Original</div>
              <div className="grid gap-3">
                <div>
                  <div className="text-[9px] uppercase text-faint mb-0.5">Preço</div>
                  <div className="font-display text-[18px] text-phos">{fmt(selected.input.sellingPrice)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-faint mb-0.5">Lucro</div>
                  <div className={`font-display text-[18px] ${sim.originalProfit >= 0 ? "text-signal" : "text-hazard"}`}>
                    {fmt(sim.originalProfit)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-faint mb-0.5">Margem</div>
                  <div className={`font-display text-[18px] ${sim.originalMargin >= 0 ? "text-phos" : "text-hazard"}`}>
                    {sim.originalMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated */}
            <div className="bg-crt p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-hazard mb-3">Simulado</div>
              <div className="grid gap-3">
                <div>
                  <div className="text-[9px] uppercase text-faint mb-0.5">Preço</div>
                  <div className="font-display text-[18px] text-phos">{fmt(sim.newPrice)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-faint mb-0.5">Lucro</div>
                  <div className={`font-display text-[18px] ${sim.netProfit >= 0 ? "text-signal" : "text-hazard"}`}>
                    {fmt(sim.netProfit)}
                    <span className={`text-[11px] ml-2 ${sim.profitDiff >= 0 ? "text-signal" : "text-hazard"}`}>
                      {sim.profitDiff >= 0 ? "▲" : "▼"} {fmt(Math.abs(sim.profitDiff))}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-faint mb-0.5">Margem</div>
                  <div className={`font-display text-[18px] ${sim.profitMargin >= 0 ? "text-phos" : "text-hazard"}`}>
                    {sim.profitMargin.toFixed(1)}%
                    <span className={`text-[11px] ml-2 ${sim.marginDiff >= 0 ? "text-signal" : "text-hazard"}`}>
                      {sim.marginDiff >= 0 ? "▲" : "▼"} {Math.abs(sim.marginDiff).toFixed(1)}pp
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-rule p-8 flex items-center justify-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
            Selecione um produto para simular.
          </p>
        </div>
      )}
    </div>
  );
}
