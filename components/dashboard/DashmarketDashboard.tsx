"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, PackagePlus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import {
  calculateContributionMargins,
  type AdvertisingSpend,
  type ContributionMarginRow,
  type SaleRecord,
  type SkuCost
} from "@/lib/metrics/contribution-margin";
import { getMarketplaceAdapter, listMarketplaceAdapters } from "@/lib/marketplaces/registry";
import type { MarketplaceProvider } from "@/lib/marketplaces/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewKey = "margem" | "custos" | "estoque" | "ads";
type SupabaseStatus = "checking" | "demo" | "connected" | "error";

type Organization = { id: string; name: string; slug: string };
type ProductRow = { id: string; internal_sku: string; title: string };
type CostCenterRow = {
  id: string;
  cost_name: string;
  cost_category: SkuCost["category"];
  allocation_method: SkuCost["allocation"];
  amount: number | string;
  valid_from: string;
  valid_to: string | null;
  products: ProductRow | ProductRow[] | null;
};

// ─── Seed data ───────────────────────────────────────────────────────────────
const salesSeed: SaleRecord[] = [
  {
    sku: "MLB-CABO-USB-C-1M",
    title: "Cabo USB-C turbo 1m",
    units: 184,
    orders: 129,
    grossRevenue: 10120,
    marketplaceFees: 1540,
    shippingCosts: 680,
    discounts: 320,
    taxes: 0
  },
  {
    sku: "MLB-CAPA-AIR-13",
    title: "Capa notebook Air 13",
    units: 76,
    orders: 61,
    grossRevenue: 11856,
    marketplaceFees: 1864,
    shippingCosts: 510,
    discounts: 420,
    taxes: 0
  },
  {
    sku: "MLB-SUPORTE-MESA-PRO",
    title: "Suporte articulado de mesa",
    units: 43,
    orders: 39,
    grossRevenue: 16770,
    marketplaceFees: 2732,
    shippingCosts: 940,
    discounts: 680,
    taxes: 0
  },
  {
    sku: "MLB-FONE-BT-COMPACT",
    title: "Fone bluetooth compacto",
    units: 112,
    orders: 97,
    grossRevenue: 14224,
    marketplaceFees: 2218,
    shippingCosts: 795,
    discounts: 530,
    taxes: 0
  }
];

const costsSeed: SkuCost[] = [
  { id: "cost-1", sku: "MLB-CABO-USB-C-1M", label: "Fornecedor", category: "product", amount: 18.9, allocation: "per_unit", validFrom: "2026-05-01" },
  { id: "cost-2", sku: "MLB-CABO-USB-C-1M", label: "Embalagem", category: "packaging", amount: 1.25, allocation: "per_unit", validFrom: "2026-05-01" },
  { id: "cost-3", sku: "MLB-CAPA-AIR-13", label: "Fornecedor", category: "product", amount: 72.4, allocation: "per_unit", validFrom: "2026-05-01" },
  { id: "cost-4", sku: "MLB-SUPORTE-MESA-PRO", label: "Fornecedor", category: "product", amount: 184, allocation: "per_unit", validFrom: "2026-05-01" },
  { id: "cost-5", sku: "MLB-FONE-BT-COMPACT", label: "Fornecedor", category: "product", amount: 48.7, allocation: "per_unit", validFrom: "2026-05-01" }
];

const adSpendSeed: AdvertisingSpend[] = [
  { sku: "MLB-CABO-USB-C-1M", amount: 870, clicks: 2480, impressions: 81400, attributedRevenue: 4480 },
  { sku: "MLB-CAPA-AIR-13", amount: 420, clicks: 1114, impressions: 35600, attributedRevenue: 2910 },
  { sku: "MLB-SUPORTE-MESA-PRO", amount: 980, clicks: 1560, impressions: 42200, attributedRevenue: 6200 },
  { sku: "MLB-FONE-BT-COMPACT", amount: 740, clicks: 2030, impressions: 61500, attributedRevenue: 3890 }
];

const inventoryRows = [
  { sku: "MLB-CABO-USB-C-1M", channel: "Full", available: 420, reserved: 36, transfer: 280, status: "Saudavel" },
  { sku: "MLB-CAPA-AIR-13", channel: "Full", available: 96, reserved: 12, transfer: 40, status: "Atencao" },
  { sku: "MLB-SUPORTE-MESA-PRO", channel: "Full", available: 31, reserved: 8, transfer: 20, status: "Critico" },
  { sku: "MLB-FONE-BT-COMPACT", channel: "Flex", available: 188, reserved: 19, transfer: 0, status: "Saudavel" }
];

