"""Export a small server-rendered static public trial for existing GitHub Pages."""
import http.client,json,re,shutil,sys,threading
from pathlib import Path
import server

def export(data,db_path,checkout):
    checkout=Path(checkout);out=checkout/'dictionary';out.mkdir(exist_ok=True)
    dictionary=server.Dictionary(data,db_path)
    words=[w for w in server.STARTER_WORDS if dictionary.lookup(w)]
    # Include linked roots/variants so the test does not send readers to missing pages.
    for word in list(words):
        for sense in dictionary.lookup(word)['senses']:
            for ref in sense.get('form_of',[])+sense.get('alt_of',[]):
                target=server.clean(ref.get('word',''))
                if target and target not in words and dictionary.lookup(target):words.append(target)
    words=sorted(set(words));index=[{'word':w,'url':'/dictionary'+server.word_url(w)+'/'} for w in words]
    srv=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
    srv.dictionary=dictionary;srv.public_url='https://brainyelephant.com/dictionary'
    thread=threading.Thread(target=srv.serve_forever,daemon=True);thread.start()
    def get(path):
        c=http.client.HTTPConnection('127.0.0.1',srv.server_port,timeout=10);c.request('GET',path)
        r=c.getresponse();text=r.read().decode();assert r.status==200,(path,r.status);c.close();return text
    def transform(text):
        # Convert known word links to real exported pages; preserve wording for
        # unexported references without creating misleading links.
        def word_link(match):
            href=match.group(1);label=match.group(2)
            from urllib.parse import unquote
            word=unquote(href[len('/word/'):])
            return '<a href="/dictionary'+href+'/">'+label+'</a>' if word in words else '<span>'+label+'</span>'
        text=re.sub(r'<a href="(/word/[^"]+)">(.*?)</a>',word_link,text)
        for key in ['href','src','action']:
            text=re.sub(key+r'="/(?!dictionary/)([^"]*)"',lambda m:key+'="/dictionary/'+m.group(1)+'"',text)
        for route in ['about','sources']:
            text=text.replace('/dictionary/'+route+'"','/dictionary/'+route+'/"')
        text=text.replace('action="/dictionary/search"','action="/dictionary/search.html"')
        text=re.sub(r'(<link rel="canonical" href="https://brainyelephant.com/dictionary[^\"]*?)(?<!/)(">)',r'\1/\2',text)
        text=text.replace('British English, regional words, everyday language and more.',f'Public preview: {len(words)} word pages. Try colour, meaning or innit.')
        text=text.replace('combined dictionary entries','entries in our full collection')
        text=text.replace('source definition records',f'source definition records · {len(words)} pages in this preview')
        text=text.replace('This local test is set to noindex and is not accessible to Google. A public deployment with a controlled URL is required to test indexing and rankings.','This is a small public preview on brainyelephant.com. Its word pages are accessible to search engines; indexing and ranking take time and are not guaranteed.')
        text=text.replace('The current source collection can contain adult or offensive language, labelled where the source provides labels.','The full source collection can contain adult or offensive language, labelled where the source provides labels; this preview offers a small selected vocabulary.')
        return text
    try:
        (out/'index.html').write_text(transform(get('/')),encoding='utf-8')
        for route in ['about','sources']:
            (out/route).mkdir(exist_ok=True);(out/route/'index.html').write_text(transform(get('/'+route)),encoding='utf-8')
        for word in words:
            folder=out/'word'/word;folder.mkdir(parents=True,exist_ok=True)
            (folder/'index.html').write_text(transform(get(server.word_url(word))),encoding='utf-8')
        search=transform(get('/search'))
        search=search.replace('Search our combined offline dictionary.',f'This public preview contains {len(words)} word pages from our larger dictionary.')
        search=search.replace('<section class="plain-page">','<section class="plain-page"><p id="search-status" role="status"></p>',1)
        (out/'search.html').write_text(search,encoding='utf-8')
    finally:srv.shutdown();srv.server_close();thread.join()
    (out/'static').mkdir(exist_ok=True)
    shutil.copy2(server.ROOT/'static/styles.css',out/'static/styles.css')
    (out/'static/word-index.json').write_text(json.dumps(index,ensure_ascii=False),encoding='utf-8')
    (out/'static/search.js').write_text(STATIC_JS,encoding='utf-8')
    urls=['https://brainyelephant.com/dictionary/']+['https://brainyelephant.com'+r['url'] for r in index]
    sitemap='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+server.esc(u)+'</loc></url>' for u in urls)+'</urlset>'
    (out/'sitemap.xml').write_text(sitemap)
    (checkout/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://brainyelephant.com/dictionary/sitemap.xml</loc></sitemap></sitemapindex>')
    (checkout/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://brainyelephant.com/sitemap.xml\n')
    for name in ['CC-BY-SA-4.0.txt','WORDNET_LICENSE.md','WORDNET_WNDB_License.txt']:
        f=Path(data).parent/name
        if f.exists():shutil.copy2(f,out/name)
    homepage=checkout/'index.html';text=homepage.read_text()
    if 'href="/dictionary/"' not in text:text=text.replace('<nav>','<nav>\n<a href="/dictionary/">Dictionary</a>',1)
    homepage.write_text(text)
    print('EXPORTED',len(words),'word pages and search, sitemap and credits',flush=True)

STATIC_JS="""(()=>{'use strict';const input=document.querySelector('#word-search'),box=document.querySelector('#suggestions'),form=document.querySelector('.search-form');if(!input||!box||!form)return;let words=[];const ready=fetch('/dictionary/static/word-index.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{words=data;return data});const normal=s=>s.trim().toLocaleLowerCase('en-GB');const show=()=>{const q=normal(input.value);box.replaceChildren();if(q.length<2){box.hidden=true;return}for(const item of words.filter(x=>x.word.startsWith(q)).slice(0,8)){const li=document.createElement('li'),a=document.createElement('a');a.href=item.url;a.textContent=item.word;li.append(a);box.append(li)}box.hidden=!box.children.length};const search=async(event)=>{event?.preventDefault();await ready;const q=normal(input.value),match=words.find(x=>x.word===q);if(match){location.assign(match.url);return}let status=document.querySelector('#search-status');if(!status){status=document.createElement('p');status.id='search-status';status.setAttribute('role','status');form.after(status)}status.textContent='No exact match in this public preview for “'+input.value.trim()+'”. Explore a suggestion or try colour, meaning, learning or innit.';show()};input.addEventListener('input',()=>ready.then(show));form.addEventListener('submit',search);const q=new URLSearchParams(location.search).get('q');if(q){input.value=q;search()}document.addEventListener('click',e=>{if(!e.target.closest('.search-form'))box.hidden=true});input.addEventListener('keydown',e=>{if(e.key==='Escape')box.hidden=true;if(e.key==='ArrowDown'&&!box.hidden){e.preventDefault();box.querySelector('a')?.focus()}});ready.catch(()=>{const status=document.querySelector('#search-status');if(status)status.textContent='Search is temporarily unavailable. Use the word links on the dictionary home page.'})})();"""

if __name__=='__main__':export(*sys.argv[1:])
