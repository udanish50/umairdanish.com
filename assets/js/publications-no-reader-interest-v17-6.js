(() => {
  'use strict';

  const PHRASES = [
    'first real paper visit',
    'reader interest this month',
    'trending on this site',
    'most-read papers this month'
  ];

  function normalizedText(el) {
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isTargetText(text) {
    return PHRASES.some((phrase) => text.includes(phrase));
  }

  function safeContainer(node) {
    if (!(node instanceof Element)) return null;

    // Prefer semantic content containers so the entire old panel disappears,
    // including its month label, rules and whitespace.
    const semantic = node.closest('section, article, aside');
    if (semantic && normalizedText(semantic).length < 10000) return semantic;

    // Legacy markup sometimes used nested divs only. Choose the smallest
    // reasonable div that still contains the target wording.
    let current = node;
    let best = null;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.tagName === 'DIV') {
        const text = normalizedText(current);
        if (isTargetText(text) && text.length < 2500) best = current;
      }
      current = current.parentElement;
    }
    return best || node;
  }

  function clean(root = document) {
    const scope = root instanceof Element || root instanceof Document ? root : document;
    const nodes = scope.querySelectorAll
      ? scope.querySelectorAll('section, article, aside, div, p, h1, h2, h3, h4, span')
      : [];

    const targets = [];
    for (const el of nodes) {
      const text = normalizedText(el);
      if (!isTargetText(text)) continue;
      const container = safeContainer(el);
      if (container && !targets.includes(container)) targets.push(container);
    }

    // Remove deeper/smaller targets first; disconnected parents are skipped.
    targets
      .sort((a, b) => normalizedText(a).length - normalizedText(b).length)
      .forEach((el) => {
        if (el.isConnected) el.remove();
      });
  }

  function start() {
    clean(document);

    // The old publication tracker is injected asynchronously. Watch the DOM
    // so it is removed even when it appears after the initial page load.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) clean(node);
        }
        if (mutation.type === 'characterData' && mutation.target.parentElement) {
          clean(mutation.target.parentElement);
        }
      }
      clean(document);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