const promotionRows = [
  { sku: "MLB-CABO-USB-C-1M", name: "Oferta relampago", discount: "8%", period: "12 a 14 mai", impact: "Boa margem" },
  { sku: "MLB-SUPORTE-MESA-PRO", name: "Campanha marketplace", discount: "R$ 24,00", period: "10 a 18 mai", impact: "Revisar custo" }
];

// ─── Labels ───────────────────────────────────────────────────────────────────
const costCategoryLabel: Record<SkuCost["category"], string> = {
  product: "Produto",
  packaging: "Embalagem",
  inbound_freight: "Frete entrada",
  tax: "Tributo",
  marketplace_fixed: "Taxa fixa",
  other: "Outro"
};

const allocationLabel: Record<SkuCost["allocation"], string> = {
  per_unit: "Por unidade",
  percentage: "Percentual",
  per_order: "Por pedido"
};

const views: Array<{ key: ViewKey; label: string; code: string }> = [
  { key: "margem", label: "Margem contrib.", code: "MCB" },
  { key: "custos", label: "Centro de custos", code: "CCT" },
  { key: "estoque", label: "Estoque Full", code: "EST" },
  { key: "ads", label: "Publicidade", code: "ADS" }
];

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatNumber = new Intl.NumberFormat("pt-BR");

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

// ─── Tone helpers ─────────────────────────────────────────────────────────────
function marginTone(row: ContributionMarginRow) {
  if (row.contributionMarginRate < 0.12) return "text-hazard";
  if (row.contributionMarginRate < 0.22) return "text-amber-400";
  return "text-signal";
}

function stockColor(status: string) {
  if (status === "Critico") return "text-hazard";
  if (status === "Atencao") return "text-amber-400";
  return "text-signal";
}

// ─── Cost row helpers ─────────────────────────────────────────────────────────
function getRelatedProduct(row: CostCenterRow) {
  if (Array.isArray(row.products)) return row.products[0] ?? null;
  return row.products;
}

