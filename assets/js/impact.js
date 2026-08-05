
(() => {
  const ORCID='0009-0005-5728-3587';
  const MAIL='mdanish3@uwo.ca';
  const CACHE='ud-openalex-v2';
  const TTL=12*60*60*1000;
  const normalize=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  function setAll(sel,val){document.querySelectorAll(sel).forEach(el=>el.textContent=val)}
  function hIndex(works){const c=works.map(w=>w.cited_by_count||0).sort((a,b)=>b-a);let h=0;c.forEach((v,i)=>{if(v>=i+1)h=i+1});return h}
  function drawChart(counts){
    const svg=document.querySelector('[data-impact-chart]'); if(!svg||!counts?.length)return;
    const arr=[...counts].sort((a,b)=>a.year-b.year).slice(-8); const max=Math.max(1,...arr.map(x=>x.cited_by_count||0));
    const pts=arr.map((x,i)=>[20+i*(600/Math.max(1,arr.length-1)),190-(x.cited_by_count||0)/max*150]);
    const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    const area=line+` L ${pts.at(-1)[0]} 200 L ${pts[0][0]} 200 Z`;
    const labels=arr.map((x,i)=>`<text x="${pts[i][0]}" y="216" text-anchor="middle" font-size="12" fill="currentColor">${x.year}</text>`).join('');
    svg.innerHTML='<path class="gridline" d="M20 180H620M20 130H620M20 80H620M20 30H620"/><path class="spark-area" d="'+area+'"/><path class="spark-line" d="'+line+'"/>'+labels;
  }
  function apply(data){
    window.__openAlexData=data;
    const {author,works}=data; const h=hIndex(works); const i10=works.filter(w=>(w.cited_by_count||0)>=10).length;
    setAll('[data-impact-citations]',author.cited_by_count?.toLocaleString()||'—');
    setAll('[data-impact-works]',author.works_count?.toLocaleString()||works.length);
    setAll('[data-impact-hindex]',h||author.summary_stats?.h_index||'—');
    setAll('[data-impact-i10]',i10||author.summary_stats?.i10_index||'—');
    setAll('[data-impact-status]','OpenAlex live');
    const stamp=new Date(data.fetchedAt); setAll('[data-impact-updated]','Updated '+stamp.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}));
    drawChart(author.counts_by_year);
    const latest=[...works].sort((a,b)=>(b.publication_date||'').localeCompare(a.publication_date||''))[0];
    const latestBox=document.querySelector('[data-latest-work]'); if(latest&&latestBox){ const venue=latest.primary_location?.source?.display_name||latest.type||''; latestBox.innerHTML=`<strong>${latest.display_name}</strong><p>${venue} · ${latest.publication_year||''}</p>`; }
    const byDoi=new Map(),byTitle=new Map();
    works.forEach(w=>{ if(w.doi)byDoi.set(w.doi.replace('https://doi.org/','').toLowerCase(),w); byTitle.set(normalize(w.display_name),w); });
    document.querySelectorAll('[data-openalex-citations]').forEach(el=>{
      const doi=(el.dataset.doi||'').toLowerCase(); const title=normalize(el.dataset.title); const w=(doi&&byDoi.get(doi))||byTitle.get(title);
      if(w){el.dataset.citations=String(w.cited_by_count||0); const prefix=el.classList.contains('live-cite')?'Citations · ':''; el.textContent=prefix+(w.cited_by_count||0).toLocaleString();}
      else if(!el.textContent.trim()||el.textContent.trim()==='—') el.textContent='Not indexed';
    });
    dispatchEvent(new CustomEvent('openalex:loaded',{detail:data}));
  }
  async function load(){
    try{const cached=JSON.parse(localStorage.getItem(CACHE)||'null');if(cached&&Date.now()-cached.fetchedAt<TTL){apply(cached);return}}catch(e){}
    try{
      const author=await (await fetch(`https://api.openalex.org/authors/https://orcid.org/${ORCID}?mailto=${encodeURIComponent(MAIL)}`)).json();
      const aid=(author.id||'').split('/').pop();
      const url=`https://api.openalex.org/works?filter=author.id:${aid}&per_page=200&sort=publication_date:desc&select=id,display_name,cited_by_count,publication_year,publication_date,doi,primary_location,type,open_access&mailto=${encodeURIComponent(MAIL)}`;
      const worksResp=await (await fetch(url)).json();
      const data={author,works:worksResp.results||[],fetchedAt:Date.now()}; localStorage.setItem(CACHE,JSON.stringify(data)); apply(data);
    }catch(e){ setAll('[data-impact-status]','Snapshot · live service unavailable'); }
  }
  load();
})();
