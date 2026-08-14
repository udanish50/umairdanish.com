(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];

  async function updateScholarMetrics() {
    try {
      const response = await fetch('/assets/data/scholar-metrics.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const metrics = data.metrics || {};
      const citations = metrics.citations?.all;
      const hIndex = metrics.h_index?.all;
      if (Number.isFinite(citations)) $('[data-live-metric="citations"]').textContent = citations.toLocaleString();
      if (Number.isFinite(hIndex)) $('[data-live-metric="h-index"]').textContent = hIndex.toLocaleString();

      const articles = Array.isArray(data.articles) ? data.articles : [];
      all('[data-citation-title]').forEach((node) => {
        const needle = (node.dataset.citationTitle || '').toLowerCase();
        const match = articles.find((article) => (article.title || '').toLowerCase().includes(needle));
        const citedBy = match?.cited_by?.value ?? match?.citations;
        if (Number.isFinite(citedBy)) node.textContent = `Cited by ${citedBy}`;
      });
    } catch (_) {
      // Static fallbacks in the HTML keep the page useful offline and on first paint.
    }
  }

  updateScholarMetrics();
})();
