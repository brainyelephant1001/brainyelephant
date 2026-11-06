'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),C=require('../esol/core.js');
let lessons=0,tasks=0,choices=0,responses=0;const ids=new Set();
for(let n=1;n<=5;n++){
 const data=C.validateBank(JSON.parse(fs.readFileSync(path.join(__dirname,`../esol/${n}/assets/lessons.json`))));
 for(const x of data){lessons++;assert(!ids.has(x.lesson_id));ids.add(x.lesson_id);const draft={answers:{},checked:{},review:{}};assert.equal(C.ready(x,draft),false);
  for(const [i,t]of x.tasks.entries()){tasks++;if(t.kind==='choice'){choices++;assert(t.options.includes(t.answer));draft.answers[i]=t.answer;draft.checked[i]=true;
   // Ground each factual key in the text. Interpretation questions are reviewed separately.
   if(t.prompt==='When is the session?'){const [day,,time]=t.answer.split(' ');assert(x.learner_material.includes(day));assert(x.learner_material.includes(time));}
   if(t.prompt==='Where should you go?')assert(x.learner_material.includes(t.answer));
   if(t.prompt==='Who can help you?')assert(x.learner_material.includes(t.answer));
   if(t.prompt==='What should you bring?')assert(x.learner_material.toLowerCase().includes(t.answer.toLowerCase().replace(/^your /,'')));
  }else{responses++;draft.answers[i]='A relevant practice response.';assert(t.model.length>10);}}
  assert.equal(C.ready(x,draft),false);x.success_check.forEach((_,i)=>draft.review[i]=true);assert.equal(C.ready(x,draft),true);
  const k=x.tasks.findIndex(t=>t.kind==='choice');if(k>=0){draft.checked[k]=false;assert.equal(C.ready(x,draft),false);draft.checked[k]=true;}
  for(const [i,t]of x.tasks.entries()){if(t.kind==='response'){const old=draft.answers[i];draft.answers[i]=' ';assert.equal(C.ready(x,draft),false);draft.answers[i]=old;}}
 }
 const sets=[0,1,2].map(v=>C.assessment(data,v));for(const set of sets){assert.equal(set.length,14);assert.equal(set.filter(t=>t.kind==='choice').length,12);assert.equal(set.filter(t=>t.kind==='response').length,2);}assert.notDeepEqual(sets[0],sets[1]);assert.notDeepEqual(sets[1],sets[2]);
}
assert.equal(ids.size,1050);assert.equal(C.esc('<img src=x onerror="bad">'), '&lt;img src=x onerror=&quot;bad&quot;&gt;');
const sample=C.empty();const id=[...ids][0];sample.lessons[id]={answers:{0:'<script>test</script>'},checked:{0:true},review:{0:true},complete:true,updated:'2026-11-06T00:00:00Z'};assert.deepEqual(C.validateImport(sample,ids),sample);assert.throws(()=>C.validateImport({version:1,lessons:{}},ids));assert.throws(()=>C.validateImport({version:2,lessons:{unknown:{}}},ids));assert.throws(()=>C.validateImport({version:2,lessons:{[id]:{answers:{0:2}}}},ids));
console.log(`PASS: ${lessons} lessons, ${tasks} tasks (${choices} choice / ${responses} written), completion gates, three assessment variants per level, import validation and escaping.`);
