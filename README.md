# Matyáš Galda — concept art portfolio

Live site (GitHub Pages): https://vojvanik-ctrl.github.io/Matyas-galda/
In the FMK student gallery: https://studentifmk.work/matyas-galda/ (once added to the gallery)

## What is where

| Path | What it is |
| --- | --- |
| `index.html` | Homepage: hero, Selected work carousel, About, CV, Contact |
| `last-breath.html`, `forgotten-realms.html`, `ferrugo.html` | Project pages |
| `assets/` | Everything the pages load: images, hero video, fonts, CSS, JS |
| `portfolio.json` | Profile manifest for the FMK student gallery (studentifmk.work) |
| `assets/fmk/` | Portraits for the gallery: `portrait-original.jpg`, `portrait-stamp.png` |
| `404.html`, `favicon.svg`, `.nojekyll` | Error page, tab icon, tells GitHub Pages to serve the files as they are |
| `source/` | The editable project that generates all of the above (see `source/README.md`) |

The files at the top level are generated. GitHub Pages publishes them directly, so `index.html` is served at the address above. Do not edit them by hand.

## How to change the site

1. Edit the content in `source/src/data/` (`projects.json`, `site.json`) or the styles in `source/src/`.
2. Run, inside `source/`:
   ```bash
   npm install
   npm run publish:root
   ```
   This builds the site and copies the result to the repository root.
3. Commit, then push to both branches:
   ```bash
   git push origin main main:gh-pages
   ```
   GitHub Pages updates within a minute or two.

## GitHub Pages setting

The site is published from the **`gh-pages`** branch, root folder. That branch holds the same commit as `main`; GitHub switched Pages on automatically when it was created. To publish straight from `main` instead, set Settings → Pages → Build and deployment → Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)**. After that, `gh-pages` can be deleted and a plain `git push` is enough.

## FMK gallery manifest

`portfolio.json` lives next to `index.html`. Its portrait paths (`assets/fmk/...`) are relative, so they work at github.io and through studentifmk.work. `portfolioUrl` stays `null` until the gallery address is live. Then set it to `https://studentifmk.work/matyas-galda/` in `source/public/portfolio.json` and run `npm run publish:root` again.
