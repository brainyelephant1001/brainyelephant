-- Additive billing records. No change to existing learners, progress or entitlement policies.
create table if not exists public.be_esol_billing_customers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text not null unique,
 risk_hold boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.be_esol_billing_subscriptions (
 subscription_id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 customer_id text not null references public.be_esol_billing_customers(customer_id),
 status text not null,
 valid_until timestamptz,
 risk_hold boolean not null default false
);
create index if not exists be_esol_billing_subscriptions_user_idx on public.be_esol_billing_subscriptions(user_id);
create index if not exists be_esol_billing_subscriptions_customer_idx on public.be_esol_billing_subscriptions(customer_id);
create table if not exists public.be_esol_billing_events (
 event_id text primary key,
 event_type text not null,
 processed_at timestamptz not null default now()
);
create table if not exists public.be_esol_billing_risk_events (
 event_id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 reason text not null,
 created_at timestamptz not null default now()
);
alter table public.be_esol_billing_customers enable row level security;
alter table public.be_esol_billing_subscriptions enable row level security;
alter table public.be_esol_billing_events enable row level security;
alter table public.be_esol_billing_risk_events enable row level security;
revoke all on public.be_esol_billing_customers,public.be_esol_billing_subscriptions,public.be_esol_billing_events,public.be_esol_billing_risk_events from public,anon,authenticated;
grant select,insert,update on public.be_esol_billing_customers,public.be_esol_billing_subscriptions,public.be_esol_billing_events,public.be_esol_billing_risk_events to service_role;
