# umairdanish.com

Personal research website of **Muhammad Umair Danish, PhD**.

## Deploy

1. Upload every file and folder in this repository to the `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The included workflow publishes the site after every push to `main`.
5. In **Settings → Pages → Custom domain**, enter `umairdanish.com` after DNS is configured.

## Main content files

- `index.html` — homepage
- `research.html` — research program
- `publications.html` — filterable publication list
- `teaching.html` — teaching profile
- `cv.html` — CV overview
- `contact.html` — contact page
- `assets/data/publications.json` — structured publication data
- `assets/docs/Muhammad_Umair_Danish_CV.pdf` — downloadable CV

## Updating publications

The current site is fully static for speed and reliability. Update the publication entries in `publications.html`, the corresponding page under `publications/`, and `assets/data/publications.json`. A future generator can automate these updates from the JSON file.
