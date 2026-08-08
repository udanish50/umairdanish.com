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
