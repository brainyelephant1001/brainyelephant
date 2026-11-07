'use strict';
const assert=require('node:assert/strict'),{offer}=require('../private-esol/offer'),{createBilling}=require('../private-esol/billing'),{store}=require('./helpers/paid-store');
(async()=>{
 const start='2026-11-07T00:00:00Z',end='2027-05-06T23:00:00Z';
 const env={ESOL_PUBLIC_CUSTOMERS:'true',ESOL_CUSTOMER_ORIGIN:'https://course.example.invalid',STRIPE_RESTRICTED_KEY:'test-fixture',ESOL_STRIPE_PRICE_ID:'price_intro',ESOL_STRIPE_STANDARD_PRICE_ID:'price_standard',STRIPE_WEBHOOK_SECRET:'fixture',SUPABASE_SECRET_KEY:'sb_secret_fixture',ESOL_TERMS_URL:'https://course.example.invalid/terms',ESOL_PRIVACY_URL:'https://course.example.invalid/privacy',ESOL_SUPPORT_EMAIL:'support@example.invalid',ESOL_OFFER_START:start,ESOL_OFFER_END:end};
 assert(!offer({},0).started);assert(!offer({...env,ESOL_OFFER_END:'bad'},0).scheduled);
 assert(!offer(env,Date.parse(start)-1).started);
 assert.equal(offer(env,Date.parse(start)).amount,2999);
 assert.equal(offer(env,Date.parse(end)-1).priceId,'price_intro');
 assert.equal(offer(env,Date.parse(end)).priceId,'price_standard');
 assert.equal(offer(env,Date.parse(end)).amount,4999);
 assert(offer(env,Date.parse(start)).dates.includes('6 May 2027'));
 let now=Date.parse(end)-1000,linePrice='price_intro',quoted;
 const memory=store();
 const stripe={prices:{retrieve:async id=>({active:true,currency:'gbp',unit_amount:id==='price_intro'?2999:4999,recurring:null})},customers:{create:async()=>({id:'cus_offer'})},checkout:{sessions:{create:async p=>{quoted=p;return {url:'https://checkout.stripe.com/c/test'}},listLineItems:async()=>({data:[{price:{id:linePrice},quantity:1}]})}},webhooks:{constructEvent:r=>JSON.parse(r)}};
 const billing=createBilling({env,stripe,clock:()=>now,fetcher:memory.fetcher});
 const user={id:'offer-user',email:'learner@example.invalid'};
 await billing.checkout(user);assert.equal(quoted.line_items[0].price,'price_intro');assert.equal(quoted.expires_at,Math.floor(now/1000)+1800);
 now=Date.parse(end);await billing.checkout(user);assert.equal(quoted.line_items[0].price,'price_standard');
 const event=(id,amount)=>JSON.stringify({id,type:'checkout.session.completed',data:{object:{id,mode:'payment',payment_status:'paid',amount_total:amount,currency:'gbp',customer:'cus_offer',payment_intent:'pi_'+id,client_reference_id:user.id}}});
 // A valid pre-cutoff purchase can arrive after the cutoff without losing access.
 await billing.webhook(event('late_intro',2999),'valid');assert.equal(memory.data.be_esol_purchases.length,1);
 linePrice='price_standard';await billing.webhook(event('standard',4999),'valid');assert.equal(memory.data.be_esol_purchases.length,2);
 await billing.webhook(event('wrong_amount',2999),'valid');assert.equal(memory.data.be_esol_purchases.length,2,'Price and amount must match');
 linePrice='foreign_price';await billing.webhook(event('foreign',4999),'valid');assert.equal(memory.data.be_esol_purchases.length,2);
 assert(await billing.hasAccess(user));
 console.log('PASS: UK offer boundaries, automatic one-off price switch, delayed introductory payments, and price/amount tampering checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
