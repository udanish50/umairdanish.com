
(() => {
  const projects = {
    'linear-lens': {
      index: '01', domain: 'Mechanistic interpretability', title: 'Linear Lens',
      summary: 'A non-interventional, human-centered approach for explaining internal neural representations without modifying deployed models.',
      people: ['Muhammad Umair Danish','Umair Rehman','Katarina Grolinger'], link: '/publications/linear-lens/'
    },
    glips: {
      index: '02', domain: 'Generative-AI evaluation', title: 'GLIPS',
      summary: 'A perceptual-quality framework for evaluating photorealistic AI-generated images by connecting computational metrics with human judgment.',
      people: ['Muhammad Umair Danish','Umair Rehman','Katarina Grolinger'], link: '/publications/glips/'
    },
    midipy: {
      index: '03', domain: 'Computational music therapy', title: 'MidiPy',
      summary: 'An open Python workflow for processing and analysing MIDI data from improvised active music-therapy sessions.',
      people: ['Muhammad Umair Danish','Demian Kogutek'], link: '/publications/midipy/'
    },
    'human-ai': {
      index: '04', domain: 'Human–AI interaction', title: 'Explanation modalities',
      summary: 'A human-centered research programme examining how textual, graphical, and interactive explanations affect trust, understanding, and decision making.',
      people: ['Muhammad Umair Danish','Umair Rehman','Aleksandra Zecevic'], link: '/publications/human-centered-xai-explanation-modalities/'
    }
  };
  const tabs = [...document.querySelectorAll('.rc-project-tab')];
  const panel = document.querySelector('.rc-project-panel');
  if (!panel || !tabs.length) return;
  const nodes = {
    index: panel.querySelector('[data-project-index]'), domain: panel.querySelector('[data-project-domain]'),
    title: panel.querySelector('[data-project-title]'), summary: panel.querySelector('[data-project-summary]'),
    people: panel.querySelector('[data-project-people]'), link: panel.querySelector('[data-project-link]')
  };
  function render(key){
    const p = projects[key]; if(!p) return;
    panel.animate([{opacity:.62,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'ease-out'});
    nodes.index.textContent=p.index; nodes.domain.textContent=p.domain; nodes.title.textContent=p.title; nodes.summary.textContent=p.summary;
    nodes.people.replaceChildren(...p.people.map(name=>{const s=document.createElement('span');s.textContent=name;return s;}));
    nodes.link.href=p.link;
    tabs.forEach(tab=>{const active=tab.dataset.project===key;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
  }
  tabs.forEach(tab=>tab.addEventListener('click',()=>render(tab.dataset.project)));
})();
