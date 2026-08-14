(() => {
"use strict";
const root=document.documentElement,body=document.body,menuButton=document.querySelector(".hc-menu-toggle"),nav=document.querySelector(".hc-nav"),themeButton=document.querySelector(".hc-theme-toggle");
function setTheme(theme){if(theme==="dark")root.setAttribute("data-theme","dark");else root.removeAttribute("data-theme");try{localStorage.setItem("theme",theme)}catch(_){}if(themeButton){const dark=theme==="dark";themeButton.setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode")}}
try{const saved=localStorage.getItem("theme");if(saved==="dark"||saved==="light")setTheme(saved);else if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)setTheme("dark")}catch(_){}
themeButton?.addEventListener("click",()=>setTheme(root.getAttribute("data-theme")==="dark"?"light":"dark"));
function closeMenu(){if(!nav||!menuButton)return;nav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");menuButton.setAttribute("aria-label","Open navigation");body.classList.remove("nav-open")}
menuButton?.addEventListener("click",()=>{if(!nav)return;const open=!nav.classList.contains("open");nav.classList.toggle("open",open);menuButton.setAttribute("aria-expanded",String(open));menuButton.setAttribute("aria-label",open?"Close navigation":"Open navigation");body.classList.toggle("nav-open",open)});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});window.addEventListener("resize",()=>{if(window.innerWidth>860)closeMenu()},{passive:true});

async function loadScholarMetrics(){
 const note=document.getElementById("hc-metrics-note");
 try{
  const r=await fetch("/assets/data/scholar-metrics.json?home=v24",{cache:"no-store"});if(!r.ok)throw new Error("metrics");
  const d=await r.json(),m=d.metrics||{},c=m.citations?.all,h=m.h_index?.all;
  if(Number.isFinite(Number(c))){const e=document.querySelector('[data-scholar="citations"]');if(e)e.textContent=Number(c).toLocaleString()}
  if(Number.isFinite(Number(h))){const e=document.querySelector('[data-scholar="hindex"]');if(e)e.textContent=Number(h).toLocaleString()}
  const map={karn:/Kolmogorov.*Arnold recurrent network/i,glips:/Global-local image perceptual score|GLIPS/i,unified:/Towards a unified evaluation framework/i},arts=Array.isArray(d.articles)?d.articles:[];
  Object.entries(map).forEach(([k,rx])=>{const item=arts.find(x=>rx.test(String(x.title||""))),el=document.querySelector(`[data-paper-citations="${k}"]`);if(item&&el&&Number.isFinite(Number(item.citations)))el.textContent=Number(item.citations).toLocaleString()});
  const stamp=d.updated_at||d.snapshot_at;if(note&&stamp){const dt=new Date(stamp);if(!Number.isNaN(dt.valueOf()))note.textContent=`Google Scholar · updated ${dt.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`}
 }catch(_){if(note)note.textContent="Latest verified Google Scholar snapshot"}
}
const icons={
 "core-norm":'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v5M20 12h-5M12 20v-5M4 12h5"/></svg>',
 "linear-lens":'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M8 10.5h5"/></svg>',
 "openmetriclab":'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19v-5M10 19V9M15 19v-8M20 19V5"/></svg>',
 "aimemgraph":'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="m7 7 9-1M6 9l5 7m6-8-4 8"/></svg>'
};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function card(x){const id=String(x.id||"").toLowerCase(),icon=icons[id]||'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z"/></svg>',name=esc(x.name||"Research software"),summary=esc(x.summary||""),url=esc(x.url||"/software.html"),gh=esc(x.github||"https://github.com/udanish50");return `<article class="hc-software-card" data-id="${esc(id)}"><span class="hc-software-icon">${icon}</span><div class="hc-software-copy"><h3><a href="${url}">${name}</a></h3><p>${summary}</p><div class="hc-software-links"><a href="${url}">Open</a><a href="${gh}" target="_blank" rel="noopener">GitHub ↗</a></div></div></article>`}
async function loadSoftware(){const host=document.querySelector("[data-home-software]");if(!host)return;try{const r=await fetch("/assets/data/software.json?home=v24",{cache:"no-store"});if(!r.ok)throw new Error("catalog");const d=await r.json(),list=Array.isArray(d.software)?d.software:[],p=["core-norm","linear-lens","openmetriclab","aimemgraph"],sorted=[...list].sort((a,b)=>{const ai=p.indexOf(String(a.id||"")),bi=p.indexOf(String(b.id||""));return(ai<0?99:ai)-(bi<0?99:bi)}).slice(0,4);if(sorted.length)host.innerHTML=sorted.map(card).join("")}catch(_){}}

async function loadDailyKnowledge(){
 const dayEl=document.getElementById("hc-knowledge-day"),monthEl=document.getElementById("hc-knowledge-month"),yearEl=document.getElementById("hc-knowledge-year"),titleEl=document.getElementById("hc-knowledge-title"),textEl=document.getElementById("hc-knowledge-text"),linkEl=document.getElementById("hc-knowledge-link");
 if(!titleEl)return;
 const now=new Date(),month=String(now.getMonth()+1).padStart(2,"0"),day=String(now.getDate()).padStart(2,"0");
 if(dayEl)dayEl.textContent=String(now.getDate());
 if(monthEl)monthEl.textContent=now.toLocaleDateString(undefined,{month:"short"});
 try{
  const r=await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,{headers:{"accept":"application/json"}});
  if(!r.ok)throw new Error("Wikipedia feed");
  const d=await r.json(),events=Array.isArray(d.events)?d.events:[];
  if(!events.length)throw new Error("No events");
  const idx=(now.getFullYear()+now.getMonth()+now.getDate())%events.length,event=events[idx],page=Array.isArray(event.pages)?event.pages[0]:null;
  if(yearEl)yearEl.textContent=event.year??"";
  titleEl.textContent=event.text||"Historical event";
  if(textEl)textEl.textContent=page?.extract||"Explore the historical event and its context on Wikipedia.";
  if(linkEl&&page?.content_urls?.desktop?.page)linkEl.href=page.content_urls.desktop.page;
 }catch(_){
  if(yearEl)yearEl.textContent="On this day:";
  titleEl.textContent="Explore today's historical events";
  if(textEl)textEl.textContent="Wikipedia's live historical feed is temporarily unavailable. The source link remains available.";
 }
}
document.querySelectorAll("[data-copy-email]").forEach(btn=>btn.addEventListener("click",async()=>{
 const email=btn.getAttribute("data-copy-email")||"",status=btn.closest(".hc-collaboration-body")?.querySelector(".hc-copy-status");
 try{await navigator.clipboard.writeText(email);if(status)status.textContent="Email copied to clipboard."}
 catch(_){if(status)status.textContent=email}
}));

loadScholarMetrics();loadSoftware();loadDailyKnowledge();
})();