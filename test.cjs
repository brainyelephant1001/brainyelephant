const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
(async()=>{
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const html = fs.readFileSync('app/src/main/assets/index.html','utf8');
const errors=[];
let requests=0;
for (const [width,height,mode] of [[360,640,'correct'],[320,568,'wrong']]) {
 const context=await browser.newContext({viewport:{width,height},offline:true});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://appassets.androidplatform.net/',route=>route.fulfill({contentType:'text/html',body:html}));
 page.on('request',r=>{if(r.url()!=='https://appassets.androidplatform.net/')requests++});
 await page.goto('https://appassets.androidplatform.net/');
 const questions=await page.evaluate(()=>Q);
 assert.equal(questions.length,30);
 await page.getByRole('button',{name:'Continue anonymously',exact:true}).click();
 for(let n=0;n<30;n++){
  assert.equal(await page.locator('#progressText').textContent(),`Question ${n+1} of 30`);
  const q=questions[n],chosen=mode==='correct'?q[4]:(q[4]+1)%q[3].length;
  await page.locator('.answer').nth(chosen).click();
  assert.equal(await page.locator('.answer:disabled').count(),q[3].length);
  assert.equal(await page.locator('#explanation').textContent(),q[5]);
  await page.getByRole('button',{name:n===29?'See results':'Next question',exact:true}).click();
 }
 assert.match(await page.locator('#scoreLine').textContent(),mode==='correct'?/30 \/ 30 correct/:/0 \/ 30 correct/);
 await page.getByRole('button',{name:'Continue to feedback'}).click();
 if(mode==='correct'){
  await page.getByRole('button',{name:'Save feedback on this device'}).click();
  assert.match(await page.locator('#feedbackStatus').textContent(),/Please answer/);
  for(const group of ['pace','helpful','searchMore','interest','hardAt','again'])await page.locator(`input[name="${group}"]`).first().check();
  await page.getByRole('button',{name:'Save feedback on this device'}).click();
  assert.ok(await page.evaluate(()=>localStorage.getItem('lyl-feedback')));
 }else await page.getByRole('button',{name:'Skip feedback'}).click();
 await page.getByRole('button',{name:'Try again'}).click();
 assert.ok(await page.locator('#welcome').isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 if(mode==='correct') {fs.mkdirSync('dist',{recursive:true});await page.screenshot({path:'dist/phone-preview.png'});}
 await context.close();
}
assert.deepEqual(errors,[]);assert.equal(requests,0);
await browser.close();console.log('PASS: all 30 correct and incorrect paths, explanations, scores, feedback validation/save/skip, restart, two phone sizes, offline/no network.');
})().catch(e=>{console.error(e);process.exit(1)});
