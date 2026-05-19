-- ─── Financial entries (empresa) ─────────────────────────────────────────────
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  date date not null,
  type text not null check (type in ('receita', 'despesa')),
  category text not null check (category in (
    'vendas_ml', 'vendas_outros', 'servicos',
    'custo_produto', 'marketing', 'logistica',
    'salarios', 'aluguel', 'impostos', 'outros'
  )),
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Personal entries (financeiro pessoal) ────────────────────────────────────
create table if not exists public.personal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('receita', 'despesa')),
  category text not null check (category in (
    'salario', 'dividendos', 'freelance', 'investimentos',
    'moradia', 'alimentacao', 'transporte', 'saude',
    'educacao', 'lazer', 'outros'
  )),
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Loans ───────────────────────────────────────────────────────────────────
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('cedido', 'tomado')),
  counterpart text not null,          -- borrower or lender name
  description text,
  principal numeric(14, 2) not null check (principal > 0),
  interest_pct numeric(8, 4) not null default 0,
  start_date date not null,
  due_date date not null,
  amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  status text not null default 'ativo' check (status in ('ativo', 'quitado', 'atrasado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date > start_date),
  check (amount_paid <= principal)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists financial_entries_org_date_idx
  on public.financial_entries (organization_id, date desc);

create index if not exists personal_entries_user_date_idx
  on public.personal_entries (user_id, date desc);

create index if not exists loans_user_idx
  on public.loans (user_id, status, due_date);

-- ─── updated_at triggers ──────────────────────────────────────────────────────
drop trigger if exists financial_entries_set_updated_at on public.financial_entries;
create trigger financial_entries_set_updated_at
  before update on public.financial_entries
  for each row execute function public.set_updated_at();

drop trigger if exists personal_entries_set_updated_at on public.personal_entries;
create trigger personal_entries_set_updated_at
  before update on public.personal_entries
  for each row execute function public.set_updated_at();

drop trigger if exists loans_set_updated_at on public.loans;
create trigger loans_set_updated_at
  before update on public.loans
  for each row execute function public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.financial_entries enable row level security;
alter table public.personal_entries  enable row level security;
alter table public.loans             enable row level security;

-- financial_entries: org members only
drop policy if exists "financial_entries_org_member" on public.financial_entries;
create policy "financial_entries_org_member" on public.financial_entries for all
  using  (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- personal_entries: only the owner
drop policy if exists "personal_entries_own" on public.personal_entries;
create policy "personal_entries_own" on public.personal_entries for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- loans: only the owner
drop policy if exists "loans_own" on public.loans;
create policy "loans_own" on public.loans for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
