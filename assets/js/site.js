
(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem('ud-theme');
  if (saved) root.dataset.theme = saved;
  else root.dataset.theme = 'light';

  document.querySelectorAll('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ud-theme', root.dataset.theme);
  }));

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const closeMenu = () => {
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };
  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') || false;
    menu.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('resize', () => { if (innerWidth > 1050) closeMenu(); });
  addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, {threshold: .1});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('.copy-text').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy || ''); const old=btn.textContent; btn.textContent='Copied'; setTimeout(()=>btn.textContent=old,1400); } catch(e) {}
  }));

  const mapDetails = {
    inside:{label:'Mechanistic interpretability',title:'Trace information rather than merely producing a post-hoc picture.',body:'Linear Lens and related work investigate how predictive information emerges across a network while keeping the deployed model unchanged.',url:'/publications/linear-lens/',link:'Explore Linear Lens'},
    human:{label:'Human-centered XAI',title:'Evaluate explanations through human outcomes.',body:'Current work examines textual, graphical, and interactive explanations through understanding, trust, cognitive effects, and decision quality.',url:'/publications/human-centered-xai-explanation-modalities/',link:'Explore IECON 2026 work'},
    reliable:{label:'Reliable temporal learning',title:'Model diverse systems without assuming one pattern fits all.',body:'Hypernetworks, learnable kernels, physics guidance, and diffusion-based imputation address heterogeneity and missing information.',url:'/publications/hypernetworks-learnable-kernels/',link:'Explore HyperEnergy'},
    measure:{label:'Human-aligned evaluation',title:'Use measures that reflect the phenomenon we actually care about.',body:'GLIPS, unified perceptual evaluation, and Monotone Delta connect computational metrics to perception and structured consistency.',url:'/publications/glips/',link:'Explore GLIPS'}
  };
  const detail = document.querySelector('[data-map-detail]');
  document.querySelectorAll('.map-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.map-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.map-node').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-node="${tab.dataset.map}"]`)?.classList.add('active');
    const d=mapDetails[tab.dataset.map];
    if(detail) detail.innerHTML=`<span>${d.label}</span><h3>${d.title}</h3><p>${d.body}</p><a href="${d.url}">${d.link}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h11.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H5v-2Z"/></svg></a>`;
  }));

  // Command palette
  const palette=document.querySelector('.command-palette');
  const input=document.querySelector('.command-input');
  const results=document.querySelector('.command-results');
  let index=[];
  async function getIndex(){ if(index.length) return index; try{ index=await (await fetch('/assets/data/search-index.json')).json(); }catch(e){} return index; }
  async function openPalette(){ palette?.classList.add('open'); palette?.setAttribute('aria-hidden','false'); await getIndex(); setTimeout(()=>input?.focus(),20); }
  function closePalette(){ palette?.classList.remove('open'); palette?.setAttribute('aria-hidden','true'); }
  document.querySelectorAll('.search-trigger').forEach(b=>b.addEventListener('click',openPalette));
  document.querySelector('.command-backdrop')?.addEventListener('click',closePalette);
  addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()} if(e.key==='Escape')closePalette(); });
  input?.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    if(!q){results.innerHTML='<p class="command-empty">Start typing to search the site.</p>';return}
    const found=index.filter(x=>[x.title,x.summary,...(x.tags||[])].join(' ').toLowerCase().includes(q)).slice(0,9);
    results.innerHTML=found.length?found.map(x=>`<a class="command-result" href="${x.url}"><span>${x.kind}</span><strong>${x.title}</strong><p>${x.summary}</p></a>`).join(''):'<p class="command-empty">No results found.</p>';
  });

  if ('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
})();
