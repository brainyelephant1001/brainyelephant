'use strict';
const keys={be_esol_billing_customers:'user_id',be_esol_billing_events:'event_id',be_esol_purchases:'checkout_session_id',be_esol_payment_blocks:'payment_intent_id',be_esol_paid_attempts:'attempt_id'};
function store(){const data=Object.fromEntries(Object.keys(keys).map(k=>[k,[]]));return {data,async fetcher(url,opts){const u=new URL(url),table=u.pathname.split('/').pop(),list=data[table];if(!list)throw Error('Unknown table '+table);const filters=[...u.searchParams].filter(([k])=>k!=='on_conflict'&&k!=='select');let found=list.filter(row=>filters.every(([k,v])=>v.startsWith('neq.')?String(row[k])!==v.slice(4):String(row[k])===v.replace(/^eq\./,'')));
 if(opts.method==='POST'){const obj=JSON.parse(opts.body),key=keys[table],existing=list.find(r=>r[key]===obj[key]);if(existing)Object.assign(existing,obj);else list.push(obj);found=[obj];}else if(opts.method==='PATCH'){const obj=JSON.parse(opts.body);found.forEach(r=>Object.assign(r,obj));}
 return {ok:true,status:200,json:async()=>structuredClone(found)};}};}
module.exports={store};
