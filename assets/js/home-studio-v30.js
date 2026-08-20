(() => {
  "use strict";

  const body = document.body;
  const menuButton = document.querySelector(".hc-menu-toggle");
  const nav = document.querySelector(".hc-nav");

  function closeMenu() {
    if (!menuButton || !nav) return;
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    body.classList.remove("nav-open");
  }

  menuButton?.addEventListener("click", () => {
    if (!nav) return;
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    body.classList.toggle("nav-open", open);
  });

  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMenu(); }, { passive: true });

  const number = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : null;

  async function loadScholarSnapshot() {
    const note = document.getElementById("hs-scholar-note");
    try {
      const response = await fetch("/assets/data/scholar-metrics.json?home=v30", { cache: "no-store" });
      if (!response.ok) throw new Error("Scholar snapshot unavailable");
      const data = await response.json();
      const metrics = data.metrics || {};
      const set = (selector, value) => {
        const formatted = number(value);
        const element = document.querySelector(selector);
        if (formatted !== null && element) element.textContent = formatted;
      };
      set('[data-scholar="citations"]', metrics.citations?.all);
      set('[data-scholar="hindex"]', metrics.h_index?.all);
      set('[data-scholar="articles"]', metrics.article_count);

      const articleMap = {
        karn: /Kolmogorov.*Arnold recurrent network/i,
        glips: /Global-local image perceptual score|GLIPS/i,
        unified: /Towards a unified evaluation framework/i
      };
      const articles = Array.isArray(data.articles) ? data.articles : [];
      for (const [key, matcher] of Object.entries(articleMap)) {
        const item = articles.find(article => matcher.test(String(article.title || "")));
        const element = document.querySelector(`[data-paper-citations="${key}"]`);
        const formatted = number(item?.citations);
        if (element && formatted !== null) element.textContent = formatted;
      }

      const stamp = data.updated_at || data.snapshot_at;
      if (note && stamp) {
        const date = new Date(stamp);
        if (!Number.isNaN(date.valueOf())) {
          note.textContent = `Verified Google Scholar snapshot · updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
        }
      }
    } catch (_) {
      if (note) note.textContent = "Verified Google Scholar snapshot";
    }
  }

  async function loadSoftwareCount() {
    try {
      const response = await fetch("/assets/data/software.json?home=v30", { cache: "no-store" });
      if (!response.ok) throw new Error("Software catalog unavailable");
      const data = await response.json();
      const count = Array.isArray(data.software) ? data.software.length : null;
      const element = document.querySelector("[data-software-count]");
      if (element && Number.isFinite(count)) element.textContent = String(count);
    } catch (_) {}
  }

  function relativeTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return "Open source";
    const days = Math.max(0, Math.floor((Date.now() - date.valueOf()) / 86400000));
    if (days === 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days < 30) return `Updated ${days}d ago`;
    const months = Math.max(1, Math.floor(days / 30));
    return `Updated ${months}mo ago`;
  }

  /* LIVE means exactly that: the badge is hidden unless the page receives
     fresh repository metadata from GitHub during this visit. */
  async function loadLiveGitHubActivity() {
    const liveBadge = document.querySelector("[data-live-github]");
    try {
      const response = await fetch("https://api.github.com/users/udanish50/repos?per_page=100&sort=updated", {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("GitHub API unavailable");
      const repos = await response.json();
      if (!Array.isArray(repos)) throw new Error("Unexpected GitHub response");
      const byName = new Map(repos.map(repo => [String(repo.name || "").toLowerCase(), repo]));
      let updated = 0;
      document.querySelectorAll("[data-repo]").forEach(card => {
        const repo = byName.get(String(card.dataset.repo || "").toLowerCase());
        const status = card.querySelector("[data-repo-status]");
        if (repo && status) {
          status.textContent = relativeTime(repo.pushed_at || repo.updated_at);
          updated += 1;
        }
      });
      if (updated > 0 && liveBadge) liveBadge.hidden = false;
    } catch (_) {
      if (liveBadge) liveBadge.hidden = true;
    }
  }

  loadScholarSnapshot();
  loadSoftwareCount();
  loadLiveGitHubActivity();
})();
