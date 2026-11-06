'use strict';
const assert=require('node:assert/strict'),{spawn}=require('node:child_process');
(async()=>{const child=spawn(process.execPath,['private-esol/server.js'],{env:{...process.env,PORT:'4199',NODE_ENV:'development',ESOL_PUBLIC_CUSTOMERS:'true',STRIPE_RESTRICTED_KEY:'',ESOL_TESTER_EMAILS:'',SUPABASE_PUBLISHABLE_KEY:'fixture',ESOL_CUSTOMER_ORIGIN:'https://fixture.example.invalid',NODE_OPTIONS:'--require '+require('node:path').resolve('tests/helpers/auth-preload.js')}});try{
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',c=>reject(Error('Server exited '+c)));});const base='http://127.0.0.1:4199';
 const home=await fetch(base+'/');assert.equal(home.status,200);const text=await home.text();assert(text.includes('£29.99 one-off'));assert(!text.includes('per month'));assert(text.includes('Paid enrolment is not open yet'));assert(!text.includes('action="/billing/checkout"'));
 assert.equal((await fetch(base+'/register')).status,200);assert.equal((await fetch(base+'/billing/webhook',{method:'POST',body:'{}'})).status,503);
 const denied=await fetch(base+'/billing/checkout',{method:'POST',redirect:'manual',headers:{Origin:'https://forged.invalid'}});assert.equal(denied.status,403);
 const login=await fetch(base+'/billing/checkout',{method:'POST',redirect:'manual'});assert.equal(login.status,303);assert.equal(login.headers.get('location'),'/login');
 const course=await fetch(base+'/esol/1/assets/lessons.json',{redirect:'manual'});assert.equal(course.status,303);
 const admin=await fetch(base+'/admin/billing/restore',{method:'POST',redirect:'manual'});assert.equal(admin.status,403);
 const post=(route,email)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password:'Fixture-password-123'})});
 const recover=await post('/forgot-password','learner@example.invalid');assert.equal(recover.status,200);assert((await recover.text()).includes('Check your email'));
 const failedRecover=await post('/forgot-password','failure@example.invalid');assert.equal(failedRecover.status,503);assert((await failedRecover.text()).includes('Reset email could not be sent'));
 assert.equal((await post('/register','learner@example.invalid')).status,200);
 assert.equal((await post('/login','learner@example.invalid')).status,401,'Existing learners must reach Auth even while billing is closed');
 assert.equal((await fetch(base+'/forgot-password')).status,200);assert.equal((await fetch(base+'/health')).status,200);
 console.log('PASS: public pricing, closed checkout/registration without configuration, authenticated checkout, cross-origin rejection, private course assets, owner-only payment review, recovery page and health endpoint.');
}finally{child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
