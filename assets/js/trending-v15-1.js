(() => {
  'use strict';

  const API = 'https://umairdanish-reader-reactions.umairdanish.workers.dev';
  const VISITOR_KEY = 'ud-paper-reader:v15-1:visitor-id';

  // Display-only launch baselines. They are never written to D1.
  const PAPERS = [
    { slug: 'physics-guided-memory-network', title: 'Physics-Guided Memory Network', baseline: 12 },
    { slug: 'linear-lens', title: 'Linear Lens', baseline: 9 },
    { slug: 'glips', title: 'GLIPS', baseline: 7 },
    { slug: 'hypernetworks-learnable-kernels', title: 'Hypernetworks + Learnable Kernels', baseline: 5 },
    { slug: 'kolmogorov-arnold-recurrent-network', title: 'Kolmogorov–Arnold Recurrent Network', baseline: 3 }
  ];

  function visitorId() {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (id) return id;
      id = (globalThis.crypto && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
      return id;
    } catch (_) {
      return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    }
  }

  async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      cache: 'no-store',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function currentPaperSlug() {
    const match = location.pathname.match(/^\/publications\/([a-z0-9-]+)\/?(?:index\.html)?$/i);
    return match ? match[1].toLowerCase() : '';
  }

  async function recordVisit() {
    const slug = currentPaperSlug();
    if (!slug) return;
    try {
      const result = await api('/visit', {
        method: 'POST',
        body: JSON.stringify({ slug, visitor_id: visitorId() })
      });
      window.dispatchEvent(new CustomEvent('reader-visit:recorded', { detail: result }));
    } catch (_) {}
  }

  function torontoMonthParts() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto', year: 'numeric', month: '2-digit'
    }).formatToParts(new Date());
    return Object.fromEntries(parts.map(p => [p.type, p.value]));
  }

  function monthLabel() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto', month: 'long', year: 'numeric'
    }).format(new Date());
  }

  function monthKey() {
    const p = torontoMonthParts();
    return `${p.year}-${p.month}`;
  }

  function findTrendingRoot() {
    const phrases = ['trending on this site', 'most-read papers this month', 'reader interest this month'];
    const candidates = [...document.querySelectorAll('section, article, aside, div')]
      .filter(el => phrases.some(p => (el.textContent || '').toLowerCase().includes(p)))
      .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
    return candidates[0] || null;
  }

  function prettyTitle(slug) {
    return slug.split('-').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
  }

  function render(root, realCounts = new Map(), live = true) {
    const known = new Map(PAPERS.map(p => [p.slug, p]));
    const rows = PAPERS.map(p => ({ ...p, real: realCounts.get(p.slug) || 0 }));
    for (const [slug, real] of realCounts) {
      if (!known.has(slug)) rows.push({ slug, title: prettyTitle(slug), baseline: 0, real });
    }
    rows.forEach(row => { row.display = row.baseline + row.real; });
    rows.sort((a, b) => b.display - a.display || a.title.localeCompare(b.title));
    const top = rows.slice(0, 5);

    root.classList.add('ud-trending-v15-1');
    root.innerHTML = `
      <div class="ud-trending-shell">
        <div class="ud-trending-head">
          <div>
            <p class="ud-trending-kicker">TRENDING ON THIS SITE</p>
            <h2>Reader interest this month</h2>
            <p class="ud-trending-intro">See which research is attracting attention across the site.</p>
          </div>
          <div class="ud-trending-month">${monthLabel()}</div>
        </div>
        <ol class="ud-trending-list">
          ${top.map((paper, index) => `
            <li class="ud-trending-row">
              <span class="ud-trending-rank" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <a class="ud-trending-paper" href="/publications/${paper.slug}/">
                <span class="ud-trending-title">${paper.title}</span>
                <span class="ud-trending-meta">Research paper</span>
              </a>
              <span class="ud-trending-score" title="Launch baseline + real daily readership activity">
                <strong>${paper.display.toLocaleString()}</strong>
                <small>interest</small>
              </span>
            </li>`).join('')}
        </ol>
        <div class="ud-trending-note">
          <span class="ud-trending-live ${live ? 'is-live' : ''}">${live ? 'Live' : 'Baseline'}</span>
          <span>A small launch baseline is combined with privacy-conscious readership activity. You can revisit any paper as often as you like; each browser contributes at most one new activity signal per paper per day.</span>
        </div>
      </div>`;
  }

  async function renderTrending() {
    const root = findTrendingRoot();
    if (!root) return;
    render(root, new Map(), false);
    try {
      const data = await api(`/trending?month=${encodeURIComponent(monthKey())}`);
      const counts = new Map((data.counts || []).map(row => [row.slug, Number(row.real_count) || 0]));
      render(root, counts, true);
    } catch (_) {}
  }

  function start() {
    recordVisit().finally(renderTrending);
  }

  window.addEventListener('reader-visit:recorded', renderTrending);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
