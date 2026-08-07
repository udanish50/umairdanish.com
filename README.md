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
