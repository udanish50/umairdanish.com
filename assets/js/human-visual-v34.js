(() => {
  'use strict';
  const body = document.body;
  const main = document.querySelector('main');
  if (!body || !main) return;

  const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const branchUnder = (root, node) => {
    let p = node;
    while (p && p.parentElement && p.parentElement !== root) p = p.parentElement;
    return p && p.parentElement === root ? p : node;
  };
  const nearestSectionish = el => {
    let p = el;
    while (p && p !== main) {
      if (p.tagName === 'SECTION' || p.tagName === 'ARTICLE' || /section|block|panel/i.test(p.className || '')) return p;
      p = p.parentElement;
    }
    return el.parentElement;
  };
  const sectionByHeading = (pattern) => {
    const hs = [...main.querySelectorAll('h2,h3')];
    const h = hs.find(x => pattern.test(norm(x.textContent)));
    return h ? nearestSectionish(h) : null;
  };

  // Add Collaborators to primary navigation if a redesign removed it.
  const nav = document.querySelector('header nav, .site-nav, [aria-label*="Primary" i], [aria-label*="main" i]');
  if (nav && !nav.querySelector('a[href*="collaborators"]')) {
    const links = [...nav.querySelectorAll('a')];
    const contact = links.find(a => /contact/.test(norm(a.textContent)));
    const about = links.find(a => /about/.test(norm(a.textContent)));
    const template = contact || about || links[links.length - 1];
    const a = document.createElement('a');
    a.href = '/collaborators.html';
    a.textContent = 'Collaborators';
    if (template) a.className = template.className;
    if (contact && contact.parentNode === nav) nav.insertBefore(a, contact);
    else if (template && template.parentNode) template.parentNode.insertBefore(a, template.nextSibling);
    else nav.appendChild(a);
  }

  const isCollab = /collaborators\.html$/i.test(location.pathname) || /research collaborators/i.test(document.title) || norm(main.querySelector('h1')?.textContent).includes('research developed through supervision');

  if (isCollab) {
    body.classList.add('hv-collaborators');
    [...main.querySelectorAll('section')].forEach(s => s.classList.add('hv-collab-section'));

    const cards = [];
    for (const h3 of main.querySelectorAll('h3')) {
      let node = h3.parentElement;
      let candidate = null;
      while (node && node !== main) {
        const h3Count = node.querySelectorAll('h3').length;
        const hasImg = !!node.querySelector('img');
        if (h3Count === 1 && hasImg) candidate = node;
        if (candidate && h3Count > 1) break;
        node = node.parentElement;
      }
      if (!candidate || cards.includes(candidate)) continue;
      candidate.classList.add('hv-collab-card', 'hv-click-card');
      candidate.tabIndex = 0;
      const img = candidate.querySelector('img');
      if (img) {
        img.loading = 'lazy';
        img.decoding = 'async';
        img.classList.add('hv-collab-img');
        const media = branchUnder(candidate, img);
        media.classList.add('hv-collab-media');
      }
      const copy = branchUnder(candidate, h3);
      copy.classList.add('hv-collab-copy');
      cards.push(candidate);
    }

    const parents = new Map();
    cards.forEach(c => parents.set(c.parentElement, (parents.get(c.parentElement) || 0) + 1));
    for (const [p, count] of parents) if (p && count >= 2) p.classList.add('hv-collab-grid');

    // Make each collaborator card clickable without interfering with its real links.
    cards.forEach(card => {
      const link = card.querySelector('a[href]');
      if (!link) return;
      const activate = e => {
        if (e.target.closest('a,button,input,select,textarea,label')) return;
        if (e.type === 'keydown' && !['Enter',' '].includes(e.key)) return;
        if (e.type === 'keydown') e.preventDefault();
        if (link.target === '_blank') window.open(link.href, '_blank', 'noopener');
        else location.href = link.href;
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', activate);
    });
    return;
  }

  // Homepage-only additive polish.
  if (location.pathname === '/' || /index\.html$/i.test(location.pathname)) {
    body.classList.add('hv-home');

    // Hero: detect the smallest shared ancestor containing the H1 and portrait.
    const h1 = main.querySelector('h1');
    if (h1) {
      let node = h1.parentElement, hero = null;
      while (node && node !== main) {
        if (node.querySelector('img') && node.querySelectorAll('h1').length === 1) hero = node;
        if (hero && node.parentElement === main) break;
        node = node.parentElement;
      }
      if (hero) {
        hero.classList.add('hv-hero');
        const img = hero.querySelector('img');
        if (img) {
          branchUnder(hero, img).classList.add('hv-hero-media');
          branchUnder(hero, h1).classList.add('hv-hero-copy');
        }
      }
    }

    const metrics = sectionByHeading(/research in numbers|research metrics/);
    if (metrics) {
      metrics.classList.add('hv-home-section', 'hv-metrics');
      // If the human-centered statement exists, guarantee metrics stay immediately before it.
      const statement = [...main.querySelectorAll('h2,h3,p')].find(el => /research is most useful when it stays connected to people/.test(norm(el.textContent)));
      if (statement) {
        const statementSection = nearestSectionish(statement);
        if (statementSection && metrics !== statementSection && statementSection.parentNode === metrics.parentNode && metrics.nextElementSibling !== statementSection) {
          statementSection.parentNode.insertBefore(metrics, statementSection);
        }
      }

      // Replace snapshot wording with an accurate LIVE status, backed by the site's automatic Scholar refresh.
      const notes = [...metrics.querySelectorAll('p,small,span,div')];
      const note = notes.find(el => /google scholar (snapshot|metrics)/.test(norm(el.textContent)) && el.children.length <= 2);
      if (note) {
        note.classList.add('hv-live-note');
        note.innerHTML = '<span class="hv-live-dot" aria-hidden="true"></span><strong>LIVE</strong> · Google Scholar metrics refreshed automatically';
      }

      // Keep journals and conferences distinct and make each metric independently clickable.
      const specs = [
        {label:/citations/i, href:'https://scholar.google.com/citations?hl=en&user=vDmY-KUAAAAJ'},
        {label:/h[- ]?index/i, href:'https://scholar.google.com/citations?hl=en&user=vDmY-KUAAAAJ'},
        {label:/journal papers?/i, href:'/publications.html'},
        {label:/conference papers?/i, href:'/publications.html'},
        {label:/awards?/i, href:'/about.html'}
      ];
      const items = [];
      for (const spec of specs) {
        const el = [...metrics.querySelectorAll('a,div,li')].find(x => spec.label.test(x.textContent || '') && x.querySelectorAll('a,div,li').length < 6);
        if (!el) continue;
        const item = el.closest('a') || el;
        item.classList.add('hv-metric-item', 'hv-click-card');
        item.tabIndex = item.tabIndex >= 0 ? item.tabIndex : 0;
        item.dataset.hvHref = spec.href;
        if (!items.includes(item)) items.push(item);
      }
      if (items.length >= 4) {
        const parentCounts = new Map();
        items.forEach(i => parentCounts.set(i.parentElement, (parentCounts.get(i.parentElement)||0)+1));
        const grid = [...parentCounts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
        if (grid) grid.classList.add('hv-metric-grid');
      }
    }

    const classes = [
      [/daily knowledge|on this day/, 'hv-daily-knowledge'],
      [/selected research/, 'hv-selected-research'],
      [/research areas/, 'hv-research-areas'],
      [/recent milestones/, 'hv-milestones'],
      [/research software/, 'hv-software'],
      [/collaboration/, 'hv-collaboration'],
      [/global reach/, 'hv-global-reach']
    ];
    for (const [pattern, cls] of classes) {
      const sec = sectionByHeading(pattern);
      if (sec) sec.classList.add('hv-home-section', cls);
    }

    // Annotate existing cards; preserve every card and every link.
    for (const h3 of main.querySelectorAll('h3')) {
      const card = h3.closest('article,li,[class*="card"],[class*="item"]');
      if (!card || card.closest('header,footer,nav')) continue;
      card.classList.add('hv-home-card');
      const link = card.querySelector('a[href]');
      if (link) {
        card.classList.add('hv-click-card');
        card.tabIndex = 0;
        card.dataset.hvHref = link.href;
      }
    }

    // Background-click and keyboard activation for annotated homepage cards/metrics.
    for (const card of main.querySelectorAll('.hv-click-card')) {
      const href = card.dataset.hvHref;
      if (!href) continue;
      const activate = e => {
        if (e.target.closest('a,button,input,select,textarea,label')) return;
        if (e.type === 'keydown' && !['Enter',' '].includes(e.key)) return;
        if (e.type === 'keydown') e.preventDefault();
        location.href = href;
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', activate);
    }

    // Refresh only Scholar values from the site's existing automatically-maintained cache when available.
    fetch('/assets/data/scholar-metrics.json?ts=' + Date.now(), {cache:'no-store'})
      .then(r => { if (!r.ok) throw new Error('metrics'); return r.json(); })
      .then(data => {
        const citationValue = data.citations ?? data.total_citations ?? data.citation_count;
        const hValue = data.h_index ?? data.hindex ?? data['h-index'];
        const update = (labelRe, value) => {
          if (value == null) return;
          const label = [...metrics?.querySelectorAll('*') || []].find(el => labelRe.test(norm(el.textContent)) && el.children.length === 0);
          if (!label) return;
          const root = label.closest('a,li,div') || label.parentElement;
          if (!root) return;
          const numberEl = [...root.querySelectorAll('*')].find(el => /^\s*\d[\d,]*\s*$/.test(el.textContent || '') && el.children.length === 0);
          if (numberEl) numberEl.textContent = Number(value).toLocaleString();
        };
        update(/citations/, citationValue);
        update(/h[- ]?index/, hValue);
      }).catch(()=>{});
  }
})();
