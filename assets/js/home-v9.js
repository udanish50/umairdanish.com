(() => {
  const architecture = {
    inside: {
      index: '01',
      domain: 'Inside the model',
      title: 'Mechanistic interpretability',
      summary: 'Trace concepts, representations, and predictive signals through neural networks without altering the deployed model.',
      question: 'Where does predictive information emerge inside the network?',
      methods: 'Representation tracing · probes · feature separability',
      href: '/research.html#interpretability'
    },
    human: {
      index: '02',
      domain: 'Explanations for people',
      title: 'Human-centered XAI',
      summary: 'Test whether explanations support understanding, appropriately calibrated trust, and better decisions rather than merely looking persuasive.',
      question: 'What explanation helps a person understand and act appropriately?',
      methods: 'Human studies · explanation modalities · trust calibration',
      href: '/research.html#human-centered'
    },
    temporal: {
      index: '03',
      domain: 'Robust real-world prediction',
      title: 'Reliable temporal learning',
      summary: 'Build adaptive, physics-guided, and heterogeneous learning systems for real-world time series where one pattern rarely fits every consumer or condition.',
      question: 'How can a model remain reliable across changing temporal contexts?',
      methods: 'Hypernetworks · learnable kernels · physics guidance · imputation',
      href: '/research.html#temporal'
    },
    evaluation: {
      index: '04',
      domain: 'Evidence that aligns with people',
      title: 'AI evaluation',
      summary: 'Align computational metrics with human perception, internal consistency, and application-level evidence so evaluation reflects the phenomenon that matters.',
      question: 'Does the metric measure what people and the application actually care about?',
      methods: 'Perceptual metrics · human ratings · consistency analysis',
      href: '/research.html#evaluation'
    }
  };

  const panel = document.querySelector('[data-architecture-panel]');
  const tabs = [...document.querySelectorAll('.architecture-v9-tab')];
  const set = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };

  function activate(key, focus = false) {
    const data = architecture[key];
    if (!data || !panel) return;
    tabs.forEach((tab) => {
      const active = tab.dataset.architecture === key;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      if (active && focus) tab.focus({preventScroll: true});
    });
    panel.classList.add('changing');
    window.setTimeout(() => {
      set('[data-architecture-index]', data.index);
      set('[data-architecture-domain]', data.domain);
      set('[data-architecture-title]', data.title);
      set('[data-architecture-summary]', data.summary);
      set('[data-architecture-question]', data.question);
      set('[data-architecture-methods]', data.methods);
      const link = document.querySelector('[data-architecture-link]');
      if (link) link.href = data.href;
      const flow = [...document.querySelectorAll('.architecture-v9-flow span')];
      flow.forEach((node, i) => node.classList.toggle('active', i === Number(data.index) - 1));
      panel.classList.remove('changing');
    }, 105);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.architecture));
    tab.addEventListener('mouseenter', () => {
      if (matchMedia('(hover:hover)').matches) activate(tab.dataset.architecture);
    });
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      activate(tabs[next].dataset.architecture, true);
    });
  });

  document.querySelectorAll('[data-spotlight-card]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
})();
