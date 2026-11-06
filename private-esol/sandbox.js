'use strict';
const crypto=require('node:crypto'),StripeClient=require('stripe');
const {createBilling,EVENTS}=require('./billing'),{createExams}=require('./exams'),{resultsPDF}=require('./results-pdf');
const ROOT='/admin/sandbox';
function sandboxFetch(fetcher,dbUrl){return (url,options)=>{const u=new URL(url),base=new URL(dbUrl);if(u.origin!==base.origin||!u.pathname.startsWith('/rest/v1/'))throw Error('Sandbox storage boundary');const prefix=u.pathname.startsWith('/rest/v1/rpc/')?'/rest/v1/rpc/':'/rest/v1/';const name=u.pathname.slice(prefix.length);if(!name.startsWith('be_esol_')||name.startsWith('be_esol_sandbox_'))throw Error('Sandbox namespace required');u.pathname=prefix+name.replace(/^be_esol_/,'be_esol_sandbox_');return fetcher(u.toString(),options);};}
function createSandbox({env=process.env,fetcher=fetch,stripe:injected}={}){
 const key=env.ESOL_STRIPE_SANDBOX_KEY||'',origin=env.ESOL_CUSTOMER_ORIGIN||'',ready=/^[sr]k_test_/.test(key);
 const client=ready?(injected||new StripeClient(key,{apiVersion:'2026-09-30.endive',timeout:15000,maxNetworkRetries:2})):null;
 const fingerprint=crypto.createHash('sha256').update(key).digest('hex'),configId='setup-'+fingerprint.slice(0,24);
 const scopedFetch=sandboxFetch(fetcher,env.SUPABASE_URL||'https://lovvxmlcpsbvmlxezora.supabase.co');
 const baseEnv={...env,STRIPE_RESTRICTED_KEY:key};
 const store=createBilling({env:baseEnv,stripe:client||{},fetcher:scopedFetch});let settingUp;
 async function config(){return (await store.rows('be_esol_config','id',configId))[0];}
 async function setup(){if(!ready)throw Error('A sandbox test key is required; live keys are rejected.');if(settingUp)return settingUp;settingUp=(async()=>{let stage='database';try{const existing=await config();if(existing)return existing;stage='Products';
  const product=await client.products.create({name:'SANDBOX Brainy Elephant ESOL - one course run',metadata:{purpose:'esol_sandbox'}},{idempotencyKey:configId+'-product'});if(product.livemode!==false)throw Error('Sandbox mode required');
  stage='Prices';const price=await client.prices.create({product:product.id,currency:'gbp',unit_amount:2999,tax_behavior:'inclusive'},{idempotencyKey:configId+'-price'});if(price.livemode!==false)throw Error('Sandbox mode required');
  stage='WebhookEndpoints';const endpoint=await client.webhookEndpoints.create({url:origin+ROOT+'/webhook',api_version:'2026-09-30.endive',enabled_events:EVENTS,description:'ESOL isolated sandbox rehearsal'},{idempotencyKey:configId+'-webhook'});if(endpoint.livemode!==false||!endpoint.secret)throw Error('Sandbox webhook required');
  const saved={id:configId,price_id:price.id,webhook_secret:endpoint.secret,webhook_id:endpoint.id,key_fingerprint:fingerprint};await store.db('be_esol_config?on_conflict=id','POST',saved);return saved;}catch(e){e.sandboxStage=stage;e.sandboxPermissions=[...new Set(JSON.stringify(e.raw||{}).match(/\b(?:rak_)?(?:product|plan|price|webhook|checkout_session|customer|invoice|charge|refund|payment_intent|mandate|payment_method)_(?:read|write)\b/g)||[])];throw e;}})();try{return await settingUp;}finally{settingUp=null;}}
 function billing(c){const proxy=Object.create(client);proxy.checkout={sessions:{create:(params,options)=>client.checkout.sessions.create({...params,success_url:origin+ROOT+'/return',cancel_url:origin+ROOT},options),listLineItems:(...args)=>client.checkout.sessions.listLineItems(...args)}};return createBilling({env:{...baseEnv,ESOL_STRIPE_PRICE_ID:c.price_id,STRIPE_WEBHOOK_SECRET:c.webhook_secret},stripe:proxy,fetcher:scopedFetch});}
 async function connection(){if(!ready)throw Error('A sandbox test key is required; live keys are rejected.');const c=await config();if(!c)throw Error('Run sandbox setup first.');const b=billing(c);return {b,exams:createExams({billing:b})};}
 async function webhook(raw,signature){const {b}=await connection();await b.webhook(raw,signature);}
 async function handle(req,res,user,{page,response,redirect,esc,rawBody,readForm}){
  const pathname=new URL(req.url,'http://local').pathname.slice(ROOT.length)||'/',method=req.method;
  const testUser={...user,email:'esol-sandbox@example.invalid'};
  const html=(body,status=200)=>response(res,status,page('<p><strong>STRIPE SANDBOX — NO REAL MONEY</strong></p>'+body,'Brainy Elephant payment rehearsal'));
  const form=(action,label,hidden='')=>'<form method="post" action="'+ROOT+action+'">'+hidden+'<button>'+label+'</button></form>';
  try{
   if(pathname==='/setup'&&method==='POST'){await setup();return redirect(res,ROOT);}
   if((pathname==='/'||pathname==='/exam'||pathname==='/pricing'||pathname==='/return')&&method==='GET'){
    const c=ready?await config():null;if(!c)return html('<h1>Sandbox payment test</h1><p>'+(ready?'The sandbox key is present. Setup creates a test product, £29.99 test price and a signed test webhook.':'A sandbox key is not configured; a live key cannot be used here.')+'</p>'+(ready?form('/setup','Prepare sandbox checkout'):'')+'<p><a href="/admin/setup">Live setup check</a></p>');
    const {b,exams}=await connection(),d=await exams.dashboard(testUser),purchases=await b.purchases(testUser);
    const events=await b.db('be_esol_billing_events?select=event_id,event_type,processed_at');
    return html('<h1>Sandbox payment test</h1><p>Test price: £29.99. Signed webhook events received: '+events.length+'. These records cannot grant live course access.</p><p>Use Stripe test card <strong>4242 4242 4242 4242</strong>, any future expiry and any three-digit CVC. Do not use a real card.</p>'+form('/checkout','Open sandbox checkout')+'<p>Unused test purchases: '+d.available+'.</p>'+d.active.map(a=>'<p><a href="'+ROOT+'/exam/'+a.attempt_id+'">Resume sandbox final test</a></p>').join('')+(d.available?form('/exam/start','Start sandbox final test'):'')+'<h2>Sandbox purchases</h2>'+purchases.map(p=>'<section><p>'+esc(p.checkout_session_id)+' — '+esc(p.status)+'</p>'+ (p.status==='paid'?form('/rehearse','Run automatic sandbox final-test rehearsal','<input type="hidden" name="purchase" value="'+esc(p.checkout_session_id)+'">')+form('/refund','Refund this sandbox payment','<input type="hidden" name="purchase" value="'+esc(p.checkout_session_id)+'">'):'')+'</section>').join('')+'<h2>Reports</h2>'+d.completed.map(a=>'<p><a href="'+ROOT+'/exam/'+a.attempt_id+'/report.pdf">Download sandbox results PDF</a></p>').join('')+'<p><a href="'+ROOT+'">Refresh payment and refund status</a> · <a href="/admin/setup">Live setup check</a></p>');
   }
   const {b,exams}=await connection();
   if(pathname==='/checkout'&&method==='POST')return redirect(res,await b.checkout(testUser));
   if(pathname==='/refund'&&method==='POST'){
    const f=await readForm(req),p=(await b.purchases(testUser)).find(p=>p.checkout_session_id===f.get('purchase'));if(!p)throw Error('Sandbox purchase not found');
    const payment=await client.checkout.sessions.retrieve(p.checkout_session_id);if(payment.livemode!==false||payment.amount_total!==2999||payment.currency!=='gbp'||(typeof payment.payment_intent==='string'?payment.payment_intent:payment.payment_intent?.id)!==p.payment_intent_id)throw Error('Sandbox refund boundary');
    await client.refunds.create({payment_intent:p.payment_intent_id},{idempotencyKey:'esol-sandbox-refund-'+p.payment_intent_id});return redirect(res,ROOT);
   }
   if(pathname==='/rehearse'&&method==='POST'){
    const f=await readForm(req),p=(await b.purchases(testUser)).find(p=>p.checkout_session_id===f.get('purchase')&&p.status==='paid');if(!p)throw Error('A paid sandbox purchase is required');
    const a=await exams.start(testUser,'Sandbox Learner');let saved=await exams.load(testUser,a.attempt_id);if(saved.status==='completed')throw Error('This test is complete');
    const first=saved.questions[0];await exams.save(testUser,a.attempt_id,{'0':a.questions[0].answer||'Sandbox practice notes'});saved=await exams.load(testUser,a.attempt_id);if(!saved.answers['0'])throw Error('Resume check failed');
    const answers=Object.fromEntries(a.questions.map((q,i)=>[i,q.kind==='choice'?q.answer:'Sandbox practice response — not a proficiency grade.']));await exams.save(testUser,a.attempt_id,answers);const report=await exams.finish(testUser,a.attempt_id);if(report.correct!==120||report.total!==120)throw Error('Scoring rehearsal failed');
    const again=await exams.finish(testUser,a.attempt_id);if(again.report_id!==report.report_id)throw Error('Report persistence failed');
    // One purchase must not create a second attempt. If another purchase exists, do not start it here.
    const ownAttempts=await b.attempts(testUser);if(ownAttempts.filter(x=>x.purchase_id===a.purchase_id).length!==1)throw Error('Purchase consumption failed');
    return html('<h1>Sandbox final-test rehearsal passed</h1><p>Answers saved and reloaded. Score: 120 / 120. Repeated completion returned the same report. This test purchase funds exactly one attempt.</p><p><a href="'+ROOT+'/exam/'+a.attempt_id+'/report.pdf">Download sandbox results PDF</a></p><p><a href="'+ROOT+'">Return to test payments and refund</a></p>');
   }
   if(pathname==='/exam/start'&&method==='POST'){const a=await exams.start(testUser,'Sandbox Learner');return redirect(res,ROOT+'/exam/'+a.attempt_id);}
   const match=pathname.match(/^\/exam\/([0-9a-f-]{36})(?:\/(data|save|finish|report\.pdf))?$/i);if(!match)return html('<h1>Sandbox page not found</h1>',404);const attempt=match[1],action=match[2];
   if(method==='GET'&&action==='data')return response(res,200,JSON.stringify(await exams.load(testUser,attempt)),'application/json');
   if(method==='GET'&&action==='report.pdf'){const report=await exams.report(testUser,attempt),pdf=await resultsPDF({...report,sample:true});res.setHeader('Content-Disposition','attachment; filename="Brainy-Elephant-Sandbox-Results.pdf"');return response(res,200,pdf,'application/pdf');}
   if(method==='POST'&&action==='save'){const data=JSON.parse((await rawBody(req)).toString());await exams.save(testUser,attempt,data.answers);return response(res,200,JSON.stringify({saved:true}),'application/json');}
   if(method==='POST'&&action==='finish')return response(res,200,JSON.stringify(await exams.finish(testUser,attempt)),'application/json');
   if(method==='GET'&&!action){await exams.load(testUser,attempt);return html('<div id="paid-test" data-root="'+ROOT+'" data-owner="'+esc(user.id)+'" data-attempt="'+attempt+'">Loading sandbox test...</div><script src="/customer-test.js"></script>');}
   return html('<h1>Method not allowed</h1>',405);
  }catch(e){const missing=(e.sandboxPermissions||[]).filter(x=>/^[a-z_]+$/.test(x)).join(', ');const stage=['Products','Prices','WebhookEndpoints','database'].includes(e.sandboxStage)?e.sandboxStage:'';const info=e.code&&/^[a-z_]{1,80}$/.test(e.code)?' ('+e.code+')':'';if(pathname.endsWith('/data')||pathname.endsWith('/save')||pathname.endsWith('/finish'))return response(res,e.status||503,JSON.stringify({message:'Sandbox request failed'+info+'. Your test work remains saved.'}),'application/json');return html('<h1>Sandbox test needs attention</h1><p>The sandbox request could not complete'+esc(info)+'. '+esc(stage?'Operation: '+stage+'. ':'')+esc(missing?'Required permission: '+missing+'. ':'')+'Check the sandbox key permissions or refresh after payment confirmation. No live payment has been attempted.</p><p><a href="'+ROOT+'">Back to sandbox</a></p>',e.status||503);}
 }
 return {handle,webhook,setup,connection,ready};
}
module.exports={createSandbox,sandboxFetch,ROOT};