function mapCostCenterRow(row: CostCenterRow): SkuCost | null {
  const product = getRelatedProduct(row);
  if (!product) return null;
  return {
    id: row.id,
    sku: product.internal_sku,
    label: row.cost_name,
    category: row.cost_category,
    amount: Number(row.amount),
    allocation: row.allocation_method,
    validFrom: row.valid_from,
    validTo: row.valid_to ?? undefined
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TelemetryCell({
  label,
  value,
  delta,
  alert = false
}: {
  label: string;
  value: string;
  delta: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between p-5 ${
        alert ? "bg-hazard/[0.08]" : "bg-crt"
      }`}
    >
      <span
        className={`text-[10px] uppercase tracking-[0.22em] ${
          alert ? "text-hazard" : "text-faint"
        }`}
      >
        {label}
      </span>
      <div>
        <div
          className={`font-display text-[28px] leading-none tracking-tight ${
            alert ? "text-hazard" : "text-phos"
          }`}
        >
          {value}
        </div>
        <div
          className={`text-[11px] mt-1.5 tracking-wide ${
            alert ? "text-hazard" : "text-muted"
          }`}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-phos text-crt">
        {cols.map((col) => (
          <th
            key={col}
            className="px-4 py-2.5 text-left text-[10.5px] uppercase tracking-[0.16em] font-semibold whitespace-nowrap"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashmarketDashboard() {
  const [supabaseClient] = useState(() => {
    try { return createBrowserSupabaseClient(); } catch { return null; }
  });

  const [selectedProvider, setSelectedProvider] = useState<MarketplaceProvider>("mercadolivre");
  const [activeView, setActiveView] = useState<ViewKey>("margem");
  const [skuFilter, setSkuFilter] = useState("");
  const [costs, setCosts] = useState<SkuCost[]>(costsSeed);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>("checking");
  const [realProducts, setRealProducts] = useState<ProductRow[]>([]);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [costForm, setCostForm] = useState({
    sku: salesSeed[0].sku,
    label: "",
    category: "product" as SkuCost["category"],
    amount: "",
    allocation: "per_unit" as SkuCost["allocation"],
    validFrom: "2026-05-01"
  });

  const selectedAdapter = getMarketplaceAdapter(selectedProvider);

  const productOptions = useMemo(
    () =>
      realProducts.length > 0
        ? realProducts.map((p) => ({ sku: p.internal_sku, title: p.title }))
        : salesSeed.map((s) => ({ sku: s.sku, title: s.title })),
    [realProducts]
  );

  const marginRows = useMemo(
    () => calculateContributionMargins(salesSeed, costs, adSpendSeed),
    [costs]
  );

  const filteredMargins = marginRows.filter((row) => {
    const q = skuFilter.trim().toLowerCase();
    return !q || row.sku.toLowerCase().includes(q) || row.title.toLowerCase().includes(q);
  });

  const totals = marginRows.reduce(
    (acc, row) => ({
      grossRevenue: acc.grossRevenue + row.grossRevenue,
      netRevenue: acc.netRevenue + row.netRevenue,
      marketplaceFees: acc.marketplaceFees + row.marketplaceFees,
      shippingCosts: acc.shippingCosts + row.shippingCosts,
      discounts: acc.discounts + row.discounts,
      skuCosts: acc.skuCosts + row.skuCosts,
      advertisingCosts: acc.advertisingCosts + row.advertisingCosts,
      contributionMargin: acc.contributionMargin + row.contributionMargin,
      units: acc.units + row.units
    }),
    {
      grossRevenue: 0, netRevenue: 0, marketplaceFees: 0, shippingCosts: 0,
      discounts: 0, skuCosts: 0, advertisingCosts: 0, contributionMargin: 0, units: 0
    }
  );

  const marginRate = totals.netRevenue > 0 ? totals.contributionMargin / totals.netRevenue : 0;

  const loadCostCenter = useCallback(async (organizationId: string) => {
    if (!supabaseClient) return;

    const { data: productsData, error: productsError } = await supabaseClient
      .from("products")
      .select("id, internal_sku, title")
      .eq("organization_id", organizationId)
      .order("internal_sku", { ascending: true });

    if (productsError) throw productsError;
    setRealProducts((productsData ?? []) as ProductRow[]);

    const { data: costsData, error: costsError } = await supabaseClient
      .from("sku_costs")
      .select("id, cost_name, cost_category, allocation_method, amount, valid_from, valid_to, products(id, internal_sku, title)")
      .eq("organization_id", organizationId)
      .order("valid_from", { ascending: false });

    if (costsError) throw costsError;
    setCosts(
      ((costsData ?? []) as CostCenterRow[])
        .map(mapCostCenterRow)
        .filter((c): c is SkuCost => Boolean(c))
    );
  }, [supabaseClient]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      if (!supabaseClient) {
        setSupabaseStatus("demo");
        setCosts(costsSeed);
        return;
      }
      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;

        const session = sessionData.session;
        if (!session) {
          if (!isMounted) return;
          setSupabaseStatus("demo");
          setUserEmail(null);
          setOrganization(null);
          setRealProducts([]);
          setCosts(costsSeed);
          return;
        }

        const { data: orgsData, error: orgsError } = await supabaseClient
          .from("organizations")
          .select("id, name, slug")
          .order("created_at", { ascending: true })
          .limit(1);

        if (orgsError) throw orgsError;

        const org = ((orgsData ?? [])[0] as Organization | undefined) ?? null;
        if (!isMounted) return;

        setUserEmail(session.user.email ?? null);
        setOrganization(org);
        setSupabaseStatus("connected");

        if (org) {
          await loadCostCenter(org.id);
        } else {
          setCosts([]);
          setDataMessage("Autenticado, mas sem empresa vinculada.");
        }
      } catch (error) {
        if (!isMounted) return;
        setSupabaseStatus("error");
        setCosts(costsSeed);
        setDataMessage(error instanceof Error ? error.message : "Nao foi possivel conectar ao Supabase.");
      }
    }

    loadWorkspace();
    return () => { isMounted = false; };
  }, [loadCostCenter, supabaseClient]);

  async function addCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!costForm.label.trim() || !costForm.amount) return;

    if (supabaseClient && organization) {
      setIsSavingCost(true);
      setDataMessage(null);
      try {
        let product = realProducts.find((p) => p.internal_sku === costForm.sku);

        if (!product) {
          const seedProduct = salesSeed.find((s) => s.sku === costForm.sku);
          const { data: insertedProduct, error: productError } = await supabaseClient
            .from("products")
            .insert({ organization_id: organization.id, internal_sku: costForm.sku, title: seedProduct?.title ?? costForm.sku })
            .select("id, internal_sku, title")
            .single();
          if (productError) throw productError;
          product = insertedProduct as ProductRow;
        }

        const { error: costError } = await supabaseClient.from("sku_costs").insert({
          organization_id: organization.id,
          product_id: product.id,
          cost_name: costForm.label.trim(),
          cost_category: costForm.category,
          allocation_method: costForm.allocation,
          amount: Number(costForm.amount),
          valid_from: costForm.validFrom
        });

        if (costError) throw costError;
        await loadCostCenter(organization.id);
        setCostForm((c) => ({ ...c, label: "", amount: "" }));
        setDataMessage("Custo salvo no Supabase.");
      } catch (error) {
        setDataMessage(error instanceof Error ? error.message : "Nao foi possivel salvar.");
      } finally {
        setIsSavingCost(false);
      }
      return;
    }

    setCosts((current) => [
      ...current,
      {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `cost-${Date.now()}`,
        sku: costForm.sku,
        label: costForm.label.trim(),
        category: costForm.category,
        amount: Number(costForm.amount),
        allocation: costForm.allocation,
        validFrom: costForm.validFrom
      }
    ]);
    setCostForm((c) => ({ ...c, label: "", amount: "" }));
  }

  async function signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    setSupabaseStatus("demo");
    setUserEmail(null);
    setOrganization(null);
    setRealProducts([]);
    setCosts(costsSeed);
    setDataMessage("Sessao encerrada.");
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  return (
    <main className="min-h-screen bg-crt text-phos font-mono flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-56 flex-none border-r border-rule bg-crt-2 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-rule">
          <div className="font-display text-[26px] leading-none uppercase tracking-tight">
            DM<span className="text-hazard animate-blink">▌</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-faint mt-2">
            Dashmarket-Pro
          </div>
          <div className="text-[9px] text-faint mt-0.5">
            v2026.05 // {selectedAdapter.displayName}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 flex flex-col">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`w-full text-left px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] flex items-center gap-3 border-l-2 transition-colors ${
                activeView === view.key
                  ? "border-hazard text-phos bg-rule/40"
                  : "border-transparent text-faint hover:text-muted hover:bg-rule/20"
              }`}
            >
              <span className="font-display text-[10px] text-hazard w-8 flex-none">{view.code}</span>
              {view.label}
            </button>
          ))}
        </nav>

        {/* Marketplace selector */}
        <div className="px-5 py-4 border-t border-rule">
          <div className="text-[9px] uppercase tracking-[0.22em] text-hazard mb-2">Conector</div>
          {listMarketplaceAdapters().slice(0, 3).map((adapter) => (
            <button
              key={adapter.provider}
              type="button"
              onClick={() => setSelectedProvider(adapter.provider)}
              className={`w-full text-left text-[11px] py-1 transition-colors ${
                selectedProvider === adapter.provider
                  ? "text-phos"
                  : "text-faint hover:text-muted"
              }`}
            >
              {selectedProvider === adapter.provider ? "▶ " : "  "}
              {adapter.displayName}
            </button>
          ))}
        </div>

        {/* Status + Auth */}
        <div className="px-5 py-4 border-t border-rule">
          <div className="text-[9px] uppercase tracking-[0.22em] text-hazard mb-2">Status</div>
          <div className="flex items-center gap-2 text-[11px]">
            {supabaseStatus === "connected" && (
              <span
                className="w-2 h-2 bg-signal inline-block flex-none animate-live"
                style={{ boxShadow: "0 0 8px rgba(74,246,38,0.55)" }}
              />
            )}
            <span className={supabaseStatus === "connected" ? "text-signal" : "text-muted"}>
              {supabaseStatus === "connected"
                ? (organization?.name ?? "Conectado")
                : supabaseStatus === "checking"
                ? "Verificando..."
                : "Modo demo"}
            </span>
          </div>
          {userEmail && (
            <div className="mt-1 text-[10px] text-faint truncate">{userEmail}</div>
          )}

          <div className="mt-3">
            {supabaseStatus === "connected" ? (
              <button
                type="button"
                onClick={signOut}
                className="w-full h-8 flex items-center justify-center gap-2 border border-rule text-[10px] uppercase tracking-[0.18em] text-muted hover:border-hazard hover:text-hazard transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Sair
              </button>
            ) : (
              <Link
                href="/login"
                className="w-full h-8 flex items-center justify-center gap-2 border border-rule text-[10px] uppercase tracking-[0.18em] text-muted hover:border-signal hover:text-signal transition-colors"
              >
                <ShieldCheck className="h-3 w-3" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-10 border-b border-rule bg-crt-2 flex items-center px-6 gap-5 text-[10.5px] uppercase tracking-[0.16em] text-muted flex-shrink-0">
          <span className="text-phos font-semibold">
            DM-PRO <span className="text-faint">·</span> Visao operacional
          </span>
          <span className="text-faint">{today}</span>
          <span className={supabaseStatus === "connected" ? "text-signal" : "text-faint"}>
            ⬤ {supabaseStatus === "connected" ? "Live" : "Demo"}
          </span>
          <span className="ml-auto flex items-center gap-4">
            {dataMessage && (
              <span className="text-hazard text-[10px] truncate max-w-xs">{dataMessage}</span>
            )}
            <button
              type="button"
              className="flex items-center gap-1.5 text-muted hover:text-signal transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Sincronizar
            </button>
          </span>
        </header>

        {/* Telemetry grid */}
        <section className="grid grid-cols-4 gap-px bg-rule border-b border-rule flex-shrink-0">
          <TelemetryCell
            label="Receita liquida"
            value={formatCurrency.format(totals.netRevenue)}
            delta={`${formatNumber.format(totals.units)} unidades no periodo`}
          />
          <TelemetryCell
            label="Margem contribuicao"
            value={formatCurrency.format(totals.contributionMargin)}
            delta={`${formatPercent(marginRate)} da receita liquida`}
            alert={marginRate < 0.12}
          />
          <TelemetryCell
            label="Custos cadastrados"
            value={formatCurrency.format(totals.skuCosts)}
            delta="Produto, embalagem e frete"
          />
          <TelemetryCell
            label="Publicidade"
            value={formatCurrency.format(totals.advertisingCosts)}
            delta="Investimento atribuido aos SKUs"
          />
        </section>

        {/* View tabs + search */}
        <section className="border-b border-rule bg-crt-2 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center border border-rule">
            {views.map((view) => (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                className={`h-8 px-4 text-[10.5px] uppercase tracking-[0.16em] transition-colors border-r border-rule last:border-r-0 ${
                  activeView === view.key
                    ? "bg-phos text-crt font-semibold"
                    : "text-faint hover:text-muted"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-faint pointer-events-none" />
            <input
              className="h-8 w-60 bg-crt border border-rule pl-8 pr-3 text-[11px] uppercase tracking-wide text-phos placeholder:text-faint outline-none focus:border-hazard transition-colors"
              placeholder="Buscar SKU ou produto"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
            />
          </div>
        </section>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">

          {/* ── MARGEM VIEW ── */}
          {activeView === "margem" && (
            <div className="border border-rule">
              <div className="bg-crt-2 px-4 py-3 border-b border-rule flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">
                    [MCB] Conciliacao de margem
                  </div>
                  <div className="text-[12px] text-muted mt-0.5">
                    Receita, taxas ML, frete, custos internos e publicidade por SKU
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-signal border border-rule px-3 py-1">
                  {filteredMargins.length} SKUs
                </span>
              </div>
              <div className="table-scroll overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-[12.5px] letter-spacing-wide">
                  <THead cols={["SKU / Produto", "Rec. Liquida", "Taxas ML", "Frete", "Custo SKU", "Ads", "Margem R$", "Margem %"]} />
                  <tbody>
                    {filteredMargins.map((row, i) => (
                      <tr
                        key={row.sku}
                        className={`border-t border-rule hover:bg-rule/30 transition-colors ${
                          i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-phos">{row.sku}</div>
                          <div className="text-[11px] text-faint mt-0.5">{row.title}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency.format(row.netRevenue)}</td>
                        <td className="px-4 py-3 text-muted">{formatCurrency.format(row.marketplaceFees)}</td>
                        <td className="px-4 py-3 text-muted">{formatCurrency.format(row.shippingCosts)}</td>
                        <td className="px-4 py-3 text-muted">{formatCurrency.format(row.skuCosts)}</td>
                        <td className="px-4 py-3 text-muted">{formatCurrency.format(row.advertisingCosts)}</td>
                        <td className={`px-4 py-3 font-bold ${marginTone(row)}`}>
                          {formatCurrency.format(row.contributionMargin)}
                        </td>
                        <td className={`px-4 py-3 font-bold ${marginTone(row)}`}>
                          {formatPercent(row.contributionMarginRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CUSTOS VIEW ── */}
          {activeView === "custos" && (
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              {/* Form */}
              <form
                className="border border-rule bg-crt-2 p-5"
                onSubmit={addCost}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-4">
                  [CCT] Cadastrar custo de SKU
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                    SKU
                    <select
                      className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors normal-case tracking-normal"
                      value={costForm.sku}
                      onChange={(e) => setCostForm((c) => ({ ...c, sku: e.target.value }))}
                    >
                      {productOptions.map((p) => (
                        <option key={p.sku} value={p.sku}>{p.sku}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-faint normal-case tracking-normal">
                      {supabaseStatus === "connected"
                        ? "SKU nao encontrado sera criado automaticamente."
                        : "Entre para salvar no banco."}
                    </span>
                  </label>

                  <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                    Nome do custo
                    <input
                      className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors normal-case tracking-normal"
                      placeholder="Fornecedor, embalagem, imposto..."
                      value={costForm.label}
                      onChange={(e) => setCostForm((c) => ({ ...c, label: e.target.value }))}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                      Categoria
                      <select
                        className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors normal-case tracking-normal"
                        value={costForm.category}
                        onChange={(e) => setCostForm((c) => ({ ...c, category: e.target.value as SkuCost["category"] }))}
                      >
                        {Object.entries(costCategoryLabel).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                      Alocacao
                      <select
                        className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors normal-case tracking-normal"
                        value={costForm.allocation}
                        onChange={(e) => setCostForm((c) => ({ ...c, allocation: e.target.value as SkuCost["allocation"] }))}
                      >
                        {Object.entries(allocationLabel).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                      Valor
                      <input
                        className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors normal-case tracking-normal"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={costForm.amount}
                        onChange={(e) => setCostForm((c) => ({ ...c, amount: e.target.value }))}
                      />
                    </label>
                    <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                      Vigencia
                      <input
                        className="h-9 bg-crt border border-rule px-3 text-phos text-[12px] outline-none focus:border-hazard transition-colors normal-case tracking-normal"
                        type="date"
                        value={costForm.validFrom}
                        onChange={(e) => setCostForm((c) => ({ ...c, validFrom: e.target.value }))}
                      />
                    </label>
                  </div>

                  <button
                    className="mt-1 h-10 flex items-center justify-center gap-2 bg-phos text-crt text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-phos/90 transition-colors disabled:opacity-50"
                    type="submit"
                    disabled={isSavingCost}
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    {isSavingCost ? "Salvando..." : "Adicionar custo"}
                  </button>
                </div>
              </form>

              {/* Cost table */}
              <div className="border border-rule">
                <div className="bg-crt-2 px-4 py-3 border-b border-rule">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[CCT] Custos ativos</div>
                  <div className="text-[12px] text-muted mt-0.5">
                    Cada lancamento entra no calculo de margem respeitando SKU e vigencia
                  </div>
                </div>
                <div className="table-scroll overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[12.5px]">
                    <THead cols={["SKU", "Custo", "Categoria", "Alocacao", "Valor", "Vigencia"]} />
                    <tbody>
                      {costs.map((cost, i) => (
                        <tr
                          key={cost.id}
                          className={`border-t border-rule hover:bg-rule/30 transition-colors ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}
                        >
                          <td className="px-4 py-3 font-semibold text-phos">{cost.sku}</td>
                          <td className="px-4 py-3">{cost.label}</td>
                          <td className="px-4 py-3 text-muted">{costCategoryLabel[cost.category]}</td>
                          <td className="px-4 py-3 text-muted">{allocationLabel[cost.allocation]}</td>
                          <td className="px-4 py-3 font-semibold">
                            {cost.allocation === "percentage"
                              ? `${cost.amount}%`
                              : formatCurrency.format(cost.amount)}
                          </td>
                          <td className="px-4 py-3 text-muted">{cost.validFrom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ESTOQUE VIEW ── */}
          {activeView === "estoque" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
              <div className="border border-rule">
                <div className="bg-crt-2 px-4 py-3 border-b border-rule">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[EST] Estoque por canal</div>
                  <div className="text-[12px] text-muted mt-0.5">Full e Flex — snapshots do Mercado Livre</div>
                </div>
                <div className="table-scroll overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-[12.5px]">
                    <THead cols={["SKU", "Canal", "Disponivel", "Reservado", "Em transferencia", "Status"]} />
                    <tbody>
                      {inventoryRows.map((row, i) => (
                        <tr
                          key={row.sku}
                          className={`border-t border-rule hover:bg-rule/30 transition-colors ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}
                        >
                          <td className="px-4 py-3 font-semibold text-phos">{row.sku}</td>
                          <td className="px-4 py-3 text-muted">{row.channel}</td>
                          <td className="px-4 py-3">{formatNumber.format(row.available)}</td>
                          <td className="px-4 py-3 text-muted">{formatNumber.format(row.reserved)}</td>
                          <td className="px-4 py-3 text-muted">{formatNumber.format(row.transfer)}</td>
                          <td className={`px-4 py-3 font-bold text-[11px] uppercase tracking-[0.1em] ${stockColor(row.status)}`}>
                            {row.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sync queue */}
              <div className="border border-rule bg-crt-2 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-4">Fila de sincronizacao</div>
                <div className="grid gap-0 border border-rule">
                  {["orders", "inventory", "listings", "promotions"].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between px-4 py-3 border-b border-rule last:border-b-0"
                    >
                      <span className="text-[11px] uppercase tracking-[0.1em] text-phos">{item}</span>
                      <span className="text-[10px] text-faint">
                        {index === 0 ? "15 min" : "1 h"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ADS VIEW ── */}
          {activeView === "ads" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
              <div className="border border-rule">
                <div className="bg-crt-2 px-4 py-3 border-b border-rule">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[ADS] Publicidade por SKU</div>
                  <div className="text-[12px] text-muted mt-0.5">Investimento e receita atribuida entram no calculo de margem</div>
                </div>
                <div className="table-scroll overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[12.5px]">
                    <THead cols={["SKU", "Investimento", "Cliques", "Impressoes", "Rec. atribuida", "ACOS"]} />
                    <tbody>
                      {adSpendSeed.map((row, i) => (
                        <tr
                          key={row.sku}
                          className={`border-t border-rule hover:bg-rule/30 transition-colors ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}
                        >
                          <td className="px-4 py-3 font-semibold text-phos">{row.sku}</td>
                          <td className="px-4 py-3">{formatCurrency.format(row.amount)}</td>
                          <td className="px-4 py-3 text-muted">{formatNumber.format(row.clicks)}</td>
                          <td className="px-4 py-3 text-muted">{formatNumber.format(row.impressions)}</td>
                          <td className="px-4 py-3">{formatCurrency.format(row.attributedRevenue)}</td>
                          <td className="px-4 py-3 font-bold text-amber-400">
                            {formatPercent(row.amount / row.attributedRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Promotions */}
              <div className="border border-rule bg-crt-2 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-4">Promocoes ativas</div>
                <div className="grid gap-0 border border-rule">
                  {promotionRows.map((row) => (
                    <div
                      key={`${row.sku}-${row.name}`}
                      className="px-4 py-4 border-b border-rule last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-semibold text-phos">{row.name}</div>
                          <div className="text-[11px] text-faint mt-0.5">{row.sku}</div>
                        </div>
                        <span className="border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-amber-400">
                          {row.discount}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-muted">{row.period}</span>
                        <span className="text-faint">{row.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <footer className="border-t border-rule bg-crt-2 px-6 py-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.16em] text-faint flex-shrink-0">
          <span>DM-PRO · v2026.05</span>
          <span>
            {supabaseStatus === "demo"
              ? "Modo demonstrativo · Conecte Supabase e Mercado Livre para dados reais"
              : `Supabase conectado · ${organization?.name ?? "sem empresa"}`}
          </span>
          <span>{filteredMargins.length} SKUs ativos</span>
        </footer>
      </div>
    </main>
  );
}
