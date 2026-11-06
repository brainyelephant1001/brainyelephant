const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const C=require('../../esol/core');
const {banks,openStage,openLesson,solve,watchErrors}=require('./helpers');
test('dashboard, all levels, mobile layout and search',async({page})=>{
 const errors=watchErrors(page);await page.goto('/esol/');await expect(page.getByRole('heading',{name:'English for everyday life'})).toBeVisible();await expect(page.getByRole('link',{name:'Open course',exact:true})).toHaveCount(5);
 for(let n=1;n<=5;n++){await page.goto(`/esol/${n}/`);await expect(page.getByRole('heading',{name:'Your course',exact:true})).toBeVisible();await page.getByRole('searchbox').fill('travel');await expect(page.locator('#results .lesson')).toHaveCount(21);await page.getByRole('searchbox').fill('no_such_topic');await expect(page.locator('#results')).toContainText('No lessons');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 expect(errors).toEqual([]);
});
test('wrong and blank answers, self-review, saved completion and next lesson',async({page})=>{
 const x=banks[1][0];await openStage(page,1,1);await openLesson(page,x);await solve(page,x,{gates:true});await page.locator('#nextlesson').click();await expect(page.getByRole('heading',{name:banks[1][1].title,exact:true})).toBeVisible();await page.reload();await expect(page.locator('#app')).toContainText('1 / 210');
});
test('writing draft survives reload and back navigation',async({page})=>{
 const x=banks[3].find(x=>x.section==='Writing');await openStage(page,3,1);await openLesson(page,x);const value='Draft with quotes " and <angle brackets> & an apostrophe.';await page.getByRole('textbox',{name:'Your response',exact:true}).fill(value);await page.reload();await page.locator('#stage-1').click();await openLesson(page,x);await page.locator('#previous').click();await expect(page.getByRole('textbox',{name:'Your response',exact:true})).toHaveValue(value);
});
test('audio files, playback, speed and accessible transcripts in all five levels',async({page,request})=>{
 for(let n=1;n<=5;n++){
  const x=banks[n].find(x=>x.section==='Speaking & Listening');await openStage(page,n,1);await page.getByLabel('Skill',{exact:true}).selectOption({label:x.section});await page.getByRole('button',{name:`${x.title} Stage 1 · ${x.section}`,exact:true}).click();const url=await page.getByRole('link',{name:'Download listening audio',exact:true}).getAttribute('href');const r=await request.get(url);expect(r.ok()).toBe(true);expect(r.headers()['content-type']).toContain('audio/mpeg');expect((await r.body()).length).toBeGreaterThan(5000);await page.getByText('Show transcript / accessible text',{exact:true}).click();await expect(page.locator('.material')).toHaveText(x.learner_material);await page.locator('#listen').click();await expect.poll(()=>page.locator('audio').evaluate(el=>el.currentTime)).toBeGreaterThan(0);await expect(page.locator('#speed')).toHaveAccessibleName(/Speed/);await page.locator('#speed').selectOption('0.8');expect(await page.locator('audio').evaluate(el=>el.playbackRate)).toBe(0.8);await page.locator('#stop').click();expect(await page.locator('audio').evaluate(el=>el.paused)).toBe(true);
 }
});
test('portfolio export, restore, invalid backup and assessment history',async({page},info)=>{
 const x=banks[1][0];await openStage(page,1,1);await openLesson(page,x);await solve(page,x);await page.goto('/esol/portfolio/');const event=page.waitForEvent('download');await page.locator('#export').click();const download=await event;const file=info.outputPath('backup.json');await download.saveAs(file);const data=JSON.parse(fs.readFileSync(file));expect(data.lessons[x.lesson_id].complete).toBe(true);
 await page.evaluate(()=>localStorage.clear());await page.reload();await expect(page.locator('#app')).toContainText('Entry Level 1: 0/210');await page.locator('#import').setInputFiles(file);await expect(page.locator('#import-status')).toContainText('Backup imported');await page.reload();await expect(page.locator('#app')).toContainText('Entry Level 1: 1/210');await page.locator('#import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":99}')});await expect(page.locator('#import-status')).toContainText('not a compatible');
});
for(let n=1;n<=5;n++)test(`all assessment sets, scoring and resume: level ${n}`,async({page})=>{
 test.setTimeout(180000);
 for(let variant=0;variant<3;variant++){
  const qs=C.assessment(banks[n],variant);await page.goto(`/esol/final-test/?level=${n}`);await page.getByLabel('Practice set',{exact:true}).selectOption(String(variant));await page.locator('#begin').click();await page.locator('#submit').click();await expect(page.locator('#exam-status')).toContainText('Add an answer');
  let expected=0;for(const [i,t]of qs.entries()){
   if(i===4){await page.reload();await page.locator('#resume-exam').click();await expect(page.getByRole('heading',{name:'Task 5 of 14',exact:true})).toBeVisible();}
   if(t.kind==='choice'){const answer=i%3===0?t.options.find(v=>v!==t.answer):t.answer;if(answer===t.answer)expected++;await page.getByRole('radio',{name:answer,exact:true}).check();}else await page.getByRole('textbox').fill('Automated productive response: requires human review.');
   await page.locator('#submit').click();
  }
  await expect(page.getByRole('heading',{name:`Reading: ${expected} / 12`,exact:true})).toBeVisible();await expect(page.locator('#app')).toContainText('not automatically graded');
 }
 await page.goto('/esol/portfolio/');await expect(page.locator('#app')).toContainText('3 practice assessment attempts');await expect(page.getByRole('heading',{name:'Assessment history',exact:true})).toBeVisible();
});
