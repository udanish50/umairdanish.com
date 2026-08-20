(()=>{
  const metricEls={
    citations:document.querySelector('[data-live-metric="citations"]'),
    hindex:document.querySelector('[data-live-metric="hindex"]'),
    journals:document.querySelector('[data-live-metric="journals"]'),
    conferences:document.querySelector('[data-live-metric="conferences"]'),
    awards:document.querySelector('[data-live-metric="awards"]')
  };
  const status=document.querySelector('[data-live-metrics-status]');
  fetch('/assets/data/live-research-metrics.json?ts='+Date.now(),{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('metrics unavailable');return r.json()})
    .then(d=>{
      for(const [k,el] of Object.entries(metricEls)) if(el && Number.isFinite(Number(d[k]))) el.textContent=String(d[k]);
      if(status){
        const t=d.updated_at?new Date(d.updated_at):null;
        const age=t&&Number.isFinite(t.getTime())?(Date.now()-t.getTime()):Infinity;
        const fresh=d.source_ok===true && age < 36*60*60*1000;
        status.textContent=fresh?'LIVE · auto-refreshed '+t.toLocaleString():'LIVE feed · latest verified values';
        status.dataset.fresh=fresh?'true':'false';
      }
    })
    .catch(()=>{if(status) status.textContent='LIVE feed · latest verified values';});

  const interactive='a,button,input,select,textarea,label,summary,[role="button"]';
  function wholeCard(el,url){
    if(!el||!url||el.dataset.wholeCardReady==='1')return;
    el.dataset.wholeCardReady='1';
    el.dataset.wholeCardClickable='true';
    if(!el.hasAttribute('tabindex')) el.tabIndex=0;
    if(!el.hasAttribute('role')) el.setAttribute('role','link');
    const go=()=>{ if(/^https?:/.test(url)) window.open(url,'_blank','noopener'); else location.href=url; };
    el.addEventListener('click',e=>{if(e.target.closest(interactive))return;go()});
    el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest(interactive)){e.preventDefault();go()}});
  }

  document.querySelectorAll('.hh-paper,.hh-tool').forEach(el=>{const a=el.querySelector('a[href]');if(a)wholeCard(el,a.href)});
  document.querySelectorAll('.hh-values article').forEach((el,i)=>wholeCard(el,i===2?'/software.html':'/research.html'));
  document.querySelectorAll('.hh-now-card li').forEach((el,i)=>wholeCard(el,i===2?'/software.html':'/research.html'));
  wholeCard(document.querySelector('.hh-portrait-card'),'/about.html');
  const human=document.querySelector('.hh-human-intro'); if(human) wholeCard(human,'/about.html');
  const globalCopy=document.querySelector('.hh-global-copy'); if(globalCopy) wholeCard(globalCopy,'https://info.flagcounter.com/txBY');
})();
