(() => {
  const filters=[...document.querySelectorAll('.collab-filter')];
  const cards=[...document.querySelectorAll('.collaborator-card')];
  const count=document.querySelector('[data-visible-collabs]');
  function apply(filter){
    let visible=0;
    cards.forEach(card=>{
      const domains=(card.dataset.domains||'').split(/\s+/);
      const show=filter==='all'||domains.includes(filter);
      card.hidden=!show;
      card.classList.toggle('filtered-out',!show);
      if(show) visible++;
    });
    if(count) count.textContent=String(visible);
    filters.forEach(btn=>{
      const active=btn.dataset.filter===filter;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
  }
  filters.forEach(btn=>btn.addEventListener('click',()=>apply(btn.dataset.filter||'all')));
  document.querySelectorAll('[data-network-person]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.networkPerson;
    const card=document.getElementById(id);
    document.querySelectorAll('[data-network-person]').forEach(x=>x.classList.toggle('active',x===btn));
    if(card){
      apply('all');
      card.classList.add('spotlight');
      card.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>card.classList.remove('spotlight'),2200);
    }
  }));
})();