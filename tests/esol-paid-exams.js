'use strict';
const assert=require('node:assert/strict'),{questionSet,safeQuestion,cleanAnswers,scoreReport,createExams}=require('../private-esol/exams');
(async()=>{const questions=questionSet(0);assert.equal(questions.length,130);assert.equal(questions.filter(q=>q.kind==='choice').length,120);for(let n=1;n<=5;n++)assert.equal(questions.filter(q=>q.level===n).length,26);
 for(const q of questions){const safe=safeQuestion(q);for(const field of ['answer','model','explanation','evidence','basis'])assert(!(field in safe),'Do not send answer keys during the final test');}
 assert.throws(()=>cleanAnswers(questions,{score:'100'}));assert.throws(()=>cleanAnswers(questions,{0:'invented answer'}));
 const id='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',user={id:'learner'},a={attempt_id:id,purchase_id:'cs_first',user_id:user.id,learner_name:'Sample Learner',bank_version:'fixture',questions,answers:{},answer_revision:0,status:'in_progress'};
 questions.forEach((q,i)=>a.answers[i]=q.kind==='choice'?q.answer:'Practice response, not a proficiency grade.');let report=scoreReport(a,()=>1800000000000);assert.equal(report.correct,120);assert.equal(report.total,120);assert.equal(report.productive_answered,10);assert.equal(report.percentage,100);assert(report.disclaimer.includes('not an accredited certificate'));
 const blank=scoreReport({...a,answers:{}},()=>1800000000000);assert.equal(blank.correct,0);assert.equal(blank.unanswered,120);assert.equal(blank.productive_answered,0);
 let purchaseStatus='paid',credits=1,issued=false,held=false;const records=[a];
 const billing={configured:true,purchases:async()=>[{checkout_session_id:'cs_first',status:purchaseStatus}],attempts:async()=>records,rows:async table=>table==='be_esol_payment_blocks'?(held?[{active:true}]:[]):[{status:purchaseStatus}],db:async(path,method,body)=>{
  if(path.startsWith('be_esol_paid_attempts?'))return path.includes('user_id=eq.learner')&&path.includes('attempt_id=eq.'+id)?[a]:[];
  if(path==='rpc/be_esol_start_final'){if(a.status==='in_progress'&&issued)return a;if(!credits)return {error:'payment_required'};issued=true;return a;}
  if(path==='rpc/be_esol_save_final'){assert.equal(body.p_user,user.id);Object.assign(a.answers,body.p_answers);a.answer_revision++;return a;}
  if(path==='rpc/be_esol_finish_final'){assert.equal(body.p_user,user.id);assert.equal(body.p_revision,a.answer_revision);a.status='completed';a.report=body.p_report;credits--;return a;}
  throw Error(path);
 }};
 const exam=createExams({billing,clock:()=>1800000000000,variant:()=>0});await exam.start(user,'Sample Learner');assert.equal((await exam.start(user,'Changed name')).attempt_id,id,'An interrupted test resumes the same purchase');
 await assert.rejects(()=>exam.load({id:'other'},id),e=>e.status===404);await assert.rejects(()=>exam.load(user,other),e=>e.status===404);
 held=true;await assert.rejects(()=>exam.load(user,id),e=>e.code==='payment_unavailable');await assert.rejects(()=>exam.save(user,id,{0:questions[0].answer}),e=>e.code==='payment_unavailable');held=false;
 const publicData=await exam.load(user,id);assert(!('answer' in publicData.questions[0]));
 const completed=await exam.finish(user,id);assert.equal(completed.correct,120);assert.equal(await exam.finish(user,id),completed,'Repeating Finish returns the same report');await assert.rejects(()=>exam.save(user,id,{0:questions[0].answer}),e=>e.code==='completed');await assert.rejects(()=>exam.start(user,'New run'),e=>e.code==='payment_required');
 purchaseStatus='refunded';assert.equal((await exam.report(user,id)).correct,120,'Completed reports remain downloadable without another payment');assert.equal((await exam.load(user,id)).status,'completed');
 console.log('PASS: all-five-level final test (130 prompts / 120 checked), server scoring, answer-key hiding, owner checks, resumable attempts, immutable completed reports, no free restart and report access after consumption/refund.');
})().catch(e=>{console.error(e);process.exitCode=1});
