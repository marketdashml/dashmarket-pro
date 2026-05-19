"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";

// ─── Types ────────────────────────────────────────────────────────────────────
type EntryType = "receita" | "despesa";
type Category  = "vendas_ml" | "vendas_outros" | "servicos" | "custo_produto" | "marketing" | "logistica" | "salarios" | "aluguel" | "impostos" | "outros";

interface FinEntry {
  id: string;
  date: string;
  type: EntryType;
  category: Category;
  description: string;
  amount: number;
}

const CATEGORY_LABELS: Record<Category, string> = {
  vendas_ml:      "Vendas ML",
  vendas_outros:  "Vendas Outros",
  servicos:       "Serviços",
  custo_produto:  "Custo de Produto",
  marketing:      "Marketing / ADS",
  logistica:      "Logística",
  salarios:       "Salários",
  aluguel:        "Aluguel / Infra",
  impostos:       "Impostos",
  outros:         "Outros",
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED: FinEntry[] = [
  { id: "e1",  date: "2026-05-01", type: "receita",  category: "vendas_ml",     description: "Repasse ML — mai/1ª quinzena",  amount: 18420 },
  { id: "e2",  date: "2026-05-01", type: "despesa",  category: "custo_produto", description: "NF fornecedor — Cabo USB",        amount: 3480  },
  { id: "e3",  date: "2026-05-02", type: "despesa",  category: "logistica",     description: "Envio para CD Full",              amount: 650   },
  { id: "e4",  date: "2026-05-05", type: "despesa",  category: "marketing",     description: "ML Ads — mai/semana 1",           amount: 980   },
  { id: "e5",  date: "2026-05-10", type: "receita",  category: "vendas_ml",     description: "Repasse ML — mai/2ª quinzena",    amount: 21340 },
  { id: "e6",  date: "2026-05-10", type: "despesa",  category: "impostos",      description: "DAS Simples Nacional — mai",      amount: 2800  },
  { id: "e7",  date: "2026-05-12", type: "despesa",  category: "salarios",      description: "Folha de pagamento — mai",        amount: 4200  },
  { id: "e8",  date: "2026-05-13", type: "despesa",  category: "aluguel",       description: "Aluguel galpão",                  amount: 1800  },
  { id: "e9",  date: "2026-05-14", type: "despesa",  category: "custo_produto", description: "NF fornecedor — Fone BT",         amount: 5460  },
  { id: "e10", date: "2026-05-15", type: "despesa",  category: "marketing",     description: "ML Ads — mai/semana 3",           amount: 1120  },
  { id: "e11", date: "2026-05-16", type: "receita",  category: "servicos",      description: "Consultoria marketplace",         amount: 3500  },
  { id: "e12", date: "2026-05-18", type: "despesa",  category: "logistica",     description: "Frete devolução",                 amount: 280   },
  { id: "e13", date: "2026-05-19", type: "despesa",  category: "outros",        description: "Assinaturas SaaS",               amount: 490   },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
}

export function FinanceiroEmpresaView({ dateRange, onDateChange }: Props) {
  const [entries, setEntries] = useState<FinEntry[]>(SEED);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "receita" as EntryType,
    category: "outros" as Category,
    description: "",
    amount: "",
  });

  const filtered = useMemo(() =>
    entries.filter(e => e.date >= dateRange.from && e.date <= dateRange.to),
    [entries, dateRange]
  );

  const totals = useMemo(() => {
    const receitas = filtered.filter(e => e.type === "receita").reduce((s, e) => s + e.amount, 0);
    const despesas = filtered.filter(e => e.type === "despesa").reduce((s, e) => s + e.amount, 0);
    return { receitas, despesas, resultado: receitas - despesas };
  }, [filtered]);

  // Group expenses by category
  const byCategory = useMemo(() => {
    const map = new Map<Category, number>();
    filtered.filter(e => e.type === "despesa").forEach(e => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  function handleAdd(ev: FormEvent) {
    ev.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      date: form.date,
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
    }]);
    setForm(f => ({ ...f, description: "", amount: "" }));
  }

  const inputCls = "h-8 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors";

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="border border-rule bg-crt-2 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard">[FIN] Financeiro da Empresa</div>
        <DateRangePicker value={dateRange} onChange={onDateChange} />
      </div>

      {/* P&L KPIs */}
      <div className="grid grid-cols-3 gap-px bg-rule border border-rule">
        <div className="bg-crt p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-faint mb-3">Receitas</div>
          <div className="font-display text-[28px] leading-none text-signal">{fmt(totals.receitas)}</div>
        </div>
        <div className="bg-crt p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-faint mb-3">Despesas</div>
          <div className="font-display text-[28px] leading-none text-hazard">{fmt(totals.despesas)}</div>
        </div>
        <div className={`p-5 ${totals.resultado >= 0 ? "bg-signal/[0.05]" : "bg-hazard/[0.08]"}`}>
          <div className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${totals.resultado >= 0 ? "text-signal" : "text-hazard"}`}>
            Resultado (Lucro/Prejuízo)
          </div>
          <div className={`font-display text-[28px] leading-none ${totals.resultado >= 0 ? "text-signal" : "text-hazard"}`}>
            {fmt(totals.resultado)}
          </div>
          {totals.receitas > 0 && (
            <div className="text-[11px] mt-1.5 text-muted">
              Margem: {((totals.resultado / totals.receitas) * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        {/* Lancamentos */}
        <div className="grid gap-5">
          {/* Add entry form */}
          <form className="border border-rule bg-crt-2 p-4" onSubmit={handleAdd}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-4">Novo lançamento</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted col-span-1">
                Data
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Tipo
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EntryType }))} className={inputCls}>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Categoria
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))} className={inputCls}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Valor R$
                <input type="number" min={0} step={0.01} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0,00" />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted col-span-2 md:col-span-3">
                Descrição
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Descreva o lançamento..." />
              </label>
              <div className="flex items-end">
                <button type="submit" className="w-full h-8 flex items-center justify-center gap-1.5 bg-phos text-crt text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-phos/90 transition-colors">
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
            </div>
          </form>

          {/* Ledger */}
          <div className="border border-rule">
            <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
              Razão — {filtered.length} lançamentos
            </div>
            <div className="table-scroll overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-phos text-crt">
                    {["Data", "Tipo", "Categoria", "Descrição", "Valor", ""].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].reverse().map((e, i) => (
                    <tr key={e.id} className={`border-t border-rule ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                      <td className="px-4 py-2.5 text-faint">{e.date}</td>
                      <td className={`px-4 py-2.5 font-bold text-[11px] uppercase tracking-[0.1em] ${e.type === "receita" ? "text-signal" : "text-hazard"}`}>
                        {e.type}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{CATEGORY_LABELS[e.category]}</td>
                      <td className="px-4 py-2.5 text-phos">{e.description}</td>
                      <td className={`px-4 py-2.5 font-semibold ${e.type === "receita" ? "text-signal" : "text-hazard"}`}>
                        {e.type === "receita" ? "+" : "−"} {fmt(e.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))} className="text-faint hover:text-hazard transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="border border-rule">
          <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">
            Despesas por categoria
          </div>
          <div className="divide-y divide-rule">
            {byCategory.map(([cat, val]) => {
              const pctOfTotal = totals.despesas > 0 ? (val / totals.despesas) * 100 : 0;
              return (
                <div key={cat} className="px-4 py-3">
                  <div className="flex justify-between items-center text-[12px] mb-1.5">
                    <span className="text-muted">{CATEGORY_LABELS[cat]}</span>
                    <span className="font-semibold text-hazard">{fmt(val)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-rule">
                      <div className="h-1 bg-hazard/70" style={{ width: `${pctOfTotal}%` }} />
                    </div>
                    <span className="text-[10px] text-faint w-10 text-right">{pctOfTotal.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
            {byCategory.length === 0 && (
              <div className="px-4 py-6 text-center text-[11px] text-faint uppercase tracking-[0.14em]">
                Sem despesas no período
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
