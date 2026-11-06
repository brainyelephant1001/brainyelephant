"""Generate downloadable synthetic listening audio using FFmpeg's bundled Flite filter.
Requires ffmpeg with flite enabled. No external service, key or recording upload.
"""
from pathlib import Path
import concurrent.futures,json,subprocess,tempfile
ROOT=Path(__file__).resolve().parents[2]
def build(job):
 n,x=job;out=ROOT/'esol/audio'/f"{x['lesson_id']}.mp3";out.parent.mkdir(exist_ok=True)
 if out.exists():return
 # Read speaker names naturally; normalise digits for the English synthesiser.
 text=x['learner_material'].replace('&','and')
 import re
 text=re.sub(r'(\d{1,2}):30',r'\1 thirty',text)
 with tempfile.NamedTemporaryFile(mode='w',suffix='.txt') as f:
  f.write(text);f.flush()
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'flite=textfile={f.name}:voice=slt','-c:a','libmp3lame','-b:a','40k',str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
jobs=[]
for n in range(1,6):
 for x in json.loads((ROOT/f'esol/{n}/assets/lessons.json').read_text()):
  if x['section']=='Speaking & Listening':jobs.append((n,x))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:list(ex.map(build,jobs))
print('Generated',len(jobs),'synthetic listening MP3 files.')
