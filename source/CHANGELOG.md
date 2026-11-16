# Changelog

## v8.1 — 16 Nov 2026: GitHub Pages layout

- The repository root now holds the built site: `index.html`, project pages, `assets/`, `portfolio.json` and `assets/fmk/`. GitHub Pages publishes it with "Deploy from a branch: main / (root)".
- The editable project moved to `source/`. `npm run publish:root` builds it and copies `dist/` to the root.
- Removed the GitHub Actions workflow, which needed a different Pages setting.

## v8 — 16 Nov 2026: Selected work carousel

### Selected work carousel
- Selected work is now a horizontal carousel: native scroll-snap does the moving (swipe, trackpad, Tab into a card), and previous/next buttons with a counter are added by `site.js`. No autoplay.
- **Desktop** shows two modules at a time, as in the approved first row, with the hairline divider. **Tablet** shows one module beside its text, with the next card peeking. **Phones** show one card with a peek; the buttons sit centred under the cards so the "Selected work" title keeps its rule.
- **Accessibility:** the section is a labelled carousel region, and each card is a "slide" group ("1 of 3"). The buttons use `aria-disabled` at the ends, so focus is not lost, and a polite status line announces "Showing projects 2 to 3 of 3" after a button press.
- **Without JavaScript** the row stays a normal horizontal scroller with a visible scrollbar.
- The page never scrolls sideways at 320–1440 px.

### Other changes
- Re-applied the v3 clean-ups that v4–v7 had dropped:
  - The hero video loads after the page `load` event.
  - `hero-panel.webp` is no longer shipped.
  - The dead four-frame loop code and `src/data/hero-animation.json` are removed.
  - `tools/serve.mjs` sends `video/mp4`.
- The hero video and still are the v7 files, unchanged.
- **Known issue in the v7 video:** in 13 of the 27 poses the forearm cutout's straight proximal end shows 3–6 px outside the sleeve seam as a thin dark vertical line. These are poses 8–18 and 26–27: pencil contact, both side strokes and short strokes. Rest, descent and lift (poses 1–5, 19–25) are clean.

## V7: crisp sleeve fabric edge

- Replaced the sleeve overlay's soft feather with a traced, solid cloth-side contour. Its edge is antialiased within about one pixel rather than fading into the parchment.
- Retained the v6 fixed clean plate, isolated arm, 27 stop-motion poses, 288-frame timing, two complete drawing gestures and reduced-motion still.
- Kept all page layout, project content, CV, paper corner and project navigation fixes.

## V6: clean arm and complete drawing gesture

- Removed the previous hand, pencil and forearm from the fixed plate rather than leaving old arm pixels under the moving cutout. The source sleeve covers the joint at every position.
- Used one fixed illustration for the head, torso, sketchbook, drawing and panel. The hand moves down, left, right, makes short strokes and lifts, then the cycle repeats. Every moving step holds for three 30 fps frames, the same 100 ms cadence as the previous descent.
- The website video is now 9.6 seconds with 288 presentation frames and 27 distinct rigid-cutout poses. The page art does not morph or jump between the four earlier whole drawings.
- Kept the paper corners, `Next project` spacing, project content, CV and FMK gallery manifest.

## v2 — 15 Nov 2026: approved four-view visualization

The existing v1 source was revised in place: same generator, same data files, same routes. The starter overrides in `reference/visual-revision-starter.css` were folded into `src/css/site.css` and adjusted after browser review; they are not appended as a second stylesheet.

### Composition
- The sheet is now `min(96vw, 1420px)` on a charcoal desk, with a 32–68 px gutter (24 px below 360 px wide). The homepage at 1440 px is about 2,000 px tall instead of about 4,050 px.
- **Hero:** 36 % text and 64 % illustration. The figure sits in a 3:2 panel using `hero-panel.webp`; the v1 double border and square box are gone. At 1440 × 900, "Selected work" and both first work modules are visible without scrolling.
- **Selected work:** compact modules (wide art, numbered handwritten title, short summary), two per row on desktop with a hairline divider. Ferrugo takes the next row in the same style. Under 980 px there is one module per row, art beside the text; under 600 px the art sits above the text. The uppercase metadata line and "View project →" were removed from cards; the whole card is still one link with a visible focus ring.
- **About and CV** sit side by side on desktop. The duplicate Projects list inside CV was removed. Spacing is tighter throughout.

