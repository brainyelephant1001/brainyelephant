-- Brainy Elephant ESOL — proposed schema V1.
-- Review before deploying to a dedicated Brainy Elephant Supabase project.
-- Never apply to the existing Word Master / John Smythe projects.
-- No payments, certificates or official assessments are enabled by this schema.

create table if not exists public.be_esol_learners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  certificate_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_name_length check (char_length(certificate_name) <= 160)
);

create table if not exists public.be_esol_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level_number smallint not null check (level_number between 1 and 5),
  lesson_id text not null check (char_length(lesson_id) between 1 and 64),
  completed_at timestamptz not null default now(),
  primary key (user_id, level_number, lesson_id)
);

-- Server-written attempts. Do not permit the browser to choose its own score.
-- Before enabling assessed results, use a trusted server to calculate and write
-- scores from answer submissions; do not trust client-supplied marks.
create table if not exists public.be_esol_assessment_attempts (
  attempt_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_code text not null check (char_length(assessment_code) between 1 and 64),
  question_bank_version text not null check (char_length(question_bank_version) between 1 and 64),
  raw_score smallint not null check (raw_score >= 0),
  maximum_score smallint not null check (maximum_score > 0),
  completed_at timestamptz not null default now(),
  constraint valid_score check (raw_score <= maximum_score)
);
create index if not exists be_esol_attempts_user_date_idx
  on public.be_esol_assessment_attempts(user_id, completed_at desc);

-- Subscription entitlement is controlled by payment webhooks / trusted server only.
create table if not exists public.be_esol_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('none','standard','premium')),
  valid_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.be_esol_learners enable row level security;
alter table public.be_esol_progress enable row level security;
alter table public.be_esol_assessment_attempts enable row level security;
alter table public.be_esol_entitlements enable row level security;

revoke all on public.be_esol_learners from anon, authenticated;
revoke all on public.be_esol_progress from anon, authenticated;
revoke all on public.be_esol_assessment_attempts from anon, authenticated;
revoke all on public.be_esol_entitlements from anon, authenticated;

grant select, insert (user_id, certificate_name), update (certificate_name)
  on public.be_esol_learners to authenticated;
grant select, insert (user_id, level_number, lesson_id)
  on public.be_esol_progress to authenticated;
grant select on public.be_esol_assessment_attempts to authenticated;
grant select on public.be_esol_entitlements to authenticated;

create policy "Learners read own profile"
  on public.be_esol_learners for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Learners create own profile"
  on public.be_esol_learners for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Learners update own display name"
  on public.be_esol_learners for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Learners read own progress"
  on public.be_esol_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Learners record own practice progress"
  on public.be_esol_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Learners read own scored assessments"
  on public.be_esol_assessment_attempts for select to authenticated
  using ((select auth.uid()) = user_id);
-- No authenticated INSERT/UPDATE/DELETE on scored assessments.
create policy "Learners read own entitlements"
  on public.be_esol_entitlements for select to authenticated
  using ((select auth.uid()) = user_id);
-- No authenticated INSERT/UPDATE/DELETE on entitlements.
