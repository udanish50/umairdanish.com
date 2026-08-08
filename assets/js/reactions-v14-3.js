(() => {
  'use strict';

  const API = 'https://api.counterapi.dev/v1/umairdanish-com-reader-reactions';
  const REACTIONS = ['insightful', 'useful', 'appreciated'];
  const initialized = new WeakSet();

  function valueOf(data) {
    const raw = data?.value ?? data?.count ?? data?.data?.value ?? data?.data?.count ?? 0;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function storageKey(slug) {
    return `ud-reader-reaction:${slug}`;
  }

  function getSelected(slug) {
    try {
      const value = localStorage.getItem(storageKey(slug));
      return REACTIONS.includes(value) ? value : '';
    } catch (_) {
      return '';
    }
  }

  function saveSelected(slug, reaction) {
    try {
      localStorage.setItem(storageKey(slug), reaction);
    } catch (_) {}
  }

  function endpoint(slug, reaction, action = '') {
    const counter = encodeURIComponent(`${slug}--${reaction}`);
    return action ? `${API}/${counter}/${action}` : `${API}/${counter}/`;
  }

  async function request(url) {
    const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
    if (!response.ok) throw new Error(`Counter service returned ${response.status}`);
    return response.json();
  }

  function setPressed(root, current) {
    root.querySelectorAll('[data-reaction]').forEach(button => {
      const active = button.dataset.reaction === current;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('is-selected', active);
    });
  }

  function setCount(root, reaction, value) {
    const node = root.querySelector(`[data-reaction-count="${reaction}"]`);
    if (node) node.textContent = Number(value).toLocaleString();
  }

  async function loadCounts(root, slug) {
    root.classList.add('is-loading');
    try {
      await Promise.all(
        REACTIONS.map(async reaction => {
          const data = await request(endpoint(slug, reaction));
          setCount(root, reaction, valueOf(data));
        })
      );
      root.dataset.reactionSync = 'shared';
    } catch (_) {
      root.dataset.reactionSync = 'local';
    } finally {
      root.classList.remove('is-loading');
    }
  }

  async function react(root, slug, reaction) {
    const previous = getSelected(slug);
    if (previous === reaction) return;

    saveSelected(slug, reaction);
    setPressed(root, reaction);
    root.classList.add('is-saving');

    try {
      if (previous) {
        const previousData = await request(endpoint(slug, previous, 'down'));
        setCount(root, previous, valueOf(previousData));
      }

      const nextData = await request(endpoint(slug, reaction, 'up'));
      setCount(root, reaction, valueOf(nextData));
      root.dataset.reactionSync = 'shared';
    } catch (_) {
      root.dataset.reactionSync = 'local';
    } finally {
      root.classList.remove('is-saving');
    }
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const slug = entry.target.dataset.paperSlug;
          if (slug) loadCounts(entry.target, slug);
        });
      }, { rootMargin: '220px 0px' })
    : null;

  function initRoot(root) {
    if (initialized.has(root)) return;
    initialized.add(root);

    const slug = root.dataset.paperSlug;
    if (!slug) return;

    setPressed(root, getSelected(slug));

    root.addEventListener('click', event => {
      const button = event.target.closest('[data-reaction]');
      if (!button || !root.contains(button)) return;
      react(root, slug, button.dataset.reaction);
    });

    if (observer) observer.observe(root);
    else loadCounts(root, slug);
  }

  function scan() {
    document.querySelectorAll('[data-reader-reactions][data-paper-slug]').forEach(initRoot);
  }

  addEventListener('publications:rendered', scan);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }
})();
