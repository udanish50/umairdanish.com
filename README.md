# umairdanish.com

Academic website for Muhammad Umair Danish, PhD.

## Design

V11.1 retains the V11 light, editorial academic system with Source Serif 4 for headings and Inter for interface/body text. The information architecture prioritizes identity, research impact, research areas, milestones, and collaboration.

## Data

- `assets/data/publications.json` — publication metadata
- `assets/data/scholar-metrics.json` — cached Google Scholar snapshot
- `assets/data/search-index.json` — local site search
- `assets/data/news.json` — milestones

## Automation

`.github/workflows/refresh-scholar.yml` runs the Scholar refresh script in `scripts/update_scholar.py`.

## Accessibility and performance

The site uses semantic headings, visible keyboard focus, a skip link, responsive navigation, reduced-motion support, image containment, and lightweight JavaScript.

## Latest content update

Added the July 27, 2026 acceptance of “Dispersity Measures Within Sessions During Improvised Active Music Therapy with Clients with Parkinson’s Disease” in *Approaches: An Interdisciplinary Journal of Music Therapy*. The editor indicated that copyediting would follow; final bibliographic metadata remains intentionally unset until publication details are public.
## Publication resources (V13)

Publication records now expose publisher/journal or conference links, author-hosted PDF copies where available from Western University, and mapped research-code repositories. Large PDFs are linked but intentionally not precached by the service worker. DeepMEX is not attached to an archival publication entry because its public repository explicitly identifies the associated manuscript as under peer review and withholds bibliographic metadata.

## V13.1 mobile refinement

V13.1 preserves the desktop academic design and V13 publication resources while adding a mobile-only refinement layer (`assets/css/mobile-v13-1.css`). The layer activates only at widths of 900 px and below and improves navigation, typography, publication cards, research sections, collaborator cards, publication-detail resources, contact actions, footers, safe-area handling, and narrow-screen overflow. Desktop layout and content are intentionally unchanged.


## Mobile refinement update

V13.2 refines the mobile experience without altering the desktop design. The update reduces oversized mobile portraits and collaborator images, tightens mobile figure heights, improves footer and metric-note contrast, and bumps the service-worker cache version so the refreshed CSS appears reliably after deployment.


V13.3: reduced mobile portrait scale and prevented cropping of editorial publication visuals.


V13.4: homepage credibility strip now shows journal-paper and conference-paper totals instead of the Best Paper tile.


V13.5: homepage research-metrics strip replaces Scholar works with 4 Awards, matching the four awards/distinctions currently listed on the About page.


V13.6: added a responsive live Global Reach visitor-map section to the About page using the user-provided Flag Counter txBY counter.


## V14 live research intelligence

Adds isolated, responsive live components without changing the established page design: a Google-Scholar citation leaderboard and live paper-view ranking on Publications; open-research-software statistics and GitHub activity on Research; and an academic journey timeline on About. Publication page views use a lightweight public CounterAPI counter, limited in-browser to one increment per paper per day. GitHub activity uses only public unauthenticated repository metadata. MidiPy version/download figures are requested from PyPI/PyPI Stats with graceful fallbacks.


V14.1: removed the publication-count milestone from Academic Journey and added anonymous academic reader reactions to all publication detail pages.


V14.3: moved reader reactions from publication detail pages into compact controls in the All Publications archive; removed the requested conference record from all website publication records and the downloadable CV; totals now reflect 19 published/accepted works and 9 conference papers.


V14.4: About biography rewritten in first person (I / my) with design and all other content preserved.


V14.5: removed the duplicate Top Research Impact card section from Publications; the live Citation Leaderboard is now the single most-cited-work section.


V14.6: fixed shared reader-reaction persistence. Local selection is now committed only after the remote shared counter confirms success; failures remain retryable and are visibly reported.


### V14.7 — VisualVerity resources and cleaner trending copy

Added the VisualVerity code repository and the CC BY 4.0 TechRxiv preprint PDF to the Unified Evaluation publication. Removed the redundant final disclosure sentence beneath Trending on This Site. Trending remains based on genuine page visits; no synthetic popularity counts are seeded.




## V19.2 Software architecture

Added **Software** as a standalone primary-navigation destination (`/software.html`) with a data-driven catalog (`assets/data/software.json`) designed for future software entries. Core-Norm moved from Research to `/software/core-norm/`. The Core-Norm page now fetches public verification datasets and all archived benchmark rows directly from `udanish50/Core-Norm` on GitHub, verifies dataset SHA-256 digests in the browser, runs forward/inverse property checks locally, and exposes a filterable full-run evidence explorer. The old Research URL is retained only as a redirect.


## V20.1 Core-Norm analysis and HCI refinement

Refined the standalone Core-Norm software page around an Understand → Analyze → Compare → Verify workflow. Added plain-language definitions of central C and residual R, a fully annotated formula sequence and symbol guide, a worked inverse-preserving example, a prominent local CSV analysis workflow with per-feature diagnostics, uploaded-data scaler-behavior comparisons, an automatic GitHub-backed benchmark comparison across established normalization methods, and clearer separation between descriptive scaling behavior, mathematical verification, and predictive benchmark evidence. Accessibility refinements include explicit control labels, keyboard-visible focus, status regions, readable math typography, and progressive disclosure.

## V21 Linear Lens software

Adds Linear Lens as a second first-class Software product at `/software/linear-lens/`. The page explains the peer-reviewed non-interventional method with progressive disclosure, supports GitHub-hash-verified live analysis across 45 public verification datasets, provides a local CSV + exported dense-model analyzer, exposes the public evidence suite, and clearly separates live, archived, and published evidence.
