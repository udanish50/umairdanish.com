(() => {
  const DATA_URL='/assets/data/scholar-metrics.json';
  const PUB_URL='/assets/data/publications.json';
  const normalize=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  const tokens=s=>new Set(normalize(s).split(/\s+/).filter(Boolean));
  function similarity(a,b){
    const A=tokens(a),B=tokens(b); if(!A.size||!B.size)return 0;
    let shared=0; A.forEach(x=>{if(B.has(x))shared++});
    return shared/Math.max(A.size,B.size);
  }
  function setAll(sel,val){document.querySelectorAll(sel).forEach(el=>el.textContent=val)}
  function number(v,fallback='—'){const n=Number(v);return Number.isFinite(n)?n.toLocaleString():fallback}
  function countPubs(publications,type){
    if(!Array.isArray(publications))return null;
    return publications.filter(p=>['Accepted','Published'].includes(p?.status) && p?.type===type).length;
  }
  function drawChart(counts){
    const svg=document.querySelector('[data-impact-chart]'); if(!svg)return;
    if(!Array.isArray(counts)||!counts.length){
      svg.innerHTML='<text x="320" y="112" text-anchor="middle" font-size="15" fill="currentColor" opacity=".65">Citation history appears after the first daily Scholar sync.</text>';
      return;
    }
    const arr=[...counts].map(x=>({year:Number(x.year),citations:Number(x.citations)||0})).filter(x=>x.year).sort((a,b)=>a.year-b.year).slice(-8);
    const max=Math.max(1,...arr.map(x=>x.citations));
    const pts=arr.map((x,i)=>[20+i*(600/Math.max(1,arr.length-1)),190-x.citations/max*150]);
    const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    const area=line+` L ${pts.at(-1)[0]} 200 L ${pts[0][0]} 200 Z`;
    const labels=arr.map((x,i)=>`<text x="${pts[i][0]}" y="216" text-anchor="middle" font-size="12" fill="currentColor">${x.year}</text>`).join('');
    svg.innerHTML='<path class="gridline" d="M20 180H620M20 130H620M20 80H620M20 30H620"/><path class="spark-area" d="'+area+'"/><path class="spark-line" d="'+line+'"/>'+labels;
  }
  function bestArticle(title,articles){
    const exact=articles.find(a=>normalize(a.title)===normalize(title)); if(exact)return exact;
    let best=null,score=0; articles.forEach(a=>{const s=similarity(title,a.title);if(s>score){best=a;score=s}});
    return score>=0.72?best:null;
  }
  function apply(data,publications=[]){
    window.__scholarData=data;
    const m=data.metrics||{}; const articles=data.articles||[];
    setAll('[data-impact-citations]',number(m.citations?.all, '157'));
    setAll('[data-impact-works]',number(m.article_count, String(articles.length||17)));
    setAll('[data-impact-hindex]',number(m.h_index?.all,'5'));
    setAll('[data-impact-i10]',number(m.i10_index?.all,'5'));
    setAll('[data-impact-journals]',number(countPubs(publications,'Journal'),'10'));
    setAll('[data-impact-conferences]',number(countPubs(publications,'Conference'),'9'));
    setAll('[data-impact-status]',data.status==='live'?'Google Scholar · daily':'Google Scholar snapshot');
    const stamp=new Date(data.updated_at||data.snapshot_at||Date.now());
    const valid=!Number.isNaN(stamp.getTime());
    setAll('[data-impact-updated]',(data.status==='live'?'Refreshed ':'Verified ')+(valid?stamp.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Aug 2026'));
    drawChart(data.citation_graph||[]);
    const latest=[...articles].filter(a=>a.year).sort((a,b)=>Number(b.year)-Number(a.year))[0];
    const latestBox=document.querySelector('[data-latest-work]');
    if(latest&&latestBox){latestBox.innerHTML=`<strong>${latest.title}</strong><p>${latest.publication||'Google Scholar'} · ${latest.year||''}</p>`;}
    document.querySelectorAll('[data-scholar-citations]').forEach(el=>{
      const title=el.dataset.title||''; const a=bestArticle(title,articles);
      if(a){
        const c=Number(a.citations)||0; el.dataset.citations=String(c);
        const prefix=el.classList.contains('live-cite')?'Citations · ':'';
        el.textContent=prefix+c.toLocaleString();
        if(a.link){el.title='Google Scholar record';}
      } else {
        el.dataset.citations='0';
        if(el.classList.contains('live-cite'))el.textContent='Citations · 0';
        else if(!el.textContent.trim()||el.textContent.includes('—'))el.textContent='0 citations';
      }
    });
    dispatchEvent(new CustomEvent('scholar:loaded',{detail:data}));
  }
  window.applyScholarMetrics=apply;
  async function load(){
    try{
      const [scholarResponse, publicationsResponse] = await Promise.all([
        fetch(DATA_URL+'?v='+Date.now(),{cache:'no-store'}),
        fetch(PUB_URL+'?v='+Date.now(),{cache:'no-store'})
      ]);
      if(!scholarResponse.ok)throw new Error('Scholar snapshot unavailable');
      const scholarData = await scholarResponse.json();
      const publications = publicationsResponse.ok ? await publicationsResponse.json() : [];
      apply(scholarData, publications);
    }catch(error){
      try{
        const publicationsResponse = await fetch(PUB_URL+'?v='+Date.now(),{cache:'no-store'});
        const publications = publicationsResponse.ok ? await publicationsResponse.json() : [];
        setAll('[data-impact-journals]',number(countPubs(publications,'Journal'),'10'));
        setAll('[data-impact-conferences]',number(countPubs(publications,'Conference'),'9'));
      }catch(_){/* ignore */}
      setAll('[data-impact-status]','Google Scholar snapshot');
      setAll('[data-impact-updated]','Verified Aug 2026');
    }
  }
  load();
})();
