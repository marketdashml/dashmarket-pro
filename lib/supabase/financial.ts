import { createBrowserSupabaseClient } from "./browser";

// ─── Types (mirror DB schema) ─────────────────────────────────────────────────
export type EntryType  = "receita" | "despesa";
export type FinCat     = "vendas_ml" | "vendas_outros" | "servicos" | "custo_produto" | "marketing" | "logistica" | "salarios" | "aluguel" | "impostos" | "outros";
export type PessoalCat = "salario" | "dividendos" | "freelance" | "investimentos" | "moradia" | "alimentacao" | "transporte" | "saude" | "educacao" | "lazer" | "outros";
export type LoanType   = "cedido" | "tomado";
export type LoanStatus = "ativo" | "quitado" | "atrasado";

export interface FinancialEntry {
  id: string;
  organization_id: string;
  date: string;
  type: EntryType;
  category: FinCat;
  description: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface PersonalEntry {
  id: string;
  user_id: string;
  date: string;
  type: EntryType;
  category: PessoalCat;
  description: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  type: LoanType;
  counterpart: string;
  description?: string;
  principal: number;
  interest_pct: number;
  start_date: string;
  due_date: string;
  amount_paid: number;
  status: LoanStatus;
  notes?: string;
  created_at: string;
}

// ─── Financial entries (empresa) ──────────────────────────────────────────────
export async function fetchFinancialEntries(organizationId: string, from: string, to: string): Promise<FinancialEntry[]> {
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("financial_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FinancialEntry[];
}

export async function insertFinancialEntry(entry: Omit<FinancialEntry, "id" | "created_at">): Promise<FinancialEntry> {
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("financial_entries")
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as FinancialEntry;
}

export async function deleteFinancialEntry(id: string): Promise<void> {
  const sb = createBrowserSupabaseClient();
  const { error } = await sb.from("financial_entries").delete().eq("id", id);
  if (error) throw error;
}

// ─── Personal entries ─────────────────────────────────────────────────────────
export async function fetchPersonalEntries(userId: string, from: string, to: string): Promise<PersonalEntry[]> {
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("personal_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PersonalEntry[];
}

export async function insertPersonalEntry(entry: Omit<PersonalEntry, "id" | "created_at">): Promise<PersonalEntry> {
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("personal_entries")
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as PersonalEntry;
}

export async function deletePersonalEntry(id: string): Promise<void> {
  const sb = createBrowserSupabaseClient();
  const { error } = await sb.from("personal_entries").delete().eq("id", id);
  if (error) throw error;
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export async function fetchLoans(userId: string): Promise<Loan[]> {
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("loans")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Loan[];
}

export async function insertLoan(loan: Omit<Loan, "id" | "created_at">): Promise<Loan> {
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("loans")
    .insert(loan)
    .select()
    .single();
  if (error) throw error;
  return data as Loan;
}

export async function updateLoanStatus(id: string, status: LoanStatus, amountPaid: number): Promise<void> {
  const sb = createBrowserSupabaseClient();
  const { error } = await sb
    .from("loans")
    .update({ status, amount_paid: amountPaid })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLoan(id: string): Promise<void> {
  const sb = createBrowserSupabaseClient();
  const { error } = await sb.from("loans").delete().eq("id", id);
  if (error) throw error;
}
