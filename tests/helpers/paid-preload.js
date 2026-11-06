// Disposable test-process only: fake authentication, Stripe transport and database.
// Never loaded by the production start command or Docker image.
'use strict';
const Module=require('node:module'),crypto=require('node:crypto'),{store}=require('./paid-store');
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',memory=store();
memory.data.be_esol_billing_customers.push({user_id:owner,customer_id:'cus_fixture'});memory.data.be_esol_purchases.push({checkout_session_id:'cs_fixture',user_id:owner,customer_id:'cus_fixture',payment_intent_id:'pi_fixture',status:'paid'});
const original=Module._load;Module._load=function(name,...args){if(name==='stripe')return class {constructor(){this.webhooks={constructEvent:()=>{throw Error('Not used in this fixture')}};}};return original.call(this,name,...args);};
global.fetch=async(url,opts={})=>{const u=new URL(url);if(u.origin!=='https://lovvxmlcpsbvmlxezora.supabase.co')throw Error('External network is disabled in paid test fixture');if(u.pathname==='/auth/v1/user'){const token=opts.headers.Authorization;const id=token==='Bearer fixture-owner-token'?owner:token==='Bearer fixture-other-token'?other:null;return {ok:!!id,status:id?200:401,json:async()=>id?{id,email:id===owner?'learner@example.invalid':'other@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z'}:{}};}
 if(u.pathname.includes('/rpc/')){const p=JSON.parse(opts.body),attempts=memory.data.be_esol_paid_attempts,purchases=memory.data.be_esol_purchases;let a=attempts.find(a=>a.user_id===p.p_user&&a.attempt_id===p.p_attempt);const reply=data=>({ok:true,status:200,json:async()=>structuredClone(data)});
  if(u.pathname.endsWith('/be_esol_start_final')){const existing=attempts.find(a=>a.user_id===p.p_user&&a.status==='in_progress');if(existing)return reply(existing);const purchase=purchases.find(x=>x.user_id===p.p_user&&x.status==='paid'&&!attempts.some(a=>a.purchase_id===x.checkout_session_id));if(!purchase)return reply({error:'payment_required'});a={attempt_id:crypto.randomUUID(),purchase_id:purchase.checkout_session_id,user_id:p.p_user,learner_name:p.p_name,questions:p.p_questions,bank_version:p.p_version,answers:{},answer_revision:0,status:'in_progress',started_at:new Date().toISOString()};attempts.push(a);return reply(a);}
  if(!a)return reply({error:'not_found'});if(a.status==='completed')return reply(u.pathname.endsWith('/be_esol_save_final')?{error:'completed'}:a);
  if(u.pathname.endsWith('/be_esol_save_final')){Object.assign(a.answers,p.p_answers);a.answer_revision++;return reply(a);}
  if(u.pathname.endsWith('/be_esol_finish_final')){if(a.answer_revision!==p.p_revision)return reply({error:'answers_changed'});a.report=p.p_report;a.status='completed';a.completed_at=new Date().toISOString();return reply(a);}
 }
 return memory.fetcher(url,opts);
};
