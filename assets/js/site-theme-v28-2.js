(() => {
  "use strict";

  const STORAGE_KEY = "ud-appearance";
  const LEGACY_KEY = "theme";
  const ALLOWED = new Set(["system", "light", "dark", "night"]);
  const systemQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  let controlCount = 0;

  const MODE = {
    system: {
      label: "System",
      note: "Follow this device",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
    },
    light: {
      label: "Light",
      note: "Bright academic theme",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>'
    },
    dark: {
      label: "Dark",
      note: "Reduced-brightness dark",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>'
    },
    night: {
      label: "Night",
      note: "Lowest-luminance reading",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 15.7A7.7 7.7 0 0 1 8.3 5.8 7.7 7.7 0 1 0 18.2 15.7Z"/><path d="m17.7 4 .5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z"/></svg>'
    }
  };

  const triggerIcon =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17Z"/></svg>';

  function storedMode() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return ALLOWED.has(value) ? value : "system";
    } catch (_) {
      return "system";
    }
  }

  function effectiveTheme(mode) {
    if (mode === "night") return "night";
    if (mode === "dark") return "dark";
    if (mode === "light") return "light";
    return systemQuery?.matches ? "dark" : "light";
  }

  function apply(mode, persist = false) {
    mode = ALLOWED.has(mode) ? mode : "system";
    const effective = effectiveTheme(mode);
    const root = document.documentElement;

    root.dataset.themeMode = mode;
    root.dataset.theme = effective;
    root.style.colorScheme = effective === "light" ? "light" : "dark";

    // Compatibility with the homepage's older light/dark helper.
    try {
      localStorage.setItem(LEGACY_KEY, effective === "night" ? "dark" : effective);
      if (persist) localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {}

    syncControls(mode);
    document.dispatchEvent(
      new CustomEvent("ud:themechange", {
        detail: { mode, effective }
      })
    );
  }

  function optionButton(key) {
    const meta = MODE[key];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "v282-appearance-option";
    button.dataset.themeChoice = key;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.innerHTML =
      `<span class="v282-option-icon">${meta.icon}</span>` +
      `<span class="v282-option-copy"><strong>${meta.label}</strong><small>${meta.note}</small></span>` +
      '<span class="v282-option-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8"/></svg></span>';
    button.addEventListener("click", () => {
      apply(key, true);
      closeAll();
    });
    return button;
  }

  function createControl(kind = "nav") {
    const id = `v282-appearance-menu-${++controlCount}`;
    const wrap = document.createElement("div");
    wrap.className = `v282-appearance v282-appearance--${kind}`;
    wrap.dataset.v282Appearance = "";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "v282-appearance-trigger";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", id);
    trigger.setAttribute("aria-haspopup", "true");
    trigger.innerHTML =
      `<span class="v282-trigger-icon">${triggerIcon}</span>` +
      '<span class="v282-trigger-label">Appearance</span>' +
      '<span class="v282-trigger-current" data-v282-current>System</span>' +
      '<svg class="v282-trigger-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>';

    const menu = document.createElement("div");
    menu.className = "v282-appearance-menu";
    menu.id = id;
    menu.hidden = true;
    menu.setAttribute("role", "radiogroup");
    menu.setAttribute("aria-label", "Appearance");

    const heading = document.createElement("div");
    heading.className = "v282-appearance-heading";
    heading.innerHTML =
      '<strong>Appearance</strong><small>Choose how this site looks on this device.</small>';
    menu.appendChild(heading);

    ["system", "light", "dark", "night"].forEach(key => menu.appendChild(optionButton(key)));

    trigger.addEventListener("click", event => {
      event.stopPropagation();
      const open = menu.hidden;
      closeAll(wrap);
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      wrap.classList.toggle("is-open", open);
      if (open) {
        const selected = menu.querySelector('[aria-checked="true"]');
        selected?.focus({ preventScroll: true });
      }
    });

    wrap.append(trigger, menu);
    return wrap;
  }

  function closeControl(wrap, returnFocus = false) {
    const trigger = wrap.querySelector(".v282-appearance-trigger");
    const menu = wrap.querySelector(".v282-appearance-menu");
    if (!trigger || !menu || menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    wrap.classList.remove("is-open");
    if (returnFocus) trigger.focus();
  }

  function closeAll(except = null) {
    document.querySelectorAll("[data-v282-appearance]").forEach(wrap => {
      if (wrap !== except) closeControl(wrap);
    });
  }

  function syncControls(mode = storedMode()) {
    document.querySelectorAll("[data-v282-appearance]").forEach(wrap => {
      const current = wrap.querySelector("[data-v282-current]");
      if (current) current.textContent = MODE[mode]?.label || "System";
      const trigger = wrap.querySelector(".v282-appearance-trigger");
      if (trigger) trigger.setAttribute("aria-label", `Appearance: ${MODE[mode]?.label || "System"}`);
      wrap.querySelectorAll("[data-theme-choice]").forEach(button => {
        const selected = button.dataset.themeChoice === mode;
        button.setAttribute("aria-checked", String(selected));
        button.classList.toggle("is-selected", selected);
      });
    });
  }

  function mount() {
    // Homepage: hide the old binary toggle only after replacement controls exist.
    const oldHomeToggle = document.querySelector(".hc-theme-toggle");

    const homeActions = document.querySelector(".hc-header-actions");
    if (homeActions && !homeActions.querySelector(".v282-appearance--home-desktop")) {
      const control = createControl("home-desktop");
      const collaborate = homeActions.querySelector(".hc-header-collab, .hc-header-cv");
      homeActions.insertBefore(control, collaborate || homeActions.firstChild);
    }

    const homeNav = document.querySelector(".hc-nav");
    if (homeNav && !homeNav.querySelector(".v282-appearance--home-mobile")) {
      const control = createControl("home-mobile");
      const mobileAction = homeNav.querySelector(".hc-mobile-cv");
      homeNav.insertBefore(control, mobileAction || null);
    }

    // Standard academic pages: before Search on desktop; same element lives inside mobile nav.
    document.querySelectorAll(".site-header .nav").forEach(nav => {
      if (nav.querySelector("[data-v282-appearance]")) return;
      const control = createControl("nav");
      const search = nav.querySelector(".search-trigger");
      nav.insertBefore(control, search || null);
    });

    // Tools/privacy/terms family: last utility in the existing responsive navigation.
    document.querySelectorAll(".tools-nav").forEach(nav => {
      if (nav.querySelector("[data-v282-appearance]")) return;
      nav.appendChild(createControl("nav"));
    });

    if (document.querySelector("[data-v282-appearance]") && oldHomeToggle) {
      // The V28 appearance selector fully supersedes the legacy binary moon/sun button.
      // Remove it from the runtime DOM so there is exactly one appearance control.
      oldHomeToggle.remove();
    }

    syncControls(storedMode());
  }

  document.addEventListener("click", event => {
    if (!event.target.closest("[data-v282-appearance]")) closeAll();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const open = [...document.querySelectorAll("[data-v282-appearance]")].find(
        wrap => !wrap.querySelector(".v282-appearance-menu")?.hidden
      );
      if (open) {
        event.preventDefault();
        closeControl(open, true);
      }
    }
  });

  systemQuery?.addEventListener?.("change", () => {
    if (storedMode() === "system") apply("system", false);
  });

  // The small inline boot script already applied the initial effective theme.
  // Re-apply after all older page scripts have initialized, then mount controls.
  apply(storedMode(), false);
  mount();
})();