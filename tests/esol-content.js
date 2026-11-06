// Content guardrails complement browser checks. They do not certify learner proficiency.
const fs=require('node:fs'),assert=require('node:assert/strict'),C=require('../esol/core');
const all=[1,2,3,4,5].flatMap(n=>JSON.parse(fs.readFileSync(`esol/${n}/assets/lessons.json`)).map(x=>({...x,level:n})));
assert.equal(all.length,1050);assert.equal(new Set(all.map(x=>x.unit_id)).size,105);
const baseline=JSON.parse(fs.readFileSync('tools/esol/curriculum/criteria-index.json'));
const coverage=new Set(all.flatMap(x=>x.criteria.map(c=>`${x.level}|${x.section}|${c}`)));
for(const u of baseline){const section={R:'Reading',W:'Writing',SL:'Speaking & Listening'}[u.section];for(const c of u.criteria)assert(coverage.has(`${u.level}|${section}|${c}`),`No planned activity: ${u.level} ${section} ${c}`);}
let formCount=0,sourceChecks=0;
for(const x of all){assert(x.learn.split(/\s+/).length>=25,x.lesson_id);assert.equal(typeof x.worked_example,'string',x.lesson_id);assert(x.guided_practice.length>50);assert(x.review_rubric.length>=5);assert(x.criteria.length);
 for(const t of x.tasks){
  if(t.kind==='choice'&&t.basis==='source'&&t.evidence){assert(x.learner_material.toLowerCase().includes(t.evidence.toLowerCase()),`${x.lesson_id}: missing source evidence: ${t.evidence}`);sourceChecks++;}
  if(t.kind==='form'){for(const f of t.fields)if(f.expected)assert(x.learner_material.includes(f.expected),'Form detail not supplied: '+x.lesson_id+' '+f.id);formCount++;const vals=Object.fromEntries(t.fields.map(f=>[f.id,f.example]));assert.equal(C.formErrors(t,JSON.stringify(vals)).length,0);assert(C.formErrors(t,'{}').length>0);if(vals.email){delete vals.email;assert(C.formErrors(t,JSON.stringify(vals)).some(e=>e.includes('email')));}}
 }
 if(x.section==='Writing'){const hasForm=x.tasks.some(t=>t.kind==='form');const main=x.tasks.filter(t=>t.kind==='response').slice(-2)[0];assert(hasForm===/practice form|conditional fields/i.test(main.prompt),'Form prompt/model routing: '+x.lesson_id);}
 if(x.section==='Reading'){const independent=x.tasks[x.tasks.length-1];assert(independent.material&&(x.lesson_id.startsWith('BE3-E1-R-S1-')||independent.material!==x.learner_material),'Missing reading source: '+x.lesson_id);}
 if(x.section==='Speaking & Listening'){assert(x.utterances.length>=3);assert(new Set(x.utterances.map(u=>u.speaker)).size>=2);assert(x.tasks.some(t=>t.spoken));}
}
assert.equal(formCount,50);
const model=n=>all.filter(x=>x.level===n&&x.section==='Writing').map(x=>x.tasks.filter(t=>t.kind==='response').slice(-2)[0].model);
for(const [a,b]of [[2,3],[3,4],[4,5]]){const aa=model(a),bb=model(b);assert(aa.filter((v,i)=>v===bb[i]).length<15,'Writing models do not progress.');}
for(let n=1;n<=5;n++){const bank=all.filter(x=>x.level===n);for(let v=0;v<3;v++){const exam=C.assessment(bank,v);assert.equal(exam.filter(t=>t.component==='Listening').length,8);assert.equal(exam.filter(t=>t.component==='Language').length,8);assert(exam.filter(t=>t.component==='Listening').every(t=>t.audio_id));}}
console.log(`PASS: 105 teaching units, ${coverage.size} planned criterion links, ${formCount} conditional/form activities, ${sourceChecks} source-evidence checks, level progression and balanced practice tests.`);
