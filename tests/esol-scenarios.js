// Targeted scenario consistency checks. These flag stated facts, not hypothetical conditions.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
function resourceConflicts(text){
 const s=text.toLowerCase(),missing=[...s.matchAll(/\b(?:my|your|the) ([a-z -]{1,40}?) (?:is|was|are|were) (?:missing|lost|unavailable)\b/g)];
 return missing.filter(m=>!/(?:if|whether)\s*$/.test(s.slice(Math.max(0,m.index-12),m.index))).map(m=>m[1].trim()).filter(item=>s.includes('bring your '+item)||s.includes('bring my '+item)||s.includes('bring the '+item));
}
assert.deepEqual(resourceConflicts('My library card is missing. Please bring your library card.'),['library card']);
assert.deepEqual(resourceConflicts('My library card is missing. Please bring your reference number.'),[]);
assert.deepEqual(resourceConflicts('If the reference is missing, ask for help. Otherwise, bring the reference.'),[]);
let passages=0;
for(let n=1;n<=5;n++)for(const x of JSON.parse(fs.readFileSync(`esol/${n}/assets/lessons.json`))){
 const texts=[['source',x.learner_material],...x.tasks.flatMap((t,i)=>[['task '+(i+1)+' source',t.material||''],['task '+(i+1)+' example',t.model||'']])];
 for(const [label,s]of texts){assert.deepEqual(resourceConflicts(s),[],`${x.lesson_id} ${label}: unavailable item requested`);passages++;}
 if(x.topic==='Public information'){
  const source=x.learner_material;
  assert(!/bring your library card/i.test(source),`${x.lesson_id}: library source still requires the missing card`);
  if(x.section==='Speaking & Listening')assert.equal(source,x.utterances.map(u=>u.speaker+': '+u.text).join('\n'),'Transcript must match utterances');
 }
 if(n===1&&x.section==='Writing'){
  assert(!x.tasks.some(t=>/^Plan your response: identify the reader/.test(t.prompt)),'Complex generic planning instruction in Entry 1');
  assert(!x.tasks.some(t=>/^Edit your response\. Quote/.test(t.prompt)),'Complex generic editing instruction in Entry 1');
 }
}
console.log(`PASS: ${passages} source/example passages checked for missing-resource contradictions across all five levels; Entry 1 planning/editing instructions and library transcript consistency checked.`);
