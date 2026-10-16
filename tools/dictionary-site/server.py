"""Brainy Elephant Dictionary: self-hostable, server-rendered local test.
Python 3.9+, standard library only. No external APIs, accounts or tracking.
"""
import argparse,hashlib,html,json,os,re,sqlite3,threading,time,unicodedata,webbrowser
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs,quote,unquote,urlsplit

ROOT=Path(__file__).resolve().parent
STARTER_WORDS=['meaning','dictionary','word','learning','elephant','brainy','colour','color','diamond','selfie','internet','innit','community','language','regional','research','evidence','curiosity','knowledge','resilience','empathy','serendipity','photosynthesis','galaxy','planet','orbit','gravity','light','year','future']
POS={'noun':'Noun','verb':'Verb','adj':'Adjective','adv':'Adverb','intj':'Interjection','prep':'Preposition','num':'Numeral','pron':'Pronoun','det':'Determiner','conj':'Conjunction','particle':'Particle','article':'Article','contraction':'Contraction'}

def clean(word):return unicodedata.normalize('NFC',word.strip()).casefold()
def esc(value):return html.escape(str(value),quote=True)
def word_url(word):return '/word/'+quote(word,safe='')

def build_index(data,db_path):
    data=Path(data);db_path=Path(db_path)
    manifest_bytes=(data/'manifest.json').read_bytes()
    version=hashlib.sha256(manifest_bytes).hexdigest()
    if db_path.exists():
        try:
            with sqlite3.connect(db_path) as db:
                if db.execute("SELECT value FROM metadata WHERE name='manifest_hash'").fetchone()==(version,):return
        except sqlite3.Error:pass
    db_path.parent.mkdir(parents=True,exist_ok=True)
    temporary=db_path.with_suffix('.building.sqlite3')
    if temporary.exists():temporary.unlink()
    db=sqlite3.connect(temporary)
    db.execute('PRAGMA journal_mode=OFF');db.execute('PRAGMA synchronous=OFF')
    db.executescript('CREATE TABLE words(word TEXT PRIMARY KEY, entry TEXT NOT NULL); CREATE TABLE metadata(name TEXT PRIMARY KEY,value TEXT NOT NULL);')
    total=0
    try:
        for file in sorted(data.glob('?.json')):
            shard=json.loads(file.read_text(encoding='utf-8'))
            db.executemany('INSERT INTO words VALUES(?,?)',((w,json.dumps(r,ensure_ascii=False,separators=(',',':'))) for w,r in shard.items()))
            total+=len(shard);db.commit();print('Preparing offline search:',format(total,','),'entries',flush=True)
        manifest=json.loads(manifest_bytes)
        expected=manifest.get('counts',{}).get('merged_words')
        if expected is not None and total!=expected:raise ValueError('Incomplete dictionary data; expected '+str(expected)+' entries')
        db.execute('INSERT INTO metadata VALUES(?,?)',('manifest_hash',version));db.commit()
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    finally:db.close()
    os.replace(temporary,db_path)

class Dictionary:
    def __init__(self,data,db_path):
        self.data=Path(data);self.path=Path(db_path)
        self.sources=json.loads((self.data/'sources.json').read_text(encoding='utf-8'))
        self.manifest=json.loads((self.data/'manifest.json').read_text(encoding='utf-8'))
    def connect(self):return sqlite3.connect(self.path.resolve().as_uri()+'?mode=ro',uri=True)
    def lookup(self,word):
        with self.connect() as db:r=db.execute('SELECT entry FROM words WHERE word=?',(clean(word),)).fetchone()
        return json.loads(r[0]) if r else None
    def suggest(self,query,limit=8):
        key=clean(query)
        if not key or len(key)>100:return []
        with self.connect() as db:
            return [r[0] for r in db.execute('SELECT word FROM words WHERE word>=? AND word<? ORDER BY word LIMIT ?',(key,key+'\U0010ffff',limit))]

def page(title,description,body,path='/',public_url='',indexable=False):
    canonical=f'<link rel="canonical" href="{esc(public_url+path)}">' if public_url else ''
    robots='index,follow' if indexable else 'noindex,nofollow'
    return f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(description)}"><meta name="robots" content="{robots}">{canonical}<meta name="theme-color" content="#143f35"><link rel="stylesheet" href="/static/styles.css"><script src="/static/search.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a href="/" class="brand" aria-label="Brainy Elephant dictionary home"><span class="monogram">BE</span><span>BRAINY ELEPHANT<small>THE DICTIONARY</small></span></a><nav aria-label="Main"><a href="/">Find a word</a><a href="/about">Our dictionary</a></nav></header><main id="main">{body}</main><footer><div><strong>Words belong in curious minds.</strong><p>An evolving dictionary from Brainy Elephant.</p></div><div><a href="/sources">Sources &amp; licences</a><span> • </span><a href="/about">About this test</a><p>No adverts. No analytics. No account required.</p></div></footer></body></html>'''

