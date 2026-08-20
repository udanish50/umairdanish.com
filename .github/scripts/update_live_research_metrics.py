from __future__ import annotations
import datetime as dt, html as htmlmod, json, pathlib, re, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
PATH=ROOT/'assets/data/live-research-metrics.json'
URL='https://scholar.google.com/citations?hl=en&user=vDmY-KUAAAAJ'
data=json.loads(PATH.read_text())
req=urllib.request.Request(URL,headers={
    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'Accept-Language':'en-US,en;q=0.9'
})
try:
    raw=urllib.request.urlopen(req,timeout=25).read().decode('utf-8','replace')
    text=htmlmod.unescape(raw)
    def get(label:str)->int:
        patterns=[
          rf'>{re.escape(label)}</a></td>\s*<td[^>]*class="gsc_rsb_std"[^>]*>\s*([0-9,]+)',
          rf'>{re.escape(label)}</[^>]+>.*?class="gsc_rsb_std"[^>]*>\s*([0-9,]+)'
        ]
        for p in patterns:
            m=re.search(p,text,re.I|re.S)
            if m:return int(m.group(1).replace(',',''))
        raise RuntimeError(f'Could not parse {label}')
    citations=get('Citations')
    hindex=get('h-index')
    if citations < 0 or hindex < 0: raise RuntimeError('invalid metrics')
    data['citations']=citations
    data['hindex']=hindex
    # Publication-type counts remain explicit and separate by design.
    data['journals']=10
    data['conferences']=9
    data['awards']=4
    data['updated_at']=dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
    data['source_ok']=True
    data['source']='Google Scholar profile + website publication record'
    PATH.write_text(json.dumps(data,indent=2)+"\n")
    print(f"Updated: citations={citations}, h-index={hindex}")
except Exception as e:
    # Keep the last successfully verified data rather than overwriting it with a false LIVE value.
    print(f"Scholar refresh unavailable: {e}. Preserving last verified metrics.")
