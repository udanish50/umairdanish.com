
(() => {
  const list=document.getElementById('publication-list'); if(!list)return;
  const search=document.getElementById('publication-search'); const count=document.getElementById('publication-count'); const sort=document.getElementById('publication-sort');
  let pubs=[],filter='all',liveWorks=[];
  const esc=s=>(s??'').toString().replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalize=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  function liveCount(p){const doi=(p.doi||'').toLowerCase();const w=liveWorks.find(x=>(doi&&x.doi?.toLowerCase().endsWith(doi))||normalize(x.display_name)===normalize(p.title));return w?.cited_by_count??-1}
  function card(p){return `<article class="publication-item" data-status="${esc(p.status)}" data-type="${esc(p.type)}" data-topic="${esc(p.topic)}"><div class="pub-year">${p.year}</div><div class="pub-main"><div class="meta-row"><span>${esc(p.type)}</span><span>${esc(p.status)}</span><span>${esc(p.topic)}</span>${p.award?`<span class="award-pill">${esc(p.award)}</span>`:''}</div><h2><a href="/publications/${p.slug}/">${esc(p.title)}</a></h2><p>${esc(p.authors)} · <strong>${esc(p.venue)}</strong></p></div><div class="pub-side"><span class="citation-badge" data-openalex-citations data-doi="${esc(p.doi)}" data-title="${esc(p.title)}" data-citations="${liveCount(p)}">${liveCount(p)>=0?liveCount(p)+' citations':'Citations · —'}</span><a href="/publications/${p.slug}/">Details <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h11.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H5v-2Z"/></svg></a></div></article>`}
  function render(){
    const q=(search.value||'').toLowerCase(); let arr=pubs.filter(p=>(filter==='all'||[p.status,p.type,p.topic].includes(filter))&&[p.title,p.authors,p.venue,p.topic,p.status,String(p.year)].join(' ').toLowerCase().includes(q));
    if(sort.value==='citations')arr.sort((a,b)=>liveCount(b)-liveCount(a)); else if(sort.value==='title')arr.sort((a,b)=>a.title.localeCompare(b.title)); else arr.sort((a,b)=>b.year-a.year||((a.status==='Accepted')?-1:1));
    list.innerHTML=arr.map(card).join(''); count.textContent=`${arr.length} publication${arr.length===1?'':'s'}`;
    if(window.__openAlexData) window.dispatchEvent(new CustomEvent('openalex:loaded',{detail:window.__openAlexData}));
  }
  fetch('/assets/data/publications.json').then(r=>r.json()).then(x=>{pubs=x;const qs=new URLSearchParams(location.search);if(qs.get('status'))filter=qs.get('status');document.querySelectorAll('.filter-chip').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));render()});
  search.addEventListener('input',render);sort.addEventListener('change',render);document.querySelectorAll('.filter-chip').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()}));
  addEventListener('openalex:loaded',e=>{liveWorks=e.detail.works||[];window.__openAlexData=e.detail;if(sort.value==='citations')render();});
})();
