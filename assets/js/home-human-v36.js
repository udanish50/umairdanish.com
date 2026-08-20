(()=>{
  'use strict';

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  /* Navigation */
  const toggle=q('.h36-menu-toggle');
  const nav=q('.h36-nav');
  const closeMenu=()=>{
    if(!toggle||!nav)return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open navigation');
    document.body.classList.remove('h36-nav-open');
  };
  toggle?.addEventListener('click',()=>{
    if(!nav)return;
    const open=!nav.classList.contains('open');
    nav.classList.toggle('open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    document.body.classList.toggle('h36-nav-open',open);
  });
  qa('.h36-nav>a').forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('resize',()=>{if(innerWidth>1120)closeMenu()},{passive:true});
  addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

  /* Whole-card interaction. Nested links keep their own destinations. */
  function activateCard(card){
    const href=card.dataset.cardHref;
    if(!href)return;
    if(/^https?:\/\//i.test(href)) window.open(href,'_blank','noopener');
    else location.href=href;
  }
  qa('[data-card-href]').forEach(card=>{
    card.addEventListener('click',e=>{
      if(e.target.closest('a,button,input,select,textarea,summary'))return;
      activateCard(card);
    });
    card.addEventListener('keydown',e=>{
      if((e.key==='Enter'||e.key===' ')&&!e.target.closest('a,button,input,select,textarea,summary')){
        e.preventDefault(); activateCard(card);
      }
    });
  });

  /* One canonical Scholar source for every citation shown on the homepage. */
  let scholarPromise=null;
  const getScholar=()=>{
    if(!scholarPromise){
      scholarPromise=fetch(`/assets/data/scholar-metrics.json?ts=${Date.now()}`,{cache:'no-store'})
        .then(r=>{if(!r.ok)throw new Error('Scholar snapshot unavailable');return r.json();});
    }
    return scholarPromise;
  };

  function putMetric(key,value){
    const n=Number(value),el=q(`[data-live-metric="${key}"]`);
    if(el&&Number.isFinite(n))el.textContent=n.toLocaleString();
  }

  async function liveMetrics(){
    const status=q('[data-live-status]');
    let scholar=null;
    try{
      scholar=await getScholar();
      const m=scholar?.metrics||{};
      putMetric('citations',m.citations?.all);
      putMetric('hindex',m.h_index?.all);
      const stamp=scholar?.updated_at?new Date(scholar.updated_at):null;
      if(status){
        status.textContent=stamp&&!Number.isNaN(stamp.valueOf())
          ?`LIVE · Google Scholar refreshed ${stamp.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`
          :'LIVE · Google Scholar auto-refresh';
      }
    }catch(_){
      if(status)status.textContent='Latest verified Scholar values · automatic refresh temporarily unavailable';
    }

    /* Publication totals come from the same first-party publication archive shown on this site. */
    try{
      const r=await fetch(`/assets/data/publications.json?ts=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw new Error('publication record unavailable');
      const pubs=await r.json(),rows=Array.isArray(pubs)?pubs:Array.isArray(pubs?.publications)?pubs.publications:[];
      putMetric('journals',rows.filter(x=>String(x?.type||'').toLowerCase()==='journal').length);
      putMetric('conferences',rows.filter(x=>String(x?.type||'').toLowerCase()==='conference').length);
    }catch(_){}

    /* Recognition count is read from the About page; the visible fallback remains 4 if markup is unavailable. */
    try{
      const r=await fetch(`/about.html?metrics=v36.1&ts=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw new Error('about unavailable');
      const html=await r.text(),doc=new DOMParser().parseFromString(html,'text/html');
      const section=[...doc.querySelectorAll('section')].find(x=>/selected awards and distinctions/i.test(x.textContent||''));
      const count=section?.querySelectorAll('.simple-list > div').length||0;
      if(count>0)putMetric('awards',count);
    }catch(_){}
  }

  /* Publication citation badges use that exact same Scholar response — no second/stale metric source. */
  async function paperCitations(){
    try{
      const d=await getScholar(),arts=Array.isArray(d?.articles)?d.articles:[];
      const patterns={
        karn:/Kolmogorov.*Arnold recurrent network/i,
        glips:/Global-local image perceptual score|GLIPS/i,
        unified:/Towards a unified evaluation framework/i
      };
      for(const [key,rx] of Object.entries(patterns)){
        const item=arts.find(x=>rx.test(String(x.title||''))),el=q(`[data-paper-citations="${key}"]`);
        if(item&&el&&Number.isFinite(Number(item.citations)))el.textContent=Number(item.citations).toLocaleString();
      }
    }catch(_){}
  }

  /* Daily Knowledge — live public Wikipedia data, graceful offline fallback. */
  async function dailyKnowledge(){
    const now=new Date();
    const day=String(now.getDate()).padStart(2,'0');
    const month=String(now.getMonth()+1).padStart(2,'0');
    const dayEl=q('[data-daily-day]'),monthEl=q('[data-daily-month]');
    if(dayEl)dayEl.textContent=String(now.getDate());
    if(monthEl)monthEl.textContent=now.toLocaleDateString(undefined,{month:'short'});
    try{
      const r=await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,{headers:{Accept:'application/json'},cache:'no-store'});
      if(!r.ok)throw new Error('wikipedia');
      const d=await r.json(),events=Array.isArray(d.events)?d.events:[];
      if(!events.length)throw new Error('empty');
      const event=events[now.getDate()%events.length];
      const title=String(event.text||'').trim();
      const page=Array.isArray(event.pages)&&event.pages[0];
      const href=page?.content_urls?.desktop?.page||page?.content_urls?.mobile?.page||'https://en.wikipedia.org/wiki/Wikipedia:On_this_day/Today';
      const year=q('[data-daily-year]'),titleEl=q('[data-daily-title]'),text=q('[data-daily-text]'),link=q('[data-daily-link]'),card=q('[data-daily-card]');
      if(year)year.textContent=String(event.year||'');
      if(titleEl)titleEl.textContent=title.length>118?`${title.slice(0,115)}…`:title;
      if(text)text.textContent=title;
      if(link)link.href=href;
      if(card)card.dataset.cardHref=href;
    }catch(_){
      const year=q('[data-daily-year]'),titleEl=q('[data-daily-title]'),text=q('[data-daily-text]');
      if(year)year.textContent='';
      if(titleEl)titleEl.textContent='A moment from history';
      if(text)text.textContent='The live Wikipedia “On this day” feed is temporarily unavailable. Open Wikipedia to explore today’s historical events.';
    }
  }

  /* GitHub LIVE badges only appear after a successful current response. */
  async function repoBadges(){
    const cards=qa('[data-github-repo]');
    await Promise.all(cards.map(async card=>{
      const repo=card.dataset.githubRepo,badge=q('.h36-repo-live',card); if(!repo||!badge)return;
      try{
        const r=await fetch(`https://api.github.com/repos/udanish50/${encodeURIComponent(repo)}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
        if(!r.ok)throw new Error('github');
        const d=await r.json(); badge.hidden=false;
        badge.title=d.pushed_at?`Live GitHub response · last push ${new Date(d.pushed_at).toLocaleDateString()}`:'Live GitHub response';
      }catch(_){badge.hidden=true;}
    }));
  }

  /* Visitor map graceful fallback. */
  function visitorMap(){
    const host=q('[data-visitor-widget]'); if(!host)return;
    const img=q('img',host),fallback=q('[data-map-fallback]',host);
    const fail=()=>{if(img)img.hidden=true;if(fallback)fallback.hidden=false};
    if(!img){fail();return;}
    img.addEventListener('error',fail,{once:true});
    if(img.complete&&img.naturalWidth===0)fail();
  }

  /* Contact utility */
  q('[data-copy-email]')?.addEventListener('click',async e=>{
    const email=e.currentTarget.dataset.copyEmail||'',status=q('.h36-copy-status');
    try{await navigator.clipboard.writeText(email);if(status)status.textContent='Email copied.'}
    catch(_){if(status)status.textContent=email;}
  });

  liveMetrics();
  paperCitations();
  dailyKnowledge();
  repoBadges();
  visitorMap();
})();
