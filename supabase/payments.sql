-- Migrasi pembayaran MUSSE (DOKU) — TAHAP TESTING (sandbox dulu).
-- CARA PAKAI: buka Supabase Dashboard -> SQL Editor -> paste SELURUH file ini
-- -> Run -> lalu SAVE query ini dengan nama 'payments_doku' (biar tidak hilang).
-- Menambah tabel payments saja; tidak mengubah tabel lain.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid not null,
  amount integer not null default 5000,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired')),
  payment_url text,
  tka_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_status_idx
  on public.payments (user_id, status);

alter table public.payments enable row level security;

-- User hanya bisa LIHAT order miliknya sendiri.
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

-- User hanya bisa BUAT order atas namanya sendiri (route create pakai sesi user).
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() = user_id);

-- Webhook DOKU menulis via service role (melewati RLS), jadi tidak butuh policy
-- update/insert tambahan. JANGAN tambah policy update untuk anon/authenticated.
