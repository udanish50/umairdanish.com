(() => {
  'use strict';

  /* V14.8: missing counters render as zero; each count loads independently. */

  const API = 'https://api.counterapi.dev/v1/umairdanish-com-reader-reactions';
  const REACTIONS = ['insightful', 'useful', 'appreciated'];
  const initialized = new WeakSet();
  const MIGRATION_KEY = 'ud-reader-reactions:v14-6-migrated';
  const BUILD = 'v14.8';

  function valueOf(data) {
    const raw = data?.value ?? data?.count ?? data?.data?.value ?? data?.data?.count;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  }

  function storageKey(slug) {
    return `ud-reader-reaction:v14-6:${slug}`;
  }

  function legacyStorageKey(slug) {
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
      if (reaction) localStorage.setItem(storageKey(slug), reaction);
      else localStorage.removeItem(storageKey(slug));
    } catch (_) {}
  }

  function migrateLegacySelections() {
    try {
      if (localStorage.getItem(MIGRATION_KEY)) return;
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ud-reader-reaction:') && !key.startsWith('ud-reader-reaction:v14-6:')) keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
      localStorage.setItem(MIGRATION_KEY, '1');
    } catch (_) {}
  }

  function endpoint(slug, reaction, action = '') {
    const counter = encodeURIComponent(`${slug}--${reaction}`);
    return action ? `${API}/${counter}/${action}` : `${API}/${counter}`;
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function request(url, attempts = 3, options = {}) {
    const { notFoundAsZero = false } = options;
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`, {
          cache: 'no-store',
          mode: 'cors',
          headers: { Accept: 'application/json' }
        });
        if (response.status === 404 && notFoundAsZero) return { value: 0, missing: true };
        if (response.status === 429) throw new Error('Reaction service rate limit reached');
        if (!response.ok) throw new Error(`Reaction service returned ${response.status}`);
        const data = await response.json();
        if (valueOf(data) === null) throw new Error('Reaction service returned an invalid count');
        return data;
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await wait(500 * (attempt + 1));
      }
    }
    throw lastError || new Error('Reaction service unavailable');
  }

  function setPressed(root, current) {
    root.querySelectorAll('[data-reaction]').forEach(button => {
      const active = button.dataset.reaction === current;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('is-selected', active);
    });
  }

  function setDisabled(root, disabled) {
    root.querySelectorAll('[data-reaction]').forEach(button => {
      button.disabled = disabled;
    });
  }

  function setCount(root, reaction, value) {
    const node = root.querySelector(`[data-reaction-count="${reaction}"]`);
    if (node) node.textContent = value === null ? '—' : Number(value).toLocaleString();
  }

  function setStatus(root, message = '', state = '') {
    root.dataset.reactionState = state;
    const status = root.querySelector('[data-reaction-status]');
    if (status) status.textContent = message;
  }

  async function loadCounts(root, slug) {
    root.classList.add('is-loading');
    const results = await Promise.allSettled(
      REACTIONS.map(reaction => request(endpoint(slug, reaction), 2, { notFoundAsZero: true }))
    );

    let available = 0;
    REACTIONS.forEach((reaction, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        setCount(root, reaction, valueOf(result.value));
        available += 1;
      } else {
        setCount(root, reaction, null);
      }
    });

    setStatus(root, '', available ? 'shared' : 'error');
    root.classList.remove('is-loading');
  }

  async function react(root, slug, reaction) {
    const previous = getSelected(slug);
    if (previous === reaction) return;

    const oldCounts = {};
    REACTIONS.forEach(name => {
      const node = root.querySelector(`[data-reaction-count="${name}"]`);
      const value = Number(String(node?.textContent || '').replace(/,/g, ''));
      oldCounts[name] = Number.isFinite(value) ? value : null;
    });

    root.classList.add('is-saving');
    setDisabled(root, true);
    setStatus(root, 'Saving…', 'saving');

    try {
      const nextData = await request(endpoint(slug, reaction, 'up'), 3);
      const nextValue = valueOf(nextData);
      setCount(root, reaction, nextValue);

      if (previous) {
        try {
          const previousData = await request(endpoint(slug, previous, 'down'), 3);
          setCount(root, previous, valueOf(previousData));
        } catch (_) {
          await request(endpoint(slug, reaction, 'down'), 2).catch(() => {});
          throw new Error('Could not move reaction safely');
        }
      }

      saveSelected(slug, reaction);
      setPressed(root, reaction);
      setStatus(root, 'Saved', 'shared');
      window.setTimeout(() => {
        if (root.dataset.reactionState === 'shared') setStatus(root, '', 'shared');
      }, 1400);
    } catch (_) {
      REACTIONS.forEach(name => setCount(root, name, oldCounts[name]));
      setPressed(root, previous);
      setStatus(root, 'Could not save — tap again to retry', 'error');
    } finally {
      setDisabled(root, false);
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
      }, { rootMargin: '160px 0px' })
    : null;

  function initRoot(root) {
    if (initialized.has(root)) return;
    initialized.add(root);

    const slug = root.dataset.paperSlug;
    if (!slug) return;

    setPressed(root, getSelected(slug));

    root.addEventListener('click', event => {
      const button = event.target.closest('[data-reaction]');
      if (!button || !root.contains(button) || button.disabled) return;
      react(root, slug, button.dataset.reaction);
    });

    if (observer) observer.observe(root);
    else loadCounts(root, slug);
  }

  function scan() {
    document.querySelectorAll('[data-reader-reactions][data-paper-slug]').forEach(initRoot);
  }

  migrateLegacySelections();
  addEventListener('publications:rendered', scan);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }
})();
