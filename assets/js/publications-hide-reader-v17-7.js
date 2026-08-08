(() => {
  'use strict';

  const READER_PHRASES = [
    'starting live view collection',
    'first real paper visit',
    'live tracking is active',
    'reader interest this month',
    'trending on this site',
    'most-read papers this month'
  ];

  const CITATION_PHRASES = [
    'citation leaderboard',
    'most-cited work',
    'google scholar'
  ];

  function textOf(el) {
    return (el && el.textContent ? el.textContent : '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function hasAny(text, phrases) {
    return phrases.some((phrase) => text.includes(phrase));
  }

  function isReaderText(text) {
    return hasAny(text, READER_PHRASES);
  }

  function isCitationText(text) {
    return hasAny(text, CITATION_PHRASES);
  }

  function hideElement(el) {
    if (!(el instanceof Element)) return;
    el.classList.add('ud-reader-ui-hidden-v17-7');
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('display', 'none', 'important');
  }

  function chooseReaderContainer(node) {
    if (!(node instanceof Element)) return null;

    let current = node;
    let best = null;

    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      const text = textOf(current);

      // Absolute safety: never hide any ancestor containing citation content.
      if (isCitationText(text)) break;

      if (isReaderText(text) && text.length < 5000) {
        if (
          current.matches('section, article, aside') ||
          (current.tagName === 'DIV' && text.length < 2200)
        ) {
          best = current;
        }
      }

      current = current.parentElement;
    }

    return best || node;
  }

  function hideReaderPanels(root = document) {
    const scope =
      root instanceof Document || root instanceof Element ? root : document;

    const nodes = scope.querySelectorAll
      ? scope.querySelectorAll(
          'section, article, aside, div, p, h1, h2, h3, h4, span'
        )
      : [];

    const targets = [];

    for (const el of nodes) {
      const text = textOf(el);

      if (!isReaderText(text)) continue;
      if (isCitationText(text)) continue;

      const target = chooseReaderContainer(el);
      if (!target) continue;

      // Second citation safety check on the selected container.
      if (isCitationText(textOf(target))) continue;

      if (!targets.includes(target)) targets.push(target);
    }

    // IMPORTANT: hide only. Never delete DOM nodes.
    targets
      .sort((a, b) => textOf(a).length - textOf(b).length)
      .forEach(hideElement);
  }

  function start() {
    hideReaderPanels(document);

    // live-v14.js may update its placeholders after DOMContentLoaded.
    // Keep the reader panel hidden after those updates without touching
    // the shared citation engine.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hideReaderPanels(node);
            }
          }
        }

        if (
          mutation.type === 'characterData' &&
          mutation.target.parentElement
        ) {
          hideReaderPanels(mutation.target.parentElement);
        }
      }

      hideReaderPanels(document);
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
