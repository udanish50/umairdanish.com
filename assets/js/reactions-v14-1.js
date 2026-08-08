(() => {
  'use strict';

  const API = 'https://api.counterapi.dev/v1/umairdanish-com-reader-reactions';
  const REACTIONS = ['insightful', 'useful', 'appreciated'];

  const valueOf = data => {
    const raw = data?.value ?? data?.count ?? data?.data?.value ?? data?.data?.count ?? 0;
    const number = Number(raw);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  };

  const paperSlug = () => {
    const match = location.pathname.match(/^\/publications\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  const counterName = (slug, reaction) => `${slug}--${reaction}`;
  const endpoint = (slug, reaction, action = '') => {
    const name = encodeURIComponent(counterName(slug, reaction));
    return `${API}/${name}/${action}`.replace(/\/$/, action ? '' : '/');
  };

  async function request(url) {
    const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
    if (!response.ok) throw new Error(`Reaction service returned ${response.status}`);
    return response.json();
  }

  function selectedKey(slug) {
    return `ud-reader-reaction:${slug}`;
  }

  function getSelected(slug) {
    try {
      const value = localStorage.getItem(selectedKey(slug));
      return REACTIONS.includes(value) ? value : '';
    } catch (_) {
      return '';
    }
  }

  function saveSelected(slug, reaction) {
    try { localStorage.setItem(selectedKey(slug), reaction); } catch (_) {}
  }

  function setPressed(root, selected) {
    root.querySelectorAll('[data-reaction]').forEach(button => {
      const active = button.dataset.reaction === selected;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('is-selected', active);
    });
  }

  function setBusy(root, busy) {
    root.querySelectorAll('[data-reaction]').forEach(button => {
      button.disabled = busy;
      button.classList.toggle('is-busy', busy);
    });
  }

  function setCount(root, reaction, value) {
    const node = root.querySelector(`[data-reaction-count="${reaction}"]`);
    if (node) node.textContent = Number(value).toLocaleString();
  }

  async function loadCounts(root, slug) {
    await Promise.all(REACTIONS.map(async reaction => {
      try {
        const data = await request(endpoint(slug, reaction));
        setCount(root, reaction, valueOf(data));
      } catch (_) {
        setCount(root, reaction, 0);
      }
    }));
  }

  async function react(root, slug, reaction) {
    const status = root.querySelector('[data-reaction-status]');
    const previous = getSelected(slug);
    if (previous === reaction) {
      if (status) status.textContent = 'Your reaction is already recorded on this browser.';
      return;
    }

    setBusy(root, true);
    if (status) status.textContent = previous ? 'Updating your reaction…' : 'Recording your reaction…';

    let previousDown = null;
    try {
      if (previous) {
        previousDown = await request(endpoint(slug, previous, 'down'));
        setCount(root, previous, valueOf(previousDown));
      }

      const nextUp = await request(endpoint(slug, reaction, 'up'));
      setCount(root, reaction, valueOf(nextUp));
      saveSelected(slug, reaction);
      setPressed(root, reaction);
      if (status) status.textContent = 'Thank you — your reader reaction has been recorded.';
    } catch (_) {
      if (previous && previousDown) {
        try {
          const restored = await request(endpoint(slug, previous, 'up'));
          setCount(root, previous, valueOf(restored));
        } catch (_) {}
      }
      setPressed(root, previous);
      if (status) status.textContent = 'Reactions are temporarily unavailable. Please try again later.';
    } finally {
      setBusy(root, false);
    }
  }

  async function init() {
    const root = document.querySelector('[data-reader-reactions]');
    const slug = paperSlug();
    if (!root || !slug) return;

    const selected = getSelected(slug);
    setPressed(root, selected);

    root.querySelectorAll('[data-reaction]').forEach(button => {
      button.addEventListener('click', () => react(root, slug, button.dataset.reaction));
    });

    await loadCounts(root, slug);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
