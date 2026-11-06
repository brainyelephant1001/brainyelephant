"""Reproduce listening audio locally from the current scripts, using distinct synthetic voices.
Requires FFmpeg built with Flite. No external service or recording upload.
"""
from pathlib import Path
import concurrent.futures,json,subprocess,tempfile,re,hashlib,os
ROOT=Path(__file__).resolve().parents[2]
def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y']+args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def build(job):
 n,x=job;out=ROOT/'esol/audio'/f"{x['lesson_id']}.mp3";out.parent.mkdir(exist_ok=True);stamp=out.with_suffix('.sha256')
 utter=x.get('utterances') or [{'speaker':'Narrator','text':x['learner_material']}]
 digest=hashlib.sha256(('voices-slt-rms-awb-r3'+json.dumps(utter,ensure_ascii=False)).encode()).hexdigest()
 if out.exists() and stamp.exists() and stamp.read_text()==digest:return
 voices={speaker:['slt','rms','awb'][i%3] for i,speaker in enumerate(dict.fromkeys(u['speaker'] for u in utter))}
 with tempfile.TemporaryDirectory() as folder:
  folder=Path(folder);wav=[]
  for i,u in enumerate(utter):
   text=re.sub(r'(\d{1,2}):30',r'\1 thirty',u['text'].replace('&','and'));source=folder/f'{i}.txt';source.write_text(text);audio=folder/f'{i}.wav'
   run(['-f','lavfi','-i',f'flite=textfile={source}:voice={voices[u["speaker"]]}','-ar','16000','-ac','1',str(audio)]);wav.append(audio)
  listing=folder/'concat.txt';listing.write_text('\n'.join("file '"+str(p)+"'" for p in wav))
  temp=out.with_name(out.stem+'.part.mp3');run(['-f','concat','-safe','0','-i',str(listing),'-c:a','libmp3lame','-b:a','40k',str(temp)]);os.replace(temp,out);stamp.write_text(digest)
jobs=[]
for n in range(1,6):
 for x in json.loads((ROOT/f'esol/{n}/assets/lessons.json').read_text()):
  if x['section']=='Speaking & Listening':jobs.append((n,x))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for count,_ in enumerate(ex.map(build,jobs),1):
  if count%50==0:print('Audio ready:',count,'/',len(jobs),flush=True)
print('Generated/verified',len(jobs),'multi-voice listening files.',flush=True)
