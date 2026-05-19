"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FlaskConical, Save, Trash2 } from "lucide-react";
import {
  calculateCosts,
  calculatePriceFromMargin,
  calculatePriceFromFixedProfit
} from "@/lib/calculator/engine";
import { MARKETPLACE_PRESETS, getPreset, getShopeePreset } from "@/lib/calculator/marketplace-configs";
import type { CalcMode, CalculatorInput, SavedProduct } from "@/lib/calculator/types";
import { CostBreakdown } from "./CostBreakdown";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DEFAULT_INPUT: CalculatorInput = {
  name: "",
  sku: "",
  marketplace: "ml-classico",
  productCost: 0,
  sellingPrice: 0,
  commissionPercentage: 11,
  fixedFee: 0,
  taxPercentage: 0,
  shippingCost: 0,
  packagingCost: 0,
  storageCost: 0,
  collectionCost: 0,
  operationalCost: 0,
  promotionCredit: 0,
  affiliateCommissionPercentage: 0,
  tacosPercentage: 0,
  desiredProfitMargin: 20,
  desiredProfitAmount: 0
};

// ─── Field component ──────────────────────────────────────────────────────────
function Field({
  label,
  suffix,
  value,
  onChange,
  note
}: {
  label: string;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
  note?: string;
}) {
  return (
    <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
      {label}
      <div className="relative">
        <input
          type="number"
          min={0}
          step={0.01}
          value={value || ""}
          onChange={e => onChange(Number(e.target.value))}
          placeholder="0"
          className="h-8 w-full bg-crt border border-rule px-3 pr-8 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors"
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-faint pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {note && <span className="text-[10px] text-faint normal-case tracking-normal">{note}</span>}
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  savedProducts: SavedProduct[];
  onSave: (product: SavedProduct) => void;
  onDelete: (id: string) => void;
  organizationId: string | null;
}

export function CostCalculatorForm({ savedProducts, onSave, onDelete, organizationId }: Props) {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [mode, setMode] = useState<CalcMode>("price");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try { return createBrowserSupabaseClient(); } catch { return null; }
  }, []);

  // Apply marketplace preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = getPreset(presetId);
    setInput(prev => ({
      ...prev,
      marketplace: presetId,
      commissionPercentage: preset.commissionPercentage,
      fixedFee: preset.fixedFee
    }));
  }, []);

  // Auto adjust Shopee preset when price changes
  useEffect(() => {
    if (input.marketplace.startsWith("shopee")) {
      const shopeePreset = getShopeePreset(input.sellingPrice);
      if (shopeePreset.id !== input.marketplace) {
        setInput(prev => ({
          ...prev,
          marketplace: shopeePreset.id,
          commissionPercentage: shopeePreset.commissionPercentage,
          fixedFee: shopeePreset.fixedFee
        }));
      }
    }
  }, [input.sellingPrice, input.marketplace]);

  // Compute effective input based on mode
  const effectiveInput = useMemo((): CalculatorInput => {
    if (mode === "margin" && (input.desiredProfitMargin ?? 0) > 0) {
      const price = calculatePriceFromMargin(input, input.desiredProfitMargin ?? 0);
      return { ...input, sellingPrice: Math.round(price * 100) / 100 };
    }
    if (mode === "profit" && (input.desiredProfitAmount ?? 0) > 0) {
      const price = calculatePriceFromFixedProfit(input, input.desiredProfitAmount ?? 0);
      return { ...input, sellingPrice: Math.round(price * 100) / 100 };
    }
    return input;
  }, [input, mode]);

  const result = useMemo(
    () => (effectiveInput.sellingPrice > 0 && effectiveInput.productCost > 0)
      ? calculateCosts(effectiveInput)
      : null,
    [effectiveInput]
  );

  const set = (field: keyof CalculatorInput) => (value: number | string) =>
    setInput(prev => ({ ...prev, [field]: value }));

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!result || !input.name.trim()) {
      setMessage("Preencha o nome do produto e os custos antes de salvar.");
      return;
    }

    const product: SavedProduct = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      sku: input.sku.trim() || input.name.trim(),
      marketplace: MARKETPLACE_PRESETS.find(p => p.id === input.marketplace)?.name ?? input.marketplace,
      input: effectiveInput,
      result,
      savedAt: new Date().toISOString()
    };

    setIsSaving(true);
    setMessage(null);

    try {
      if (supabase && organizationId) {
        // Persist to Supabase
        const { data: productData, error: productError } = await supabase
          .from("products")
          .upsert({
            organization_id: organizationId,
            internal_sku: product.sku,
            title: product.name
          }, { onConflict: "organization_id,internal_sku" })
          .select("id")
          .single();

        if (productError) throw productError;

        const productId = (productData as { id: string }).id;

        // Write cost components
        const costRows = [
          { cost_name: "Custo produto",      cost_category: "product",           amount: result.productCost,        allocation_method: "per_unit" },
          { cost_name: "Embalagem",          cost_category: "packaging",         amount: result.packagingCost,      allocation_method: "per_unit" },
          { cost_name: "Frete",              cost_category: "inbound_freight",   amount: result.shippingCost,       allocation_method: "per_unit" },
          { cost_name: "Coleta Full",        cost_category: "marketplace_fixed", amount: result.collectionCost,     allocation_method: "per_unit" },
          { cost_name: "Armazenagem",        cost_category: "marketplace_fixed", amount: result.storageCost,        allocation_method: "per_unit" },
          { cost_name: "Custo operacional",  cost_category: "other",             amount: result.operationalCost,    allocation_method: "per_unit" },
        ].filter(r => r.amount > 0);

        if (costRows.length > 0) {
          await supabase.from("sku_costs").insert(
            costRows.map(r => ({
              organization_id: organizationId,
              product_id: productId,
              valid_from: new Date().toISOString().slice(0, 10),
              currency: "BRL",
              ...r
            }))
          );
        }

        setMessage("Produto salvo no Supabase.");
      } else {
        setMessage("Salvo localmente (entre para persistir no banco).");
      }

      onSave(product);
      setInput(prev => ({ ...prev, name: "", sku: "" }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      {/* Calculator + Breakdown */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        {/* Form */}
        <form onSubmit={handleSave} className="border border-rule bg-crt-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-hazard flex items-center gap-2">
              <FlaskConical className="h-3 w-3" />
              [CALC] Calculadora de custo e margem
            </div>

            {/* Calc mode */}
            <div className="flex border border-rule">
              {([["price", "Por preço"], ["margin", "Por margem"], ["profit", "Por lucro"]] as [CalcMode, string][]).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`h-7 px-3 text-[10px] uppercase tracking-[0.14em] border-r border-rule last:border-r-0 transition-colors ${
                    mode === m ? "bg-phos text-crt font-semibold" : "text-faint hover:text-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {/* Identification */}
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Nome do produto
                <input
                  type="text"
                  value={input.name}
                  onChange={e => set("name")(e.target.value)}
                  placeholder="Ex: Cabo USB-C 1m"
                  className="h-8 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors"
                />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                SKU interno
                <input
                  type="text"
                  value={input.sku}
                  onChange={e => set("sku")(e.target.value)}
                  placeholder="Ex: MLB-CABO-USB-1M"
                  className="h-8 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors"
                />
              </label>
            </div>

            {/* Marketplace preset */}
            <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
              Marketplace / Preset
              <select
                value={input.marketplace}
                onChange={e => applyPreset(e.target.value)}
                className="h-8 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors"
              >
                {MARKETPLACE_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.note ? ` — ${p.note}` : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* Price / mode target */}
            <div className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
              {mode === "price" && (
                <Field label="Preço de venda" suffix="R$" value={input.sellingPrice} onChange={v => set("sellingPrice")(v)} />
              )}
              {mode === "margin" && (
                <>
                  <Field label="Margem desejada" suffix="%" value={input.desiredProfitMargin ?? 0} onChange={v => set("desiredProfitMargin")(v)} note="Preço calculado automaticamente" />
                  <div className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                    Preço calculado
                    <div className="h-8 bg-rule/40 border border-rule px-3 flex items-center text-phos text-[12px] normal-case tracking-normal">
                      {effectiveInput.sellingPrice > 0 ? fmt(effectiveInput.sellingPrice) : "—"}
                    </div>
                  </div>
                </>
              )}
              {mode === "profit" && (
                <>
                  <Field label="Lucro desejado" suffix="R$" value={input.desiredProfitAmount ?? 0} onChange={v => set("desiredProfitAmount")(v)} note="Preço calculado automaticamente" />
                  <div className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                    Preço calculado
                    <div className="h-8 bg-rule/40 border border-rule px-3 flex items-center text-phos text-[12px] normal-case tracking-normal">
                      {effectiveInput.sellingPrice > 0 ? fmt(effectiveInput.sellingPrice) : "—"}
                    </div>
                  </div>
                </>
              )}
              <Field label="Custo do produto" suffix="R$" value={input.productCost} onChange={v => set("productCost")(v)} />
            </div>

            {/* Marketplace fees */}
            <div className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
              <Field label="Comissão marketplace" suffix="%" value={input.commissionPercentage} onChange={v => set("commissionPercentage")(v)} />
              <Field label="Taxa fixa" suffix="R$" value={input.fixedFee} onChange={v => set("fixedFee")(v)} />
              <Field label="Impostos" suffix="%" value={input.taxPercentage} onChange={v => set("taxPercentage")(v)} />
              <Field label="Comissão afiliado" suffix="%" value={input.affiliateCommissionPercentage} onChange={v => set("affiliateCommissionPercentage")(v)} />
            </div>

            {/* Logistics */}
            <div className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
              <Field label="Frete" suffix="R$" value={input.shippingCost} onChange={v => set("shippingCost")(v)} />
              <Field label="Embalagem" suffix="R$" value={input.packagingCost} onChange={v => set("packagingCost")(v)} />
              <Field label="Coleta (Full)" suffix="R$" value={input.collectionCost} onChange={v => set("collectionCost")(v)} />
              <Field label="Armazenagem" suffix="R$" value={input.storageCost} onChange={v => set("storageCost")(v)} />
            </div>

            {/* Other costs */}
            <div className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
              <Field label="Custo operacional" suffix="R$" value={input.operationalCost} onChange={v => set("operationalCost")(v)} />
              <Field label="TACOS (ads)" suffix="%" value={input.tacosPercentage} onChange={v => set("tacosPercentage")(v)} />
              <Field label="Crédito promoção" suffix="R$" value={input.promotionCredit} onChange={v => set("promotionCredit")(v)} />
            </div>

            {/* Save */}
            <div className="border-t border-rule pt-4 flex items-center justify-between gap-4">
              {message && (
                <span className="text-[11px] text-faint flex-1 truncate">{message}</span>
              )}
              <button
                type="submit"
                disabled={isSaving || !result}
                className="flex items-center gap-2 h-9 px-5 bg-phos text-crt text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-phos/90 transition-colors disabled:opacity-40 ml-auto"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Salvando..." : "Salvar produto"}
              </button>
            </div>
          </div>
        </form>

        {/* Breakdown */}
        <CostBreakdown result={result} />
      </div>

      {/* Saved products */}
      {savedProducts.length > 0 && (
        <div className="border border-rule">
          <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
            Produtos salvos — {savedProducts.length}
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-phos text-crt">
                {["Produto", "SKU", "Marketplace", "Preço", "Custo", "Lucro", "Margem", ""].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {savedProducts.map((p, i) => (
                <tr key={p.id} className={`border-t border-rule hover:bg-rule/20 ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                  <td className="px-4 py-2.5 font-semibold text-phos">{p.name}</td>
                  <td className="px-4 py-2.5 text-faint text-[11px]">{p.sku}</td>
                  <td className="px-4 py-2.5 text-muted">{p.marketplace}</td>
                  <td className="px-4 py-2.5">{fmt(p.input.sellingPrice)}</td>
                  <td className="px-4 py-2.5 text-muted">{fmt(p.result.productCost)}</td>
                  <td className={`px-4 py-2.5 font-bold ${p.result.netProfit >= 0 ? "text-signal" : "text-hazard"}`}>
                    {fmt(p.result.netProfit)}
                  </td>
                  <td className={`px-4 py-2.5 font-bold ${p.result.profitMargin >= 15 ? "text-signal" : p.result.profitMargin >= 0 ? "text-amber-400" : "text-hazard"}`}>
                    {p.result.profitMargin.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onDelete(p.id)}
                      className="text-faint hover:text-hazard transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
