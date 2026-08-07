# umairdanish.com

Academic website for Muhammad Umair Danish, PhD.

## Design

V11 follows a light, editorial academic system with Source Serif 4 for headings and Inter for interface/body text. The information architecture prioritizes identity, research impact, research areas, milestones, and collaboration.

## Data

- `assets/data/publications.json` — publication metadata
- `assets/data/scholar-metrics.json` — cached Google Scholar snapshot
- `assets/data/search-index.json` — local site search
- `assets/data/news.json` — milestones

## Automation

`.github/workflows/refresh-scholar.yml` runs the Scholar refresh script in `scripts/update_scholar.py`.

## Accessibility and performance

The site uses semantic headings, visible keyboard focus, a skip link, responsive navigation, reduced-motion support, image containment, and lightweight JavaScript.
