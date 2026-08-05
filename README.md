# umairdanish.com

A custom, zero-dependency academic research website for **Muhammad Umair Danish, PhD**, Postdoctoral Fellow in Applied AI at Western University.

## Design goals

- Present research with the visual clarity of a leading AI lab while retaining the rigor of an academic record.
- Put newly accepted and published work at the centre of the experience.
- Keep the site fast, accessible, responsive, and deployable as plain static files on GitHub Pages.
- Make scholarly impact transparent: live citation and author metrics are requested from OpenAlex using the public ORCID record, with a static snapshot as fallback.

## Main features

- Interactive publication browser with topic, status, and type filters.
- Live OpenAlex citation badges, h-index, i10-index, citation history, and latest indexed work.
- Individual, citable publication pages with scholarly metadata, BibTeX, and copyable references.
- Research map, news timeline, media gallery, teaching portfolio, HTML CV, and downloadable PDF CV.
- Command-palette search (`⌘K` / `Ctrl+K`), dark mode, responsive navigation, PWA shell, semantic HTML, and reduced-motion support.
- Structured data (`Person` and `ScholarlyArticle`), Google Scholar citation metadata, sitemap, Open Graph, and Twitter cards.

## Architecture

The site uses hand-authored HTML, CSS, JSON, and vanilla JavaScript. There is no build step and no external framework. GitHub Pages publishes the repository root directly.

- `assets/data/publications.json` — authoritative website publication data
- `assets/data/news.json` — news and milestone data
- `assets/js/impact.js` — OpenAlex integration and live scholarly metrics
- `assets/js/publications.js` — interactive publication filtering and sorting
- `assets/js/site.js` — navigation, search, theme, accessibility, and interactions
- `publications/<slug>/` — stable publication landing pages

## Scholarly-metric note

Citation counts vary across Google Scholar, OpenAlex, Scopus, and Web of Science because their coverage and deduplication methods differ. The website labels the live source and links to Google Scholar for comparison.

## Content ownership

Text, photography, and personal research materials are © Muhammad Umair Danish unless a linked publication or external source states otherwise. Code for the website may be reused with attribution, but personal content and images should be replaced.
