const {test,expect}=require('@playwright/test');
const {banks,openStage,openLesson,solve,watchErrors}=require('./helpers');
// The sweep uses genuine UI controls for every task; it never calls course functions
// or inserts completion flags. Keys exercise functionality, not independent pedagogy.
for(let n=1;n<=5;n++)for(let s=1;s<=7;s++){
 test(`all lessons: level ${n}, stage ${s} (30 lessons)`,async({page},info)=>{
  test.setTimeout(240000);const errors=watchErrors(page),rows=banks[n].filter(x=>x.stage===s);
  await openStage(page,n,s);
  for(const x of rows){await test.step(x.lesson_id,async()=>{await openLesson(page,x);await solve(page,x);await page.locator('#return').click();});}
  await page.reload();await expect(page.locator('#app')).toContainText('30 / 210');
  expect(errors).toEqual([]);await info.attach('coverage',{body:JSON.stringify({lessonIds:rows.map(x=>x.lesson_id),tasks:rows.reduce((v,x)=>v+x.tasks.length,0)},null,2),contentType:'application/json'});
 });
}
