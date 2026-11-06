const {expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const banks=Object.fromEntries([1,2,3,4,5].map(n=>[n,JSON.parse(fs.readFileSync(path.join(__dirname,`../../esol/${n}/assets/lessons.json`),'utf8'))]));
async function openStage(page,n,s){await page.goto(`/esol/${n}/`);await page.getByRole('button',{name:`Open stage ${s}`,exact:true}).click();}
async function openLesson(page,x){await page.getByLabel('Skill',{exact:true}).selectOption({label:x.section});await page.getByRole('button',{name:`${x.title} Stage ${x.stage} · ${x.section}`,exact:true}).click();await expect(page.getByRole('heading',{name:x.title,exact:true})).toBeVisible();await page.locator('#start').click();}
async function solve(page,x,{gates=false}={}){
 for(const [i,t]of x.tasks.entries()){
  await expect(page.locator('legend')).toHaveText(t.prompt);
  if(gates){await page.locator('#next').click();await expect(page.locator('#feedback')).toContainText(t.kind==='choice'?'Check your answer':'Add your response');}
  if(t.kind==='choice'){
   if(gates){const wrong=t.options.find(v=>v!==t.answer);await page.getByRole('radio',{name:wrong,exact:true}).check();await page.locator('#check').click();await expect(page.locator('#feedback')).toContainText('Try again.');}
   await page.getByRole('radio',{name:t.answer,exact:true}).check();await page.locator('#check').click();await expect(page.locator('#feedback')).toContainText('Correct.');
  }else{await page.getByRole('textbox',{name:'Your response',exact:true}).fill(`Automated practice response for ${x.lesson_id}, task ${i+1}.`);await page.locator('#model').click();await expect(page.locator('#feedback')).toHaveText(t.model);}
  await page.locator('#next').click();
 }
 await expect(page.getByRole('heading',{name:'Self-review',exact:true})).toBeVisible();
 if(gates){await page.locator('#finish').click();await expect(page.locator('#finish-status')).toContainText('Complete each task');}
 for(const box of await page.getByRole('checkbox').all())await box.check();
 await page.locator('#finish').click();await expect(page.getByRole('heading',{name:'Lesson finished',exact:true})).toBeVisible();
}
function watchErrors(page){const errors=[];page.on('pageerror',e=>errors.push(e.message));return errors;}
module.exports={banks,openStage,openLesson,solve,watchErrors};
