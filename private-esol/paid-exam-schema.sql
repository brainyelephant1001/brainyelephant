-- One purchase funds exactly one final attempt. Report ownership survives consumption/refund.
create table if not exists public.be_esol_purchases (
 checkout_session_id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 customer_id text not null,
 payment_intent_id text not null unique,
 status text not null check(status in ('paid','held','refunded')),
 created_at timestamptz not null default now()
);
create index if not exists be_esol_purchases_user_idx on public.be_esol_purchases(user_id);
create table if not exists public.be_esol_payment_blocks (
 payment_intent_id text primary key,
 status text not null check(status in ('held','refunded')),
 active boolean not null default true,
 reason text not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.be_esol_paid_attempts (
 attempt_id uuid primary key default gen_random_uuid(),
 purchase_id text not null unique references public.be_esol_purchases(checkout_session_id),
 user_id uuid not null references auth.users(id) on delete cascade,
 learner_name text not null check(char_length(learner_name) between 2 and 160),
 bank_version text not null,
 questions jsonb not null check(jsonb_typeof(questions)='array'),
 answers jsonb not null default '{}'::jsonb,
 answer_revision integer not null default 0,
 status text not null default 'in_progress' check(status in ('in_progress','completed')),
 report jsonb,
 started_at timestamptz not null default now(),
 completed_at timestamptz
);
create index if not exists be_esol_paid_attempts_user_idx on public.be_esol_paid_attempts(user_id);
alter table public.be_esol_purchases enable row level security;
alter table public.be_esol_payment_blocks enable row level security;
alter table public.be_esol_paid_attempts enable row level security;
revoke all on public.be_esol_purchases,public.be_esol_payment_blocks,public.be_esol_paid_attempts from public,anon,authenticated;
grant select,insert,update on public.be_esol_purchases,public.be_esol_payment_blocks,public.be_esol_paid_attempts to service_role;

create or replace function public.be_esol_start_final(p_user uuid,p_name text,p_questions jsonb,p_version text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.be_esol_paid_attempts; purchase text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select t.* into a from public.be_esol_paid_attempts t join public.be_esol_purchases p on p.checkout_session_id=t.purchase_id where t.user_id=p_user and t.status='in_progress' and p.status='paid' and not exists(select 1 from public.be_esol_payment_blocks b where b.payment_intent_id=p.payment_intent_id and b.active) order by t.started_at limit 1 for update of t;
 if found then return to_jsonb(a); end if;
 select p.checkout_session_id into purchase from public.be_esol_purchases p where p.user_id=p_user and p.status='paid' and not exists(select 1 from public.be_esol_payment_blocks b where b.payment_intent_id=p.payment_intent_id and b.active) and not exists(select 1 from public.be_esol_paid_attempts t where t.purchase_id=p.checkout_session_id) order by p.created_at limit 1 for update;
 if purchase is null then return jsonb_build_object('error','payment_required'); end if;
 insert into public.be_esol_paid_attempts(purchase_id,user_id,learner_name,bank_version,questions) values(purchase,p_user,p_name,p_version,p_questions) returning * into a;
 return to_jsonb(a);
end $$;
create or replace function public.be_esol_save_final(p_user uuid,p_attempt uuid,p_answers jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.be_esol_paid_attempts;
begin
 select * into a from public.be_esol_paid_attempts where attempt_id=p_attempt and user_id=p_user for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if a.status='completed' then return jsonb_build_object('error','completed'); end if;
 if not exists(select 1 from public.be_esol_purchases p where p.checkout_session_id=a.purchase_id and p.status='paid' and not exists(select 1 from public.be_esol_payment_blocks b where b.payment_intent_id=p.payment_intent_id and b.active)) then return jsonb_build_object('error','payment_unavailable'); end if;
 update public.be_esol_paid_attempts set answers=answers||p_answers,answer_revision=answer_revision+1 where attempt_id=p_attempt returning * into a;
 return to_jsonb(a);
end $$;
create or replace function public.be_esol_finish_final(p_user uuid,p_attempt uuid,p_revision integer,p_report jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.be_esol_paid_attempts;
begin
 select * into a from public.be_esol_paid_attempts where attempt_id=p_attempt and user_id=p_user for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if a.status='completed' then return to_jsonb(a); end if;
 if a.answer_revision<>p_revision then return jsonb_build_object('error','answers_changed'); end if;
 if not exists(select 1 from public.be_esol_purchases p where p.checkout_session_id=a.purchase_id and p.status='paid' and not exists(select 1 from public.be_esol_payment_blocks b where b.payment_intent_id=p.payment_intent_id and b.active)) then return jsonb_build_object('error','payment_unavailable'); end if;
 update public.be_esol_paid_attempts set status='completed',report=p_report,completed_at=now() where attempt_id=p_attempt returning * into a;
 return to_jsonb(a);
end $$;
revoke all on function public.be_esol_start_final(uuid,text,jsonb,text),public.be_esol_save_final(uuid,uuid,jsonb),public.be_esol_finish_final(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.be_esol_start_final(uuid,text,jsonb,text),public.be_esol_save_final(uuid,uuid,jsonb),public.be_esol_finish_final(uuid,uuid,integer,jsonb) to service_role;
