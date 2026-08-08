(() => {
  'use strict';

  const API = 'https://umairdanish-reader-reactions.umairdanish.workers.dev';
  const root = document.querySelector('[data-daily-knowledge]');
  if (!root) return;

  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dateLabel = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  const dateElement = root.querySelector('[data-daily-date]');
  const yearElement = root.querySelector('[data-daily-year]');
  const textElement = root.querySelector('[data-daily-text]');
  const linkElement = root.querySelector('[data-daily-link]');

  if (dateElement) dateElement.textContent = `On this day · ${dateLabel}`;

  function cleanWiki(value) {
    let s = String(value || '');
    s = s.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '');
    s = s.replace(/<ref\b[^>]*\/>/gi, '');
    for (let i = 0; i < 4; i += 1) s = s.replace(/\{\{[^{}]*\}\}/g, '');
    s = s.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
    s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
    s = s.replace(/''+/g, '');
    s = s.replace(/<[^>]+>/g, '');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = s;
    return textarea.value.replace(/\s+/g, ' ').trim();
  }

  function shorten(value, max = 220) {
    const s = String(value || '').replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max + 1);
    const pos = cut.lastIndexOf(' ');
    return `${cut.slice(0, pos > 150 ? pos : max).trim()}…`;
  }

  function render(data) {
    if (!data || !data.text || !data.year) throw new Error('Invalid daily knowledge payload');
    if (yearElement) yearElement.textContent = String(data.year);
    if (textElement) textElement.textContent = String(data.text);
    if (linkElement && data.url) {
      linkElement.href = data.url;
      linkElement.hidden = false;
    }
  }

  async function fromWorker() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(
        `${API}/api/daily-knowledge?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}`,
        { signal: controller.signal, cache: 'no-store', mode: 'cors' }
      );
      if (!response.ok) throw new Error(`Worker daily knowledge unavailable (${response.status})`);
      const data = await response.json();
      if (!data || data.ok !== true) throw new Error('Invalid Worker payload');
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fromWikipediaBrowser() {
    // Browser-side fallback deliberately uses the MediaWiki Action API.
    // origin=* is required for anonymous cross-origin Action API requests.
    const pageTitle = `${monthNames[Number(month)]}_${Number(day)}`;
    const base = 'https://en.wikipedia.org/w/api.php';
    const headers = {
      'Api-User-Agent': 'UmairDanishDailyKnowledge/1.3 (https://umairdanish.com/)'
    };

    const sectionsUrl =
      `${base}?action=parse&page=${encodeURIComponent(pageTitle)}` +
      `&prop=sections&format=json&formatversion=2&origin=*`;
    const sectionsResponse = await fetch(sectionsUrl, { headers, mode: 'cors', cache: 'no-store' });
    if (!sectionsResponse.ok) throw new Error(`Wikipedia sections unavailable (${sectionsResponse.status})`);
    const sectionsData = await sectionsResponse.json();
    const sections = sectionsData?.parse?.sections || [];
    const eventsSection = sections.find(
      section => String(section?.line || '').trim().toLowerCase() === 'events'
    );
    if (!eventsSection?.index) throw new Error('Wikipedia Events section not found');

    const textUrl =
      `${base}?action=parse&page=${encodeURIComponent(pageTitle)}` +
      `&prop=wikitext&section=${encodeURIComponent(eventsSection.index)}` +
      `&format=json&formatversion=2&origin=*`;
    const textResponse = await fetch(textUrl, { headers, mode: 'cors', cache: 'no-store' });
    if (!textResponse.ok) throw new Error(`Wikipedia events unavailable (${textResponse.status})`);
    const textData = await textResponse.json();
    const wikitext = String(textData?.parse?.wikitext || '');
    const events = [];

    for (const line of wikitext.split('\n')) {
      const match = line.match(/^\*\s*(?:\[\[)?(\d{1,4})(?:\]\])?\s*[–—-]\s*(.+)$/);
      if (!match) continue;

      const year = Number(match[1]);
      const rawBody = match[2];
      const firstLink = rawBody.match(/\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?\]\]/);
      const target = firstLink?.[1]?.trim() || pageTitle.replace(/_/g, ' ');
      const text = cleanWiki(rawBody);
      if (!Number.isFinite(year) || !text) continue;

      events.push({
        year,
        text: shorten(text),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(target.replace(/ /g, '_'))}`
      });
    }

    if (!events.length) throw new Error('No Wikipedia events could be parsed');

    // Prefer modern historical items but keep the choice deterministic for the date.
    const currentYear = new Date().getFullYear();
    const preferred = events.filter(event => event.year >= 1800 && event.year <= currentYear - 5);
    const pool = preferred.length ? preferred : events;
    const index = (Number(month) * 31 + Number(day)) % pool.length;
    return pool[index];
  }

  (async () => {
    try {
      try {
        render(await fromWorker());
      } catch {
        render(await fromWikipediaBrowser());
      }
    } catch {
      if (yearElement) yearElement.textContent = 'Today';
      if (textElement) {
        textElement.textContent =
          'Daily knowledge is temporarily unavailable. Please try again shortly.';
      }
      if (linkElement) linkElement.hidden = true;
    }
  })();
})();
