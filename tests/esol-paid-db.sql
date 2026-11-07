-- Run only before live purchases exist (or in a sandbox with an Auth test account).
-- Every fixture is rolled back. No email or Stripe call is made.
begin;
do $$
declare u uuid; p1 text:='cs_validation_'||gen_random_uuid(); p2 text:='cs_validation_'||gen_random_uuid(); p3 text:='cs_validation_'||gen_random_uuid(); a jsonb; b jsonb; done jsonb;
begin
 assert (select count(*) from public.be_esol_purchases)=0,'Stop if real purchases exist';
 select id into u from auth.users order by created_at limit 1;
 assert u is not null,'An Auth account is required for the isolated transaction test';
 insert into public.be_esol_purchases(checkout_session_id,user_id,customer_id,payment_intent_id,status,created_at) values(p1,u,'cus_validation','pi_'||p1,'paid',now()-interval '2 minutes'),(p2,u,'cus_validation','pi_'||p2,'paid',now()-interval '1 minute');
 a:=public.be_esol_start_final(u,'Validation only','[{"kind":"choice","answer":"A"}]'::jsonb,'transaction-test');assert a->>'purchase_id'=p1;
 b:=public.be_esol_start_final(u,'Different name','[]'::jsonb,'transaction-test');assert a->>'attempt_id'=b->>'attempt_id','Resuming must reuse the same purchase';
 b:=public.be_esol_save_final(u,(a->>'attempt_id')::uuid,'{"0":"A"}'::jsonb);
 done:=public.be_esol_finish_final(u,(a->>'attempt_id')::uuid,0,'{"validated":true}'::jsonb);assert done->>'error'='answers_changed';
 done:=public.be_esol_finish_final(u,(a->>'attempt_id')::uuid,1,'{"validated":true}'::jsonb);assert done->>'status'='completed';
 done:=public.be_esol_finish_final(u,(a->>'attempt_id')::uuid,1,'{"tampered":true}'::jsonb);assert done->'report'='{"validated":true}'::jsonb,'Completed report must be immutable';
 b:=public.be_esol_save_final(u,(a->>'attempt_id')::uuid,'{"0":"B"}'::jsonb);assert b->>'error'='completed';
 b:=public.be_esol_start_final(u,'Validation only','[]'::jsonb,'transaction-test');assert b->>'purchase_id'=p2;
 done:=public.be_esol_finish_final(u,(b->>'attempt_id')::uuid,0,'{"validated":true}'::jsonb);
 b:=public.be_esol_start_final(u,'Validation only','[]'::jsonb,'transaction-test');assert b->>'error'='payment_required','Two used purchases cannot fund a third attempt';
 insert into public.be_esol_purchases(checkout_session_id,user_id,customer_id,payment_intent_id,status) values(p3,u,'cus_validation','pi_'||p3,'paid');
 insert into public.be_esol_payment_blocks(payment_intent_id,status,reason) values('pi_'||p3,'held','Validation only');
 b:=public.be_esol_start_final(u,'Validation only','[]'::jsonb,'transaction-test');assert b->>'error'='payment_required','A held payment must not fund a new attempt';
 update public.be_esol_payment_blocks set active=false where payment_intent_id='pi_'||p3;
 b:=public.be_esol_start_final(u,'Validation only','[]'::jsonb,'transaction-test');assert b->>'purchase_id'=p3;
 assert not has_function_privilege('authenticated','public.be_esol_start_final(uuid,text,jsonb,text)','EXECUTE');
 assert not has_table_privilege('authenticated','public.be_esol_paid_attempts','SELECT');
end $$;
rollback;
