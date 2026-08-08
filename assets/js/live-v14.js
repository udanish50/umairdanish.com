(() => {
  'use strict';
  const PUBS='/assets/data/publications.json';
  const SCHOLAR='/assets/data/scholar-metrics.json';
  const GITHUB='https://api.github.com/users/udanish50/repos?type=owner&sort=updated&direction=desc&per_page=100';
  const COUNTER='https://api.counterapi.dev/v1/umairdanish-com-paper-views';
  const PYPI='https://pypi.org/pypi/midipy/json';
  const PYPISTATS='https://pypistats.org/api/packages/midipy/recent';

  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalize=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  const tokens=s=>new Set(normalize(s).split(/\s+/).filter(Boolean));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const monthKey=()=>{const d=new Date();return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`};
  const dayKey=()=>new Date().toISOString().slice(0,10);
  const monthLabel=()=>new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const cacheGet=(key,maxAge)=>{try{const raw=sessionStorage.getItem(key)||localStorage.getItem(key);if(!raw)return null;const obj=JSON.parse(raw);if(Date.now()-obj.time>maxAge)return null;return obj.value}catch(_){return null}};
  const cacheSet=(key,value,persist=false)=>{try{(persist?localStorage:sessionStorage).setItem(key,JSON.stringify({time:Date.now(),value}))}catch(_){}};
  const fetchJSON=async(url,opts={})=>{const r=await fetch(url,{cache:'no-store',...opts});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()};

  function similarity(a,b){
    const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;
    let shared=0;A.forEach(x=>{if(B.has(x))shared++});
    return shared/Math.max(A.size,B.size);
  }
  function bestPublication(article,pubs){
    const exact=pubs.find(p=>normalize(p.title)===normalize(article.title));if(exact)return exact;
    let best=null,score=0;pubs.forEach(p=>{const s=similarity(article.title,p.title);if(s>score){score=s;best=p}});
    return score>=0.68?best:null;
  }
  function relativeTime(value){
    if(!value)return 'recently';
    const ms=Date.now()-new Date(value).getTime();if(!Number.isFinite(ms))return 'recently';
    const days=Math.max(0,Math.floor(ms/86400000));
    if(days===0)return 'today';if(days===1)return '1 day ago';if(days<30)return `${days} days ago`;
    const months=Math.floor(days/30);return months===1?'1 month ago':`${months} months ago`;
  }
  function counterValue(json){return n(json?.value ?? json?.count ?? json?.data?.value ?? json?.data?.count)}
  async function getCounter(slug){
    const name=`${monthKey()}--${slug}`;
    try{return counterValue(await fetchJSON(`${COUNTER}/${encodeURIComponent(name)}/`))}catch(_){return 0}
  }
  async function incrementPaperView(){
    const m=location.pathname.match(/^\/publications\/([^/]+)\/?$/);if(!m)return;
    const slug=decodeURIComponent(m[1]);
    const name=`${monthKey()}--${slug}`;
    const storageKey=`ud-v14-paper-view:${dayKey()}:${name}`;
    try{if(localStorage.getItem(storageKey))return}catch(_){ }
    try{
      await fetchJSON(`${COUNTER}/${encodeURIComponent(name)}/up`);
      try{localStorage.setItem(storageKey,'1')}catch(_){ }
    }catch(_){ }
  }
  async function mapLimit(items,limit,fn){
    const out=new Array(items.length);let next=0;
    async function worker(){while(next<items.length){const i=next++;try{out[i]=await fn(items[i],i)}catch(_){out[i]=0}}}
    await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return out;
  }

  function renderRows(root,items,kind){
    if(!root)return;
    const max=Math.max(1,...items.map(x=>n(x.value)));
    root.innerHTML=items.map((x,i)=>`<a class="v14-rank-row ${kind==='views'?'v14-trending-row':''}" href="${esc(x.href)}"><span class="v14-rank-number">${String(i+1).padStart(2,'0')}</span><span class="v14-rank-main"><span class="v14-rank-title">${esc(x.title)}</span><span class="v14-rank-track" aria-hidden="true"><span class="v14-rank-fill" style="width:${Math.max(x.value?4:0,(n(x.value)/max)*100).toFixed(1)}%"></span></span></span><span class="v14-rank-value">${n(x.value).toLocaleString()}<small>${kind==='views'?'visits':'citations'}</small></span></a>`).join('');
  }

  async function citationLeaderboard(pubs){
    const root=qs('[data-v14-citation-list]');if(!root)return;
    try{
      const scholar=window.__scholarData || await fetchJSON(SCHOLAR+'?v='+Date.now());
      const items=(scholar.articles||[]).map(a=>({article:a,pub:bestPublication(a,pubs)})).filter(x=>n(x.article.citations)>0).sort((a,b)=>n(b.article.citations)-n(a.article.citations)).slice(0,5).map(x=>({title:x.pub?.title||x.article.title,value:n(x.article.citations),href:x.pub?`/publications/${x.pub.slug}/`:(x.article.link||'/publications.html')}));
      renderRows(root,items,'citations');
      const stamp=qs('[data-v14-citation-updated]');
      if(stamp){const d=new Date(scholar.updated_at||Date.now());stamp.textContent=`Google Scholar · ${Number.isNaN(d.getTime())?'live':`updated ${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`}`}
    }catch(_){root.innerHTML='<p class="v14-trending-empty">Citation data will appear after the next Scholar refresh.</p>'}
  }

  async function trendingPapers(pubs){
    const root=qs('[data-v14-trending-list]');if(!root)return;
    const label=qs('[data-v14-trending-month]');if(label)label.textContent=monthLabel();
    const counts=await mapLimit(pubs,5,p=>getCounter(p.slug));
    const ranked=pubs.map((p,i)=>({title:p.title,href:`/publications/${p.slug}/`,value:n(counts[i])})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,5);
    if(!ranked.length){root.innerHTML='<p class="v14-trending-empty">Live paper-view collection has started. This ranking will populate as readers visit publication pages.</p>';return}
    renderRows(root,ranked,'views');
  }

  function repoNameFromUrl(url){try{const u=new URL(url);const parts=u.pathname.split('/').filter(Boolean);return parts[1]||''}catch(_){return ''}}
  async function githubRepos(){
    const cached=cacheGet('v14-github-repos',20*60*1000);if(cached)return cached;
    const data=await fetchJSON(GITHUB,{headers:{Accept:'application/vnd.github+json'}});cacheSet('v14-github-repos',data);return data;
  }
  async function latestRelease(name){
    const key=`v14-release-${name}`;const cached=cacheGet(key,60*60*1000);if(cached!==null)return cached;
    try{const r=await fetchJSON(`https://api.github.com/repos/udanish50/${encodeURIComponent(name)}/releases/latest`,{headers:{Accept:'application/vnd.github+json'}});const value=r.tag_name||r.name||'';cacheSet(key,value);return value}catch(_){cacheSet(key,'');return ''}
  }
  async function pypiData(){
    const cached=cacheGet('v14-pypi-midipy',6*60*60*1000);if(cached)return cached;
    const out={version:'—',downloads:null};
    try{const d=await fetchJSON(PYPI);out.version=d?.info?.version||'—'}catch(_){ }
    try{const d=await fetchJSON(PYPISTATS);out.downloads=n(d?.data?.last_month)}catch(_){ }
    cacheSet('v14-pypi-midipy',out,true);return out;
  }

  async function softwareAndGithub(pubs){
    const codeRepos=[...new Set(pubs.map(p=>p.code).filter(Boolean).filter(u=>u.includes('github.com/udanish50/')))];
    qsa('[data-v14-code-repos]').forEach(el=>el.textContent=String(codeRepos.length));
    const implementations=codeRepos.filter(u=>repoNameFromUrl(u).toLowerCase()!=='midipy').length;
    qsa('[data-v14-implementations]').forEach(el=>el.textContent=String(implementations));
    qsa('[data-v14-publication-total]').forEach(el=>el.textContent=String(pubs.filter(p=>['Accepted','Published'].includes(p.status)).length));
    const pypi=await pypiData();
    qsa('[data-v14-midipy-version]').forEach(el=>el.textContent=pypi.version||'—');
    qsa('[data-v14-midipy-downloads]').forEach(el=>el.textContent=pypi.downloads===null?'—':pypi.downloads.toLocaleString());

    const grid=qs('[data-v14-github-grid]');
    if(!grid)return;
    try{
      const repos=await githubRepos();
      const allowed=new Set(codeRepos.map(repoNameFromUrl).map(x=>x.toLowerCase()));
      const selected=repos.filter(r=>allowed.has(String(r.name).toLowerCase())).sort((a,b)=>new Date(b.pushed_at||b.updated_at)-new Date(a.pushed_at||a.updated_at)).slice(0,4);
      const releases=await Promise.all(selected.map(r=>latestRelease(r.name)));
      grid.innerHTML=selected.map((r,i)=>`<a class="v14-repo-card" href="${esc(r.html_url)}" target="_blank" rel="noopener"><span class="v14-repo-top"><strong class="v14-repo-name">${esc(r.name)}</strong><span class="v14-repo-live">Live</span></span><p class="v14-repo-desc">${esc(r.description||'Research implementation and reproducible code.')}</p><span class="v14-repo-meta"><span>${esc(r.language||'Code')}</span><span>★ ${n(r.stargazers_count).toLocaleString()}</span><span>Updated ${esc(relativeTime(r.pushed_at||r.updated_at))}</span></span>${releases[i]?`<span class="v14-repo-release">Latest release · ${esc(releases[i])}</span>`:''}<span class="v14-repo-arrow">Code ↗</span></a>`).join('');
      const latest=qs('[data-v14-latest-code]');if(latest&&selected[0])latest.textContent=`${selected[0].name} · ${relativeTime(selected[0].pushed_at||selected[0].updated_at)}`;
      const live=qs('[data-v14-github-status]');if(live)live.textContent='Live · GitHub';
    }catch(_){
      const live=qs('[data-v14-github-status]');if(live)live.textContent='GitHub temporarily unavailable';
    }
  }

  async function init(){
    incrementPaperView();
    const needsData=qs('[data-v14-citation-list], [data-v14-trending-list], [data-v14-github-grid], [data-v14-code-repos], [data-v14-publication-total]');
    if(!needsData)return;
    let pubs=[];try{pubs=await fetchJSON(PUBS+'?v='+Date.now())}catch(_){return}
    citationLeaderboard(pubs);
    trendingPapers(pubs);
    softwareAndGithub(pubs);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
