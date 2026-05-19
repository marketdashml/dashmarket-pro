"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import {
  fetchPersonalEntries, insertPersonalEntry, deletePersonalEntry,
  fetchLoans, insertLoan, updateLoanStatus, deleteLoan as deleteLoanDb,
  type LoanStatus as DbLoanStatus,
} from "@/lib/supabase/financial";

// ─── Types ────────────────────────────────────────────────────────────────────
type PessoalType = "receita" | "despesa";
type PessoalCat  = "salario" | "dividendos" | "freelance" | "investimentos" | "moradia" | "alimentacao" | "transporte" | "saude" | "educacao" | "lazer" | "outros";
type LoanType    = "cedido" | "tomado";
type LoanStatus  = "ativo" | "quitado" | "atrasado";

interface PessoalEntry {
  id: string;
  date: string;
  type: PessoalType;
  category: PessoalCat;
  description: string;
  amount: number;
}

interface Loan {
  id: string;
  type: LoanType;
  counterpart: string;      // borrower or lender
  description: string;
  principal: number;
  interestPct: number;
  startDate: string;
  dueDate: string;
  amountPaid: number;
  status: LoanStatus;
}

const CAT_LABELS: Record<PessoalCat, string> = {
  salario:      "Salário / Pró-labore",
  dividendos:   "Dividendos",
  freelance:    "Freelance",
  investimentos:"Investimentos",
  moradia:      "Moradia",
  alimentacao:  "Alimentação",
  transporte:   "Transporte",
  saude:        "Saúde",
  educacao:     "Educação",
  lazer:        "Lazer",
  outros:       "Outros",
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const PESSOAL_SEED: PessoalEntry[] = [
  { id: "p1", date: "2026-05-05", type: "receita", category: "dividendos",    description: "Distribuição de lucros",      amount: 8000 },
  { id: "p2", date: "2026-05-05", type: "receita", category: "salario",       description: "Pró-labore mensal",           amount: 4500 },
  { id: "p3", date: "2026-05-10", type: "despesa", category: "moradia",       description: "Aluguel apartamento",         amount: 2200 },
  { id: "p4", date: "2026-05-10", type: "despesa", category: "alimentacao",   description: "Supermercado",                amount: 680  },
  { id: "p5", date: "2026-05-11", type: "despesa", category: "transporte",    description: "Combustível e estacionamento",amount: 420  },
  { id: "p6", date: "2026-05-12", type: "despesa", category: "saude",         description: "Plano de saúde",              amount: 890  },
  { id: "p7", date: "2026-05-14", type: "despesa", category: "educacao",      description: "Curso online",                amount: 350  },
  { id: "p8", date: "2026-05-15", type: "receita", category: "freelance",     description: "Consultoria pontual",         amount: 1800 },
  { id: "p9", date: "2026-05-17", type: "despesa", category: "lazer",         description: "Restaurante / Entretenimento",amount: 580  },
  { id: "p10",date: "2026-05-19", type: "despesa", category: "outros",        description: "Assinaturas pessoais",        amount: 180  },
];

const LOANS_SEED: Loan[] = [
  { id: "l1", type: "cedido",  counterpart: "João Silva",      description: "Empréstimo pessoal",              principal: 5000, interestPct: 0,   startDate: "2026-03-01", dueDate: "2026-07-01", amountPaid: 2000, status: "ativo"    },
  { id: "l2", type: "cedido",  counterpart: "Maria Souza",     description: "Ajuda para reforma",              principal: 3000, interestPct: 1.5, startDate: "2026-02-15", dueDate: "2026-06-15", amountPaid: 1500, status: "ativo"    },
  { id: "l3", type: "cedido",  counterpart: "Carlos Matos",    description: "Emergência médica",               principal: 1200, interestPct: 0,   startDate: "2025-11-01", dueDate: "2026-03-01", amountPaid: 1200, status: "quitado"  },
  { id: "l4", type: "tomado",  counterpart: "Banco Bradesco",  description: "Financiamento carro",             principal: 32000,interestPct: 1.2, startDate: "2024-01-01", dueDate: "2027-01-01", amountPaid: 12000,status: "ativo"    },
  { id: "l5", type: "tomado",  counterpart: "Ana Lima",        description: "Empréstimo familiar",             principal: 8000, interestPct: 0,   startDate: "2026-01-10", dueDate: "2026-10-10", amountPaid: 2000, status: "ativo"    },
  { id: "l6", type: "tomado",  counterpart: "Banco Itaú",      description: "Cheque especial",                 principal: 2500, interestPct: 5.0, startDate: "2026-04-01", dueDate: "2026-05-01", amountPaid: 0,    status: "atrasado" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_COLOR: Record<LoanStatus, string> = {
  ativo:    "text-signal",
  quitado:  "text-faint",
  atrasado: "text-hazard",
};

interface Props {
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
  userId?: string | null;
}

export function FinanceiroPessoalView({ dateRange, onDateChange, userId }: Props) {
  const isConnected = Boolean(userId);
  const [entries, setEntries] = useState<PessoalEntry[]>(isConnected ? [] : PESSOAL_SEED);
  const [loans, setLoans] = useState<Loan[]>(isConnected ? [] : LOANS_SEED);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load data from Supabase when connected
  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [entriesData, loansData] = await Promise.all([
        fetchPersonalEntries(userId, dateRange.from, dateRange.to),
        fetchLoans(userId),
      ]);
      setEntries(entriesData.map(e => ({ id: e.id, date: e.date, type: e.type as PessoalType, category: e.category as PessoalCat, description: e.description, amount: e.amount })));
      setLoans(loansData.map(l => ({ id: l.id, type: l.type as LoanType, counterpart: l.counterpart, description: l.description ?? "", principal: l.principal, interestPct: l.interest_pct, startDate: l.start_date, dueDate: l.due_date, amountPaid: l.amount_paid, status: l.status as LoanStatus })));
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange.from, dateRange.to]);

  useEffect(() => { if (userId) { loadData(); } }, [loadData, userId]);
  const [activeSection, setActiveSection] = useState<"orcamento" | "emprestimos">("orcamento");
  const [loanForm, setLoanForm] = useState({
    type: "cedido" as LoanType,
    counterpart: "",
    description: "",
    principal: "",
    interestPct: "0",
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
  });
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "receita" as PessoalType,
    category: "outros" as PessoalCat,
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
    return { receitas, despesas, saldo: receitas - despesas };
  }, [filtered]);

  const loanTotals = useMemo(() => {
    const cedidos = loans.filter(l => l.type === "cedido" && l.status !== "quitado");
    const tomados = loans.filter(l => l.type === "tomado" && l.status !== "quitado");
    const cedidosTotal  = cedidos.reduce((s, l) => s + (l.principal - l.amountPaid), 0);
    const tomadosTotal  = tomados.reduce((s, l) => s + (l.principal - l.amountPaid), 0);
    const atrasados     = loans.filter(l => l.status === "atrasado").length;
    return { cedidosTotal, tomadosTotal, netPosition: cedidosTotal - tomadosTotal, atrasados };
  }, [loans]);

  const inputCls = "h-8 bg-crt border border-rule px-3 text-phos text-[12px] normal-case tracking-normal outline-none focus:border-hazard transition-colors";

  async function addEntry(ev: FormEvent) {
    ev.preventDefault();
    if (!entryForm.description.trim() || !entryForm.amount) return;
    const newE: PessoalEntry = { id: crypto.randomUUID(), date: entryForm.date, type: entryForm.type, category: entryForm.category, description: entryForm.description.trim(), amount: Number(entryForm.amount) };
    if (userId) {
      try {
        const saved = await insertPersonalEntry({ user_id: userId, date: newE.date, type: newE.type, category: newE.category, description: newE.description, amount: newE.amount });
        setEntries(prev => [{ id: saved.id, date: saved.date, type: saved.type as PessoalType, category: saved.category as PessoalCat, description: saved.description, amount: saved.amount }, ...prev]);
        setSyncMsg("Salvo no Supabase.");
      } catch (err) { setSyncMsg(err instanceof Error ? err.message : "Erro."); return; }
    } else {
      setEntries(prev => [...prev, newE]);
    }
    setEntryForm(f => ({ ...f, description: "", amount: "" }));
  }

  async function removeEntry(id: string) {
    if (userId) { try { await deletePersonalEntry(id); } catch { /* ignore */ } }
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  async function addLoan(ev: FormEvent) {
    ev.preventDefault();
    if (!loanForm.counterpart.trim() || !loanForm.principal || !loanForm.dueDate) return;
    const newL: Loan = { id: crypto.randomUUID(), type: loanForm.type, counterpart: loanForm.counterpart.trim(), description: loanForm.description.trim(), principal: Number(loanForm.principal), interestPct: Number(loanForm.interestPct), startDate: loanForm.startDate, dueDate: loanForm.dueDate, amountPaid: 0, status: "ativo" };
    if (userId) {
      try {
        const saved = await insertLoan({ user_id: userId, type: newL.type, counterpart: newL.counterpart, description: newL.description, principal: newL.principal, interest_pct: newL.interestPct, start_date: newL.startDate, due_date: newL.dueDate, amount_paid: 0, status: "ativo" });
        setLoans(prev => [...prev, { id: saved.id, type: saved.type as LoanType, counterpart: saved.counterpart, description: saved.description ?? "", principal: saved.principal, interestPct: saved.interest_pct, startDate: saved.start_date, dueDate: saved.due_date, amountPaid: saved.amount_paid, status: saved.status as LoanStatus }]);
        setSyncMsg("Empréstimo salvo.");
      } catch (err) { setSyncMsg(err instanceof Error ? err.message : "Erro."); return; }
    } else {
      setLoans(prev => [...prev, newL]);
    }
    setLoanForm(f => ({ ...f, counterpart: "", description: "", principal: "", dueDate: "" }));
  }

  async function removeLoan(id: string) {
    if (userId) { try { await deleteLoanDb(id); } catch { /* ignore */ } }
    setLoans(prev => prev.filter(l => l.id !== id));
  }

  async function toggleLoanStatus(id: string) {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    const newStatus: LoanStatus = loan.status === "quitado" ? "ativo" : "quitado";
    const newPaid = newStatus === "quitado" ? loan.principal : 0;
    if (userId) {
      try { await updateLoanStatus(id, newStatus as DbLoanStatus, newPaid); } catch { /* ignore */ }
    }
    setLoans(prev => prev.map(l => l.id !== id ? l : { ...l, status: newStatus, amountPaid: newPaid }));
  }

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="border border-rule bg-crt-2 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.22em] text-hazard flex items-center gap-3">
          [FPE] Financeiro Pessoal
          {isConnected && <span className="text-signal">⬤ Supabase</span>}
          {loading && <span className="text-faint animate-blink">Carregando...</span>}
          {syncMsg && <span className="text-faint normal-case tracking-normal">{syncMsg}</span>}
        </div>
        <DateRangePicker value={dateRange} onChange={onDateChange} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
        <div className="bg-crt p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-faint mb-3">Receitas pessoais</div>
          <div className="font-display text-[24px] leading-none text-signal">{fmt(totals.receitas)}</div>
        </div>
        <div className="bg-crt p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-faint mb-3">Despesas pessoais</div>
          <div className="font-display text-[24px] leading-none text-hazard">{fmt(totals.despesas)}</div>
        </div>
        <div className={`p-5 ${totals.saldo >= 0 ? "bg-signal/[0.05]" : "bg-hazard/[0.08]"}`}>
          <div className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${totals.saldo >= 0 ? "text-signal" : "text-hazard"}`}>Saldo do período</div>
          <div className={`font-display text-[24px] leading-none ${totals.saldo >= 0 ? "text-signal" : "text-hazard"}`}>{fmt(totals.saldo)}</div>
        </div>
        <div className={`p-5 ${loanTotals.atrasados > 0 ? "bg-hazard/[0.08]" : "bg-crt"}`}>
          <div className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${loanTotals.atrasados > 0 ? "text-hazard" : "text-faint"}`}>
            Posição líquida empréstimos
          </div>
          <div className={`font-display text-[22px] leading-none ${loanTotals.netPosition >= 0 ? "text-signal" : "text-hazard"}`}>
            {fmt(loanTotals.netPosition)}
          </div>
          <div className="text-[11px] mt-1 text-muted">{loanTotals.atrasados > 0 ? `${loanTotals.atrasados} atrasado(s)` : "Sem atrasos"}</div>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex border border-rule w-fit">
        {([["orcamento", "Orçamento Pessoal"], ["emprestimos", "Empréstimos"]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveSection(key)}
            className={`h-8 px-5 text-[10.5px] uppercase tracking-[0.16em] border-r border-rule last:border-r-0 transition-colors ${activeSection === key ? "bg-phos text-crt font-semibold" : "text-faint hover:text-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ORCAMENTO ── */}
      {activeSection === "orcamento" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
          <div className="grid gap-5">
            {/* Entry form */}
            <form className="border border-rule bg-crt-2 p-4" onSubmit={addEntry}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-4">Novo lançamento pessoal</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                  Data <input type="date" value={entryForm.date} onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </label>
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                  Tipo
                  <select value={entryForm.type} onChange={e => setEntryForm(f => ({ ...f, type: e.target.value as PessoalType }))} className={inputCls}>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                  Categoria
                  <select value={entryForm.category} onChange={e => setEntryForm(f => ({ ...f, category: e.target.value as PessoalCat }))} className={inputCls}>
                    {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                  Valor R$ <input type="number" min={0} step={0.01} value={entryForm.amount} onChange={e => setEntryForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0,00" />
                </label>
                <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted col-span-2 md:col-span-3">
                  Descrição <input type="text" value={entryForm.description} onChange={e => setEntryForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Descreva..." />
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
              <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">Lançamentos — {filtered.length}</div>
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
                      <td className={`px-4 py-2.5 font-bold text-[11px] uppercase tracking-[0.1em] ${e.type === "receita" ? "text-signal" : "text-hazard"}`}>{e.type}</td>
                      <td className="px-4 py-2.5 text-muted">{CAT_LABELS[e.category]}</td>
                      <td className="px-4 py-2.5 text-phos">{e.description}</td>
                      <td className={`px-4 py-2.5 font-semibold ${e.type === "receita" ? "text-signal" : "text-hazard"}`}>
                        {e.type === "receita" ? "+" : "−"} {fmt(e.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => removeEntry(e.id)} className="text-faint hover:text-hazard transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense categories */}
          <div className="border border-rule">
            <div className="bg-crt-2 px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] text-hazard">Despesas por categoria</div>
            <div className="divide-y divide-rule">
              {(() => {
                const map = new Map<PessoalCat, number>();
                filtered.filter(e => e.type === "despesa").forEach(e => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
                return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                  const pctOfTotal = totals.despesas > 0 ? (val / totals.despesas) * 100 : 0;
                  return (
                    <div key={cat} className="px-4 py-3">
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-muted">{CAT_LABELS[cat]}</span>
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
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── EMPRESTIMOS ── */}
      {activeSection === "emprestimos" && (
        <div className="grid gap-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-px bg-rule border border-rule">
            <div className="bg-crt p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-faint mb-3">A Receber (cedidos)</div>
              <div className="font-display text-[24px] leading-none text-signal">{fmt(loanTotals.cedidosTotal)}</div>
              <div className="text-[11px] mt-1 text-muted">{loans.filter(l => l.type === "cedido" && l.status === "ativo").length} empréstimos ativos</div>
            </div>
            <div className="bg-crt p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-faint mb-3">A Pagar (tomados)</div>
              <div className="font-display text-[24px] leading-none text-hazard">{fmt(loanTotals.tomadosTotal)}</div>
              <div className="text-[11px] mt-1 text-muted">{loans.filter(l => l.type === "tomado" && l.status === "ativo").length} empréstimos ativos</div>
            </div>
            <div className={`p-5 ${loanTotals.atrasados > 0 ? "bg-hazard/[0.08]" : "bg-signal/[0.04]"}`}>
              <div className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${loanTotals.atrasados > 0 ? "text-hazard" : "text-signal"}`}>Posição líquida</div>
              <div className={`font-display text-[24px] leading-none ${loanTotals.netPosition >= 0 ? "text-signal" : "text-hazard"}`}>{fmt(loanTotals.netPosition)}</div>
              {loanTotals.atrasados > 0 && <div className="text-[11px] mt-1 text-hazard">{loanTotals.atrasados} atrasado(s)</div>}
            </div>
          </div>

          {/* New loan form */}
          <form className="border border-rule bg-crt-2 p-4" onSubmit={addLoan}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-hazard mb-4">Registrar empréstimo</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Tipo
                <select value={loanForm.type} onChange={e => setLoanForm(f => ({ ...f, type: e.target.value as LoanType }))} className={inputCls}>
                  <option value="cedido">Cedido (emprestei)</option>
                  <option value="tomado">Tomado (devo)</option>
                </select>
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                {loanForm.type === "cedido" ? "Devedor" : "Credor"}
                <input type="text" value={loanForm.counterpart} onChange={e => setLoanForm(f => ({ ...f, counterpart: e.target.value }))} className={inputCls} placeholder="Nome..." />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Valor R$
                <input type="number" min={0} step={0.01} value={loanForm.principal} onChange={e => setLoanForm(f => ({ ...f, principal: e.target.value }))} className={inputCls} placeholder="0,00" />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Juros % a.m.
                <input type="number" min={0} step={0.1} value={loanForm.interestPct} onChange={e => setLoanForm(f => ({ ...f, interestPct: e.target.value }))} className={inputCls} placeholder="0" />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Data início
                <input type="date" value={loanForm.startDate} onChange={e => setLoanForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                Vencimento
                <input type="date" value={loanForm.dueDate} onChange={e => setLoanForm(f => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
              </label>
              <label className="grid gap-1 text-[11px] uppercase tracking-[0.1em] text-muted md:col-span-1">
                Descrição
                <input type="text" value={loanForm.description} onChange={e => setLoanForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Finalidade..." />
              </label>
              <div className="flex items-end">
                <button type="submit" className="w-full h-8 flex items-center justify-center gap-1.5 bg-phos text-crt text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-phos/90 transition-colors">
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
            </div>
          </form>

          {/* Loans tables */}
          {(["cedido", "tomado"] as LoanType[]).map(ltype => {
            const loansOfType = loans.filter(l => l.type === ltype);
            return (
              <div key={ltype} className="border border-rule">
                <div className={`px-4 py-3 border-b border-rule text-[10px] uppercase tracking-[0.22em] ${ltype === "cedido" ? "bg-signal/[0.04] text-signal" : "bg-hazard/[0.05] text-hazard"}`}>
                  {ltype === "cedido" ? "Empréstimos Cedidos — Valores a Receber" : "Empréstimos Tomados — Valores a Pagar"}
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-phos text-crt">
                      {[ltype === "cedido" ? "Devedor" : "Credor", "Descrição", "Principal", "Juros a.m.", "Pago", "Saldo", "Vencimento", "Status", ""].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loansOfType.map((l, i) => {
                      const balance = l.principal - l.amountPaid;
                      const isOverdue = new Date(l.dueDate) < new Date() && l.status !== "quitado";
                      return (
                        <tr key={l.id} className={`border-t border-rule ${i % 2 === 1 ? "bg-crt-2/40" : "bg-crt"}`}>
                          <td className="px-4 py-2.5 font-semibold text-phos">{l.counterpart}</td>
                          <td className="px-4 py-2.5 text-muted">{l.description || "—"}</td>
                          <td className="px-4 py-2.5">{fmt(l.principal)}</td>
                          <td className="px-4 py-2.5 text-muted">{l.interestPct > 0 ? `${l.interestPct}%` : "Sem juros"}</td>
                          <td className="px-4 py-2.5 text-signal">{fmt(l.amountPaid)}</td>
                          <td className={`px-4 py-2.5 font-bold ${balance > 0 ? (ltype === "tomado" ? "text-hazard" : "text-signal") : "text-faint"}`}>{fmt(balance)}</td>
                          <td className={`px-4 py-2.5 ${isOverdue ? "text-hazard font-bold" : "text-muted"}`}>{l.dueDate}</td>
                          <td className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] ${STATUS_COLOR[isOverdue ? "atrasado" : l.status]}`}>
                            {isOverdue ? "atrasado" : l.status}
                          </td>
                          <td className="px-4 py-2.5 flex items-center gap-2">
                            <button onClick={() => toggleLoanStatus(l.id)} className="text-faint hover:text-signal transition-colors text-[10px] uppercase tracking-[0.1em]">
                              {l.status === "quitado" ? "Reabrir" : "Quitar"}
                            </button>
                            <button onClick={() => removeLoan(l.id)} className="text-faint hover:text-hazard transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