### Hero animation
- The four supplied back-profile frames replace v1's eight front-facing ones (old frames 05–08 deleted). The supplied schedule gives a 7.5 s loop. The `<img>` dimensions (768 × 512) are read from `hero-animation.json`.
- The figure box is nudged down 3.2 % so the hoodie's cut meets the panel's drawn bottom line; nothing is cropped.
- `heroAlt` now describes the back-profile artist sketching on a large pad.
- **Note:** frame 1, the rest pose with the pen raised, holds the head about 11 px (1.4 % of the frame) more upright than frames 2–4. It reads as a small head lift between strokes. The supplied art was not altered.

### Type
- The headline uses **Marck Script**, a looser, slanted brush pen.
- Name, navigation, titles and labels use **Caveat SemiBold**. This is a legibility compromise: Marck Script's swash capitals turned "MATYÁŠ GALDA" and "CV" into ornaments and made "Last Breath" read like "£ast Breath".
- Body text stays EB Garamond. All three fonts are self-hosted under OFL, with Latin Extended for Á, Š and í. Caveat Brush was removed.
- The headline is two lines at every width, including 320 px. It is sized to its column with container query units.

### Paper and image surfaces
- **Sheet:** warm base `#d9aa75` with the supplied parchment, made seamless (`tools/make-seamless-parchment.py`), and only light edge shading. Text contrast rose to 7.1–9.3:1 for body ink.
- **Edge strips:** placed flush to the outside edge and multiplied at about 50 %, so they age the edge rather than drawing a second border. They never sit behind text. The build converts them to WebP: 640 KB of PNG becomes about 60 KB.
- **Artwork frames:** the `.plate` and `.plate--tabs` corner triangles were replaced by a fine, slightly uneven ink frame (9-slice SVG) on a warm paper mat from `media-mount.webp`, with its orange outer band cropped off.
- **Art left unfiltered:** no sepia or blend filters are applied to original art. The starter's multiply/sepia on the Last Breath key visual was left out, because the brief asks for the artwork to stay intact. Ferrugo keeps its colours.

### Covers
- `card.cover` was added for Last Breath and Forgotten Realms. The build copies `src/assets/covers/` and adds 640, 1000 and 1400 px versions. Card images use empty alt text because the linked title next to them names the project.
- Detail pages are unchanged in content and still show the original art and official Ferrugo screenshots.

### Project pages
- **Desktop:** title and intro (28 %), key visual (50 %), details with ruled labels (22 %), then "Project images" starting just below.
- **Mobile order:** back link, title and intro, key image, details, further images.
- **Image grid:** two per row. With an odd count, the first wide image takes a full row. Small images (Ferrugo's 480 px 3D-assets shot) are never upscaled.
- Ferrugo's itch.io and FMK UTB links and its credit line are kept.

### Unchanged
- `public/portfolio.json` is byte-identical, with `portfolioUrl: null`. Both portraits still resolve under a subfolder.
- Routes, menu behaviour, reduced-motion handling, privacy rules and the deploy workflow are unchanged.
# V3: hero motion and paper edge correction

- Replaced the four-pose held-frame loop with one 7.5-second, 225-frame, 30 fps H.264 video and a static WebP fallback. The hero panel is baked into both assets. Reduced-motion visitors receive the still.
- Removed multiplied paper edge strips that produced doubled burned corners and crossed the header and footer. Retained the sheet texture, subtle inset shade and fine irregular cut edge.
- Added space above the project navigation and between the `Next project` label and title. Underlining now applies only to the linked title line.
- Preserved project content and the FMK gallery files.

# V4: clean stop-motion hero

- Replaced the optically interpolated hero MP4 and fallback still with a stepped sequence built entirely from four clean complete poses. The file remains 768 × 512, 7.5 seconds and 30 fps, with 225 presentation frames, but there are only four distinct illustrations. This removes the warped pencil, hand and page-edge artifacts reported on mobile.
- Kept the v3 paper corner and `Next project` spacing fixes, all project content, and the gallery manifest.

# V5: hand descent in seven steps

- Added seven distinct stop-motion hand positions between the raised pencil and the page. The artwork is a rigid cutout of the supplied hand, pencil and forearm, pivoted in small steps over a fixed book and figure. These same positions play in reverse as the hand lifts.
- The loop remains 7.5 seconds and 30 fps with 225 presentation frames. It now contains 11 distinct poses. No optical-flow image warping, morphing or crossfade.
- Kept the v3 paper corner and project navigation fixes, all project content, and the gallery manifest.

