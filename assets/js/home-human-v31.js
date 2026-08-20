(()=>{
"use strict";
const button=document.querySelector('.hh-menu-toggle');
const nav=document.querySelector('.hh-nav');
function closeMenu(){if(!button||!nav)return;nav.classList.remove('open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');document.body.classList.remove('nav-open')}
button?.addEventListener('click',()=>{if(!nav)return;const open=!nav.classList.contains('open');nav.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation');document.body.classList.toggle('nav-open',open)});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
addEventListener('resize',()=>{if(innerWidth>900)closeMenu()},{passive:true});
addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

async function scholarSnapshot(){
 const note=document.getElementById('hh-scholar-note');
 try{
  const r=await fetch('/assets/data/scholar-metrics.json?home=v31',{cache:'no-store'}); if(!r.ok)throw new Error('snapshot');
  const d=await r.json(),m=d.metrics||{},c=Number(m.citations?.all),h=Number(m.h_index?.all);
  if(Number.isFinite(c))document.querySelector('[data-scholar="citations"]')?.replaceChildren(document.createTextNode(c.toLocaleString()));
  if(Number.isFinite(h))document.querySelector('[data-scholar="hindex"]')?.replaceChildren(document.createTextNode(h.toLocaleString()));
  const patterns={karn:/Kolmogorov.*Arnold recurrent network/i,glips:/Global-local image perceptual score|GLIPS/i,unified:/Towards a unified evaluation framework/i};
  const arts=Array.isArray(d.articles)?d.articles:[];
  for(const [key,rx] of Object.entries(patterns)){const item=arts.find(x=>rx.test(String(x.title||''))),el=document.querySelector(`[data-paper-citations="${key}"]`);if(item&&el&&Number.isFinite(Number(item.citations)))el.textContent=Number(item.citations).toLocaleString()}
  const stamp=d.updated_at||d.snapshot_at;
  if(note&&stamp){const dt=new Date(stamp);if(!Number.isNaN(dt.valueOf()))note.textContent=`Google Scholar snapshot · updated ${dt.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`}
 }catch(_){if(note)note.textContent='Google Scholar snapshot · not live'}
}

async function liveRepoBadges(){
 const cards=[...document.querySelectorAll('[data-github-repo]')];
 await Promise.all(cards.map(async card=>{
  const repo=card.getAttribute('data-github-repo'),badge=card.querySelector('.hh-live-repo'); if(!repo||!badge)return;
  try{const r=await fetch(`https://api.github.com/repos/udanish50/${encodeURIComponent(repo)}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});if(!r.ok)throw new Error('github');const d=await r.json();badge.hidden=false;badge.title=d.pushed_at?`Live GitHub response · last push ${new Date(d.pushed_at).toLocaleDateString()}`:'Live GitHub response';}
  catch(_){badge.hidden=true}
 }))
}

function visitorMap(){const host=document.querySelector('[data-visitor-widget]');if(!host)return;const img=host.querySelector('img'),fallback=host.querySelector('[data-map-fallback]');const fail=()=>{if(img)img.hidden=true;if(fallback)fallback.hidden=false};if(!img){fail();return}img.addEventListener('error',fail,{once:true});if(img.complete&&img.naturalWidth===0)fail()}

document.querySelector('[data-copy-email]')?.addEventListener('click',async e=>{const email=e.currentTarget.getAttribute('data-copy-email')||'',status=document.querySelector('.hh-copy-status');try{await navigator.clipboard.writeText(email);if(status)status.textContent='Email copied.'}catch(_){if(status)status.textContent=email}});

scholarSnapshot(); liveRepoBadges(); visitorMap();
})();
