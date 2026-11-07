const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
let count=0;for(let n=1;n<=5;n++){const data=JSON.parse(fs.readFileSync(path.join(__dirname,`../esol/${n}/assets/lessons.json`)));for(const x of data.filter(x=>x.section==='Speaking & Listening')){const file=path.join(__dirname,'../esol/audio',x.lesson_id+'.mp3');assert(fs.existsSync(file),file);assert(fs.statSync(file).size>5000,file);count++;}}
assert.equal(count,350);console.log('PASS: all 350 listening lessons have non-empty MP3 files.');
