(() => {
  'use strict';

  /* V15: shared reactions backed by Cloudflare Worker + D1. */

  const API = 'https://umairdanish-reader-reactions.umairdanish.workers.dev';
  const REACTIONS = ['insightful', 'useful', 'appreciated'];
  const initialized = new WeakSet();
  const VOTER_KEY = 'ud-reader-reactions:v15:voter-id';
  const SELECTION_PREFIX = 'ud-reader-reaction:v15:';

  function voterId() {
    try {
      let id = localStorage.getItem(VOTER_KEY);
      if (id) return id;
      id = (globalThis.crypto && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VOTER_KEY, id);
      return id;
    } catch (_) {
      return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    }
  }

  function selectionKey(slug) {
    return `${SELECTION_PREFIX}${slug}`;
  }

  function getSelected(slug) {
    try {
      const value = localStorage.getItem(selectionKey(slug));
      return REACTIONS.includes(value) ? value : '';
    } catch (_) {
      return '';
    }
  }

  function saveSelected(slug, reaction) {
    try {
      localStorage.setItem(selectionKey(slug), reaction);
    } catch (_) {}
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
    if (!response.ok || !data.ok) throw new Error(data.error || `Reaction service returned ${response.status}`);
    return data;
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
    if (node) node.textContent = Number(value || 0).toLocaleString();
  }

  function applyCounts(root, counts) {
    REACTIONS.forEach(reaction => setCount(root, reaction, counts?.[reaction] ?? 0));
  }

  function setStatus(root, message = '', state = '') {
    root.dataset.reactionState = state;
    const status = root.querySelector('[data-reaction-status]');
    if (status) status.textContent = message;
  }

  async function loadCounts(root, slug) {
    root.classList.add('is-loading');
    try {
      const data = await api(`/counts?slug=${encodeURIComponent(slug)}`);
      applyCounts(root, data.counts);
      setStatus(root, '', 'shared');
    } catch (_) {
      REACTIONS.forEach(reaction => {
        const node = root.querySelector(`[data-reaction-count="${reaction}"]`);
        if (node && !/^\d/.test(node.textContent.trim())) node.textContent = '0';
      });
      setStatus(root, 'Reactions temporarily unavailable', 'error');
    } finally {
      root.classList.remove('is-loading');
    }
  }

  async function react(root, slug, reaction) {
    const previous = getSelected(slug);
    if (previous === reaction) return;

    root.classList.add('is-saving');
    setDisabled(root, true);
    setStatus(root, 'Saving…', 'saving');

    try {
      const data = await api('/react', {
        method: 'POST',
        body: JSON.stringify({ slug, reaction, voter_id: voterId() })
      });
      saveSelected(slug, reaction);
      setPressed(root, reaction);
      applyCounts(root, data.counts);
      setStatus(root, 'Saved', 'shared');
      window.setTimeout(() => {
        if (root.dataset.reactionState === 'shared') setStatus(root, '', 'shared');
      }, 1200);
    } catch (_) {
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

  addEventListener('publications:rendered', scan);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }
})();
