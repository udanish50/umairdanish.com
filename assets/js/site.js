(() => {
  const root=document.documentElement; root.dataset.theme='light'; localStorage.removeItem('ud-theme');
  const header=document.querySelector('.site-header');
  const menu=document.querySelector('.menu-toggle'); const nav=document.querySelector('.nav');
  const closeMenu=()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');document.body.classList.remove('nav-open')};
  menu?.addEventListener('click',()=>{const open=nav?.classList.toggle('open')||false;menu.setAttribute('aria-expanded',String(open));document.body.classList.toggle('nav-open',open)});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('resize',()=>{if(innerWidth>900)closeMenu()}); addEventListener('scroll',()=>header?.classList.toggle('is-scrolled',scrollY>24),{passive:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
  document.querySelectorAll('.copy-text').forEach(btn=>btn.addEventListener('click',async()=>{const original=btn.textContent;try{await navigator.clipboard.writeText(btn.dataset.copy||'');btn.textContent='Copied';btn.setAttribute('aria-label','Copied to clipboard');setTimeout(()=>{btn.textContent=original;btn.removeAttribute('aria-label')},1600)}catch(e){btn.textContent=btn.dataset.copy||original}}));
  const palette=document.querySelector('.command-palette'),input=document.querySelector('.command-input'),results=document.querySelector('.command-results');let index=[];
  async function getIndex(){if(index.length)return index;try{index=await(await fetch('/assets/data/search-index.json')).json()}catch(e){}return index}
  async function openPalette(){palette?.classList.add('open');palette?.setAttribute('aria-hidden','false');await getIndex();setTimeout(()=>input?.focus(),20)}
  function closePalette(){palette?.classList.remove('open');palette?.setAttribute('aria-hidden','true')}
  document.querySelectorAll('.search-trigger').forEach(b=>b.addEventListener('click',openPalette));document.querySelector('.command-backdrop')?.addEventListener('click',closePalette);
  addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape'){closePalette();closeMenu()}});
  input?.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();if(!q){results.innerHTML='<p class="command-empty">Start typing to search the site.</p>';return}const found=index.filter(x=>[x.title,x.summary,...(x.tags||[])].join(' ').toLowerCase().includes(q)).slice(0,10);results.innerHTML=found.length?found.map(x=>`<a class="command-result" href="${x.url}"><span>${x.kind}</span><strong>${x.title}</strong><p>${x.summary}</p></a>`).join(''):'<p class="command-empty">No results found.</p>'});
  if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
})();