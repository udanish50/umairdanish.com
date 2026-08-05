# umairdanish.com

The official research website of **Muhammad Umair Danish, PhD**, Postdoctoral Fellow in Applied AI at Western University.

## Purpose

The site presents a coherent research programme across mechanistic interpretability, human-centered explainable AI, reliable temporal learning, physics-guided machine learning, and evaluation of generative systems. It is designed as a fast, accessible, publication-first academic profile rather than a general-purpose portfolio.

## Experience

- Editorial, research-led visual system with responsive layouts and dark mode
- Interactive publication search, filters, citation sorting, and stable paper landing pages
- Research map, milestones, media gallery, teaching record, HTML CV, and downloadable PDF CV
- Command-palette search (`⌘K` / `Ctrl+K`), reduced-motion support, semantic HTML, structured data, sitemap, and social previews
- Progressive Web App shell with network-first caching

## Google Scholar metrics

The repository contains a last-known-good public snapshot at `assets/data/scholar-metrics.json`. A scheduled GitHub Actions workflow refreshes it once every 24 hours using the Google Scholar Author endpoint provided by SerpApi.

The workflow updates:

- total citations and recent citations
- h-index and i10-index
- annual citation history
- article-level citation badges
- latest Scholar-indexed work
- refresh timestamp

The SerpApi credential is held only as the encrypted repository secret `SERPAPI_KEY`; it is never exposed in browser JavaScript or committed to the repository. If a refresh fails or returns an invalid response, the previous verified snapshot remains in place.

## Architecture

The website uses static HTML, CSS, JSON, SVG, and vanilla JavaScript. There is no runtime framework or database.

- `assets/data/publications.json` — curated publication records
- `assets/data/scholar-metrics.json` — last verified Google Scholar snapshot
- `assets/data/news.json` — research news and milestones
- `assets/js/impact.js` — renders Scholar metrics and article-level citations
- `assets/js/publications.js` — publication search, filtering, and sorting
- `scripts/update_scholar.py` — validates and writes the daily Scholar snapshot
- `.github/workflows/refresh-scholar.yml` — daily refresh and Pages rebuild request
- `publications/<slug>/` — stable, citable publication landing pages

## Data integrity

Accepted work is labelled separately from formally published work. Citation metrics are explicitly attributed to Google Scholar. The automation never overwrites a valid snapshot with an empty or malformed response.

## Content ownership

Text, photography, CV material, and research content are © Muhammad Umair Danish unless an external publication or linked source states otherwise. The website code may be adapted with attribution, but personal photographs and research materials must be replaced.