def search_form(value='',hero=False):
    return f'''<form class="search-form {'hero-search' if hero else ''}" action="/search" method="get"><label for="word-search">Which word are you curious about?</label><div class="search-row"><input id="word-search" name="q" value="{esc(value)}" placeholder="Type a word…" maxlength="100" autocomplete="off" required aria-describedby="search-help"><button type="submit">Find meaning <span aria-hidden="true">↗</span></button></div><p id="search-help">British English, regional words, everyday language and more.</p><ul id="suggestions" class="suggestions" aria-label="Suggested words" hidden></ul></form>'''

def source_label(source):
    return {'wordnet2025':'Open English WordNet · CC BY 4.0','wiktionary20261003':'Wiktionary contributors · CC BY-SA 4.0'}.get(source,source)

def render_entry(entry,dictionary,public_url=''):
    word=entry['word'];sections=[]
    for source in dict.fromkeys(s['source'] for s in entry['senses']):
        senses=[s for s in entry['senses'] if s['source']==source]
        items=[]
        for s in senses:
            tags=list(dict.fromkeys(s.get('usage_tags',[])+s.get('raw_usage_labels',[])))
            label=''.join(f'<span class="tag">{esc(t.replace("-"," "))}</span>' for t in tags)
            context=' '.join(s.get('definition_context',[]))
            examples=''.join(f'<blockquote>{esc(e)}</blockquote>' for e in s.get('examples',[]))
            refs=[]
            for ref in s.get('form_of',[])+s.get('alt_of',[]):
                target=ref.get('word','')
                if target and clean(target)!=word:
                    refs.append(f'<a href="{esc(word_url(clean(target)))}">Explore {esc(target)} →</a>')
            context_html='<p class="context">'+esc(context)+'</p>' if context else ''
            reference_html=' '.join(dict.fromkeys(refs))
            items.append(f'<li><div class="sense-top"><span class="pos">{esc(POS.get(s["part_of_speech"],s["part_of_speech"]))}</span>{label}</div>{context_html}<p class="definition">{esc(s["definition"])}</p>{examples}{reference_html}</li>')
        info=dictionary.sources[source]
        link=('https://en.wiktionary.org/wiki/'+quote(word,safe='')+'#English') if source=='wiktionary20261003' else 'https://en-word.net/'
        sections.append(f'<section class="source-section"><div class="section-heading"><h2>{"Wiktionary meanings" if source=="wiktionary20261003" else "WordNet meanings"}</h2><a href="{esc(link)}" rel="noopener noreferrer">View source ↗</a></div><ol class="senses">{"".join(items)}</ol><p class="source-credit">{esc(source_label(source))}. <a href="/sources">Attribution and changes</a>.</p></section>')
    body=f'''<section class="word-intro"><a class="back" href="/">← Find another word</a><div class="eyebrow">THE MEANING OF A WORD</div><h1>{esc(word)}<span class="word-dot">.</span></h1><p class="word-subtitle">Meanings, usage and a little more understanding.</p></section><div class="entry-layout"><article>{''.join(sections)}</article><aside><div class="aside-card"><span class="eyebrow">KEEP EXPLORING</span><h2>A word can have more than one meaning.</h2><p>Read the part of speech and usage labels to find the sense that fits.</p><p>Some forms refer you to a root word. Different sources may describe the same meaning differently.</p></div><div class="aside-card subtle"><h3>A living language</h3><p>Regional and historical words have a place here too. This test has no public contribution form yet.</p><a href="/about">About the project →</a></div></aside></div><section class="bottom-search">{search_form(word)}</section>'''
    description=f'Meaning of {word}: '+entry['senses'][0]['definition']
    return page(f'{word.capitalize()} meaning and definition | Brainy Elephant',description[:240],body,word_url(word),public_url,bool(public_url))

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):self.route(False)
    def do_HEAD(self):self.route(True)
    def send(self,status,content,kind='text/html; charset=utf-8',head=False,extra=None):
        payload=content.encode('utf-8') if isinstance(content,str) else content
        self.send_response(status);self.send_header('Content-Type',kind)
        self.send_header('Content-Length',str(len(payload)))
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','strict-origin-when-cross-origin')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        if not self.server.public_url:self.send_header('X-Robots-Tag','noindex, nofollow')
        for key,value in (extra or {}).items():self.send_header(key,value)
        self.end_headers()
        if not head:self.wfile.write(payload)
    def route(self,head):
        url=urlsplit(self.path);path=url.path;params=parse_qs(url.query)
        d=self.server.dictionary;base=self.server.public_url
        def html_page(title,description,body,route_path=path,status=200):
            self.send(status,page(title,description,body,route_path,base,bool(base)),head=head)
        if len(self.path)>4096:self.send(414,'Request too long','text/plain',head);return
        if path in ['/static/styles.css','/static/search.js']:
            name=path.rsplit('/',1)[1];kind='text/css; charset=utf-8' if name.endswith('.css') else 'text/javascript; charset=utf-8'
            self.send(200,(ROOT/'static'/name).read_bytes(),kind,head);return
        if path=='/robots.txt':
            text='User-agent: *\nDisallow: /\n' if not base else 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /search\nSitemap: '+base+'/sitemap.xml\n'
            self.send(200,text,'text/plain; charset=utf-8',head);return
        if path=='/sitemap.xml':
            words=[w for w in STARTER_WORDS if d.lookup(w)]
            urls=''.join('<url><loc>'+esc(base+word_url(w))+'</loc></url>' for w in words) if base else ''
            self.send(200,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>','application/xml; charset=utf-8',head);return
        if path=='/api/suggest':
            query=params.get('q',[''])[0]
            self.send(200,json.dumps(d.suggest(query)), 'application/json; charset=utf-8',head);return
        if path=='/search':
            query=clean(params.get('q',[''])[0])[:100]
            if query and d.lookup(query):self.send(303,b'',head=head,extra={'Location':word_url(query)});return
            links=''.join(f'<li><a href="{esc(word_url(w))}">{esc(w)} <span>meaning →</span></a></li>' for w in d.suggest(query))
            nearby_html='<h2>Nearby words</h2><ul class="word-links">'+links+'</ul>' if links else ''
            body=f'<section class="plain-page"><div class="eyebrow">FIND A WORD</div><h1>{"No exact match yet." if query else "What would you like to learn?"}</h1>{search_form(query)}<p>{"No entry was found for “"+esc(query)+"”. A missing entry does not mean a word is wrong." if query else "Search our combined offline dictionary."}</p>{nearby_html}</section>'
            # Search result URLs are not a second set of indexable word pages.
            self.send(200,page('Search the dictionary | Brainy Elephant','Find words and their meanings.',body,path,base,False),head=head);return
        if path.startswith('/word/'):
            query=clean(unquote(path[len('/word/'):]))
            entry=d.lookup(query) if query and len(query)<=200 else None
            if entry:
                canonical=word_url(query)
                if path!=canonical:self.send(301,b'',head=head,extra={'Location':canonical});return
                self.send(200,render_entry(entry,d,base),head=head);return
            html_page('Word not found | Brainy Elephant','This word is not in this edition.',f'<section class="plain-page"><div class="eyebrow">STILL CURIOUS?</div><h1>No entry found.</h1><p>We do not have a meaning for “{esc(query[:100])}” in this edition. It may be missing, misspelt, or a newer word.</p>{search_form(query[:100])}</section>',status=404);return
        if path=='/':
            c=d.manifest['counts'];examples=['colour','resilience','innit','serendipity','selfie']
            links=''.join(f'<a href="{word_url(w)}">{w} <span>↗</span></a>' for w in examples)
            body=f'''<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> A LITTLE CURIOSITY GOES A LONG WAY</div><h1>Every word opens<br>a new <em>world.</em></h1><p class="lead">Find a meaning. Explore a different sense. Understand a little more.</p>{search_form(hero=True)}</div><div class="hero-art" aria-hidden="true"><span class="orbit one"></span><span class="orbit two"></span><span class="art-letter">Aa<span>✦</span></span><span class="floating-label label-one">meaning /ˈmiːnɪŋ/</span><span class="floating-label label-two">a world of words ↗</span></div></section><section class="discovery"><div class="section-heading"><h2>Follow your curiosity</h2><span>A few words to begin with</span></div><div class="word-chips">{links}</div></section><section class="foundation"><div><span class="eyebrow">ONE DICTIONARY. MANY WAYS TO UNDERSTAND.</span><h2>Language keeps moving.<br>So will we.</h2><p>Everyday words, regional expressions and older meanings, brought together with visible sources.</p><a href="/about">Get to know the dictionary →</a></div><div class="stats"><div><strong>{c['merged_words']:,}</strong><span>combined dictionary entries</span></div><div><strong>{c['merged_senses']:,}</strong><span>source definition records</span></div><p>Includes phrases, names and forms. An evolving collection, not every word in English.</p></div></section>'''
            html_page('Brainy Elephant Dictionary — words, meanings & curiosity','Explore English word meanings, regional vocabulary and source definitions in the Brainy Elephant Dictionary.',body);return
        if path=='/about':
            html_page('About the dictionary | Brainy Elephant','A source-attributed, evolving English dictionary.',f'''<section class="plain-page"><div class="eyebrow">BRAINY ELEPHANT</div><h1>Made for curious minds.</h1><p class="lead">A dictionary you can explore, question and help improve in the future.</p><h2>What this test does</h2><p>Search the merged dictionary and open a separate, readable page for each entry. Titles follow the “[word] meaning and definition” pattern. Pages contain real server-rendered definitions, not just a search box that search engines cannot read.</p><h2>What we still need to build</h2><p>Reviewed community submissions, original learning examples and a carefully selected vocabulary for children. The current source collection can contain adult or offensive language, labelled where the source provides labels. A dictionary entry is not proof of game acceptance.</p><h2>Testing search visibility</h2><p>This local test is set to noindex and is not accessible to Google. A public deployment with a controlled URL is required to test indexing and rankings. A prepared sitemap contains a small starter selection of actual word pages. Neither titles nor the sitemap guarantee a place in search results.</p><a class="text-link" href="/sources">Read the source credits and licences →</a></section>''');return
        if path=='/sources':
            html_page('Sources and licences | Brainy Elephant','Dictionary attribution, source licences and our changes.','''<section class="plain-page"><div class="eyebrow">WHERE OUR WORDS COME FROM</div><h1>Clear sources.<br>Open meanings.</h1><h2>Open English WordNet 2025</h2><p>Open English WordNet contributors, derived from Princeton WordNet. Original content is licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. <a href="https://en-word.net/">Source project</a>. WordNet sense identifiers are preserved in the downloadable dictionary.</p><h2>English Wiktionary through Kaikki</h2><p>English Wiktionary contributors, extracted using Kaikki/Wiktextract on 3 October 2026 from the 2 September 2026 dump. Text is used under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Each word page links to its original Wiktionary entry; its page history identifies contributors. <a href="https://kaikki.org/dictionary/English/">Kaikki data source</a>.</p><h2>What we changed</h2><p>Selected and combined word spellings, preserved source meanings and usage labels, normalised parts of speech, and reformatted the data into searchable pages. Wiktionary quotations, examples, audio, images and etymology were not imported. Source examples retained from WordNet remain credited to that source. The adapted merged dictionary collection is CC BY-SA 4.0. Its separately licensed source material keeps the original grants.</p><h2>Site code and privacy</h2><p>The website code is MIT-licensed separately. No account, third-party analytics or external fonts are required. This test stores no submitted searches or contribution records. Normal server access logs may be shown in the console. No affiliation with the source projects or official Scrabble endorsement is claimed.</p></section>''');return
        html_page('Page not found | Brainy Elephant','Page not found.','<section class="plain-page"><h1>This page wandered off.</h1><a href="/">Back to the dictionary →</a></section>',status=404)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--data',default=str(ROOT/'data'))
    ap.add_argument('--db',default=str(ROOT/'runtime/search.sqlite3'))
    ap.add_argument('--host',default='127.0.0.1');ap.add_argument('--port',type=int,default=8765)
    ap.add_argument('--public-url',default='');ap.add_argument('--open',action='store_true')
    args=ap.parse_args();base=args.public_url.rstrip('/')
    if base:
        u=urlsplit(base)
        if u.scheme not in ['http','https'] or not u.netloc or u.path or u.query or u.fragment:ap.error('--public-url must be an http(s) origin without a path')
    if not (Path(args.data)/'manifest.json').exists():ap.error('Dictionary data folder not found: '+args.data)
    build_index(args.data,args.db)
    server=ThreadingHTTPServer((args.host,args.port),Handler);server.dictionary=Dictionary(args.data,args.db);server.public_url=base
    local='http://127.0.0.1:'+str(server.server_port)
    print('\nBrainy Elephant Dictionary ready: '+local+'\nLocal test; Google indexing disabled.' if not base else 'Serving public-configured site at '+base,flush=True)
    if args.open:threading.Timer(0.7,lambda:webbrowser.open(local)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=='__main__':main()
