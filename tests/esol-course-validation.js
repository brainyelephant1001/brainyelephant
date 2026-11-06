const fs=require('fs'),path=require('path');
let errors=[],total=0,seen=new Set();
const tutor=/supplied by your tutor|learner should|candidate should|tutor records|complete the supplied .* lesson and independent task/i;
for(let level=1;level<=5;level++){
 const p=path.join(__dirname,'..','esol',String(level),'assets','lessons.json');
 let data;try{data=JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){errors.push('Level '+level+': invalid JSON - '+e.message);continue}
 if(data.length!==210)errors.push('Level '+level+': expected 210 lessons, found '+data.length);
 total+=data.length;
 for(let stage=1;stage<=7;stage++){
  const rows=data.filter(x=>Number(x.stage)===stage);
  if(rows.length!==30)errors.push('Level '+level+' stage '+stage+': expected 30 lessons, found '+rows.length);
  for(const sec of ['Reading','Writing','Speaking & Listening']){
   const n=rows.filter(x=>x.section===sec).length;
   if(n!==10)errors.push('Level '+level+' stage '+stage+' '+sec+': expected 10, found '+n);
  }
 }
 for(const x of data){
  if(!x.lesson_id)errors.push('Level '+level+': missing lesson_id');
  else if(seen.has(x.lesson_id))errors.push('Duplicate lesson_id '+x.lesson_id); else seen.add(x.lesson_id);
  if(!x.title)errors.push((x.lesson_id||'unknown')+': missing title');
  if(!x.section)errors.push((x.lesson_id||'unknown')+': missing section');
  if(!x.learner_material)errors.push((x.lesson_id||'unknown')+': missing learner_material');
  if(x.stage>=3){
   if(!String(x.question||'').trim())errors.push(x.lesson_id+': missing learner question');
   if(tutor.test(String(x.question||'')))errors.push(x.lesson_id+': tutor/instruction wording in learner question');
   if(Array.isArray(x.choices)&&x.choices.length && !x.choices.includes(x.answer))errors.push(x.lesson_id+': answer not present in choices');
  }
 }
}
if(total!==1050)errors.push('Expected 1050 lessons overall, found '+total);
console.log('ESOL bank: '+total+' lessons; '+seen.size+' unique IDs.');
if(errors.length){console.error('\nFAILED '+errors.length+' checks:\n'+errors.slice(0,100).join('\n'));if(errors.length>100)console.error('... plus '+(errors.length-100)+' more');process.exit(1)}
console.log('PASS: structural course-bank validation passed.');
