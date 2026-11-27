const {JSDOM,VirtualConsole}=require('./tools/testdom/node_modules/jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
async function run(correct){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('navigation'))errors.push(e.message)});
 const dom=new JSDOM(html,{url:'https://appassets.androidplatform.net/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.fetch=()=>{throw Error('Unexpected network request')}}});
 const w=dom.window,d=w.document,click=id=>d.getElementById(id).click();
 const Q=w.eval('Q');assert.equal(Q.length,30);click('anonymous');
 for(let i=0;i<Q.length;i++){
  assert.equal(d.getElementById('progressText').textContent,`Question ${i+1} of 30`);
  const q=Q[i];assert.ok(q[4]>=0&&q[4]<q[3].length);assert.ok(q[5].length>10);
  const buttons=d.querySelectorAll('.answer');buttons[correct?q[4]:(q[4]+1)%q[3].length].click();
  assert.equal(d.getElementById('progressTrack').getAttribute('aria-valuenow'),String(i+1));
  assert.equal(d.getElementById('next').textContent,i===Q.length-1?'See results':'Next question');
  assert.ok([...buttons].every(b=>b.disabled));
  assert.equal(d.getElementById('explanation').textContent,q[5]);
  assert.equal(d.querySelectorAll('.answer.correct').length,1);click('next');
 }
 assert.match(d.getElementById('scoreLine').textContent,correct?/30 \/ 30 correct/:/0 \/ 30 correct/);
 click('toFeedback');
 if(correct){click('sendFeedback');assert.match(d.getElementById('feedbackStatus').textContent,/Please answer/);
  for(const g of ['pace','helpful','searchMore','interest','hardAt','again'])d.querySelector(`input[name="${g}"]`).checked=true;
  click('sendFeedback');await new Promise(r=>setImmediate(r));assert.ok(w.localStorage.getItem('lyl-feedback'));
 }else {click('skipFeedback');await new Promise(r=>setImmediate(r));}
 assert.ok(!d.getElementById('thanks').classList.contains('hidden'));assert.deepEqual(errors,[]);dom.window.close();
}
(async()=>{await run(true);await run(false);console.log('PASS: 30 correct + 30 incorrect answers; explanations, Next, scoring, feedback validation, local save and skip; no network requests. Layout/device tests remain outstanding.');})().catch(e=>{console.error(e);process.exit(1)});
