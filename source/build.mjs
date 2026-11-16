// Static build for Matyáš Galda's portfolio.
//   npm run build   -> dist/ (deployable as-is, works in a subdirectory)
// Sources of truth:
//   public/portfolio.json   FMK gallery manifest (also provides the site name)
//   src/data/projects.json  projects, copy, media, alt text
//   src/data/site.json      homepage copy, about, CV, contact
//   src/assets/hero/hero-drawing-30fps.mp4  288-frame drawing loop

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const PUB = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");
const CACHE = path.join(ROOT, ".cache", "img");

const readJSON = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const pad = (n) => String(n).padStart(2, "0");

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const e of await fs.readdir(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(a, b);
    else await fs.copyFile(a, b);
  }
}

// ---------- images ----------

const WIDTHS = [480, 800, 1200, 1600, 2000];

async function cached(key, make) {
  const file = path.join(CACHE, key);
  if (await exists(file)) return fs.readFile(file);
  const buf = await make();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buf);
  return buf;
}

async function processMedia(item) {
  const src = path.join(SRC, "assets", "projects", item.file);
  const stat = await fs.stat(src);
  const meta = await sharp(src).metadata();
  const crop = item.crop || {};
  const cw = meta.width - (crop.left || 0) - (crop.right || 0);
  const ch = meta.height - (crop.top || 0) - (crop.bottom || 0);
  let widths = WIDTHS.filter((w) => w < cw);
  widths.push(Math.min(cw, 2000));
  widths = [...new Set(widths)].sort((a, b) => a - b);
  const base = item.file.replace(/\.[a-z0-9]+$/i, "");
  const out = [];
  for (const w of widths) {
    const h = Math.round((ch * w) / cw);
    const rel = `assets/img/${base}-${w}.webp`;
    const key = `${base}-${w}-${crop.top || 0}-${crop.bottom || 0}-${stat.mtimeMs}.webp`;
    const buf = await cached(key, () => {
      let img = sharp(src);
      if (item.crop) img = img.extract({ left: crop.left || 0, top: crop.top || 0, width: cw, height: ch });
      return img.resize({ width: w }).webp({ quality: 80, alphaQuality: 90, effort: 5 }).toBuffer();
    });
    await fs.mkdir(path.join(DIST, path.dirname(rel)), { recursive: true });
    await fs.writeFile(path.join(DIST, rel), buf);
    out.push({ w, h, rel, bytes: buf.length });
  }
  const largest = out[out.length - 1];
  return {
    ...item,
    width: largest.w,
    height: largest.h,
    ratio: cw / ch,
    variants: out,
    src: (out.find((v) => v.w >= 1200) || largest).rel,
    srcset: out.map((v) => `${v.rel} ${v.w}w`).join(", "),
  };
}

// Homepage cover treatments (thumbnails only): original file copied as-is, plus smaller sizes.
async function processCover(rel) {
  const src = path.join(SRC, rel);                         // e.g. assets/covers/last-breath-cover.webp
  const stat = await fs.stat(src);
  const meta = await sharp(src).metadata();
  const base = rel.replace(/\.[a-z0-9]+$/i, "");
  const out = [];
  for (const w of [640, 1000, 1400].filter((x) => x < meta.width)) {
    const outRel = `${base}-${w}.webp`;
    const buf = await cached(`${path.basename(base)}-${w}-${stat.mtimeMs}.webp`, () =>
      sharp(src).resize({ width: w }).webp({ quality: 82, effort: 5 }).toBuffer());
    await fs.writeFile(path.join(DIST, outRel), buf);
    out.push({ w, rel: outRel });
  }
  out.push({ w: meta.width, rel });                           // the supplied file, copied with assets/covers
  return {
    src: out.find((v) => v.w >= 1000)?.rel || rel,
    srcset: out.map((v) => `${v.rel} ${v.w}w`).join(", "),
    width: meta.width,
    height: meta.height,
  };
}

// Paper textures: WebP copied as-is; transparent PNG rims re-encoded as WebP (much smaller).
// sheet-edge-overlay.png and the un-tiled page-parchment.webp are reference sources only.
const TEXTURE_SKIP = new Set(["sheet-edge-overlay.png", "page-parchment.webp", "hero-panel.webp", "edge-top.png", "edge-bottom.png", "edge-left.png", "edge-right.png"]);
async function processTextures() {
  const dir = path.join(SRC, "assets", "texture");
  const outDir = path.join(DIST, "assets", "texture");
  await fs.mkdir(outDir, { recursive: true });
  for (const name of await fs.readdir(dir)) {
    if (TEXTURE_SKIP.has(name)) continue;
    const src = path.join(dir, name);
    if (name.endsWith(".png")) {
      const stat = await fs.stat(src);
      const outName = name.replace(/\.png$/, ".webp");
      const buf = await cached(`tex-${outName}-${stat.mtimeMs}`, () =>
        sharp(src).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toBuffer());
      await fs.writeFile(path.join(outDir, outName), buf);
    } else {
      await fs.copyFile(src, path.join(outDir, name));
    }
  }
}


// ---------- irregular paper edge (deterministic) ----------

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function edgePolygon(seed = 1977) {
  const rnd = mulberry32(seed);
  const walk = (n, min, max) => {
    const vals = []; let v = (min + max) / 2;
    for (let i = 0; i < n; i++) {
      v += (rnd() - 0.5) * 3.2;
      if (rnd() < 0.08) v += (rnd() - 0.4) * 4; // the odd small nick
      v = Math.max(min, Math.min(max, v));
      vals.push(+v.toFixed(1));
    }
    return vals;
  };
  const pts = [];
  const H = 40, V = 64;
  const top = walk(H, 0, 6), right = walk(V, 0, 5.5), bottom = walk(H, 0, 6.5), left = walk(V, 0, 5);
  pts.push(`7px 8px`);
  top.forEach((a, i) => pts.push(`${(((i + 1) / (H + 1)) * 100).toFixed(2)}% ${a}px`));
  pts.push(`calc(100% - 6px) 9px`);
  right.forEach((a, i) => pts.push(`calc(100% - ${a}px) ${(((i + 1) / (V + 1)) * 100).toFixed(2)}%`));
  pts.push(`calc(100% - 8px) calc(100% - 7px)`);
  bottom.slice().reverse().forEach((a, i) => pts.push(`${((1 - (i + 1) / (H + 1)) * 100).toFixed(2)}% calc(100% - ${a}px)`));
  pts.push(`6px calc(100% - 9px)`);
  left.slice().reverse().forEach((a, i) => pts.push(`${a}px ${((1 - (i + 1) / (V + 1)) * 100).toFixed(2)}%`));
  return `polygon(${pts.join(", ")})`;
}

// ---------- templates ----------

const ICON_MENU = `<svg class="icon-open" viewBox="0 0 26 20" aria-hidden="true" focusable="false"><path d="M2 3.2c6.5-.9 14.6-.6 22 .3M1.6 10.3c7.2-.6 15.3-.2 22.6.2M2.4 17c6.1-.7 13.4-.9 21.4-.1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const ICON_CLOSE = `<svg class="icon-close" viewBox="0 0 26 20" aria-hidden="true" focusable="false"><path d="M5 2.5c5.3 4.6 10.6 9.7 16.2 15M21.4 2.8c-5.6 4.7-11 9.6-16.3 14.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const STROKE = `<svg class="headline-stroke" viewBox="0 0 420 26" aria-hidden="true" focusable="false"><path d="M5 18.5C70 10.6 152 6.4 236 8.3c62 1.4 118 5.5 179 3.1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M30 21.6c64-5.4 132-8.2 205-7.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".55"/></svg>`;

function head({ title, description, v }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#191512">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/marck-script-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/caveat-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/eb-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/site.css?v=${v}">
<script>document.documentElement.classList.add("js")</script>
<script src="assets/site.js?v=${v}" defer></script>
</head>`;
}

function header({ name, tagline, home }) {
  const h = home ? "" : "index.html";
  const items = [["Work", "work"], ["About", "about"], ["CV", "cv"], ["Contact", "contact"]];
  return `<header class="site-header">
  <a class="brand" href="index.html" aria-label="${esc(name)}, home">
    <span class="brand__name">${esc(name)}</span>
    <span class="brand__tag" aria-hidden="true">${esc(tagline)}</span>
  </a>
  <nav class="site-nav" aria-label="Main">
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">${ICON_MENU}${ICON_CLOSE}<span>Menu</span></button>
    <ul id="site-menu">
${items.map(([l, id]) => `      <li><a href="${h}#${id}">${l}</a></li>`).join("\n")}
    </ul>
  </nav>
</header>`;
}

function footer({ name, year }) {
  return `<footer class="site-footer">
  <p>© ${year} ${esc(name)}</p>
  <a class="ink-link" href="#main">Back to top <span aria-hidden="true">↑</span></a>
</footer>`;
}

function shell({ title, description, v, name, tagline, home, body, year }) {
  return `${head({ title, description, v })}
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="desk">
<div class="sheet-wrap">
<div class="sheet">
${header({ name, tagline, home })}
<main id="main" tabindex="-1">
${body}
</main>
${footer({ name, year })}
</div>
</div>
</div>
</body>
</html>
`;
}

function img(m, { sizes, loading = "lazy", alt = m.alt, priority = false, cls = "" }) {
  return `<img${cls ? ` class="${cls}"` : ""} src="${m.src}" srcset="${m.srcset}" sizes="${sizes}" width="${m.width}" height="${m.height}" alt="${esc(alt)}"${priority ? ` fetchpriority="high"` : ` loading="${loading}"`} decoding="async">`;
}

function homePage(ctx) {
  const { site, projects, name } = ctx;
  const cards = projects.map((p, i) => {
    // Card images are decorative: the linked title next to them names the project.
    let media;
    if (p.cardCover) {
      const c = p.cardCover;
      media = `<div class="work-card__media"><img src="${c.src}" srcset="${c.srcset}" sizes="(min-width: 1500px) 300px, (min-width: 1180px) 21vw, (min-width: 980px) 44vw, (min-width: 600px) 38vw, 84vw" width="${c.width}" height="${c.height}" alt="" loading="lazy" decoding="async"></div>`;
    } else {
      const m = p.media[p.card.media[0]];
      media = `<div class="work-card__media work-card__media--mounted">${img(m, { sizes: "(min-width: 1500px) 300px, (min-width: 1180px) 21vw, (min-width: 980px) 44vw, (min-width: 600px) 38vw, 84vw", alt: "" }).replace("<img ", `<img style="object-position:${p.card.position}" `)}</div>`;
    }
    return `    <div class="work-card" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${projects.length}">
      ${media}
      <div class="work-card__body">
        <h3 class="work-card__title"><a class="work-card__link" href="${p.slug}.html"><span class="work-card__num">${pad(i + 1)}</span> <span class="work-card__slash" aria-hidden="true">/</span> ${esc(p.title)}</a></h3>
        <p class="work-card__summary">${esc(p.summary)}</p>
      </div>
    </div>`;
  }).join("\n");

  const cv = site.cv;
  const edu = cv.education.map((e) => `<p class="cv-entry"><span class="cv-entry__school">${esc(e.school)}</span><br>${esc(e.faculty)}<br>${esc(e.programme)}</p>
        <p class="cv-entry__status">${esc(e.status)}</p>`).join("\n");

  const body = `
<section class="hero" aria-labelledby="page-title">
  <div class="hero-plate" role="img" aria-label="${esc(site.heroAlt)}">
    <img class="hero-still" src="assets/hero/hero-still.webp" alt="" width="768" height="512" fetchpriority="high" decoding="async">
    <video class="hero-video" muted playsinline loop preload="none" data-src="assets/hero/hero-drawing-30fps.mp4" aria-hidden="true"></video>
  </div>
  <div class="hero-text">
    <h1 class="headline" id="page-title">${site.headline.map((l) => `<span>${esc(l)}</span>`).join(" ")}</h1>
    ${STROKE}
    <p class="intro">${esc(site.intro)}</p>
  </div>
</section>

<section class="section work" id="work" aria-labelledby="work-title" aria-roledescription="carousel" data-carousel>
  <div class="work-head">
    <h2 class="section-title" id="work-title">Selected work</h2>
    <div class="carousel-controls" hidden>
      <button class="carousel-btn" type="button" data-step="-1" aria-controls="work-track" aria-label="Previous project"><span aria-hidden="true">←</span></button>
      <span class="carousel-count" aria-hidden="true">1 / ${projects.length}</span>
      <button class="carousel-btn" type="button" data-step="1" aria-controls="work-track" aria-label="Next project"><span aria-hidden="true">→</span></button>
    </div>
  </div>
  <div class="work-track" id="work-track">
${cards}
  </div>
  <p class="visually-hidden" aria-live="polite" data-carousel-status></p>
</section>

<div class="profile">
<section class="section about" id="about" aria-labelledby="about-title">
  <h2 class="section-title" id="about-title">About</h2>
  <div class="about__text">
    ${site.about.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
  </div>
</section>

<section class="section cv" id="cv" aria-labelledby="cv-title">
  <h2 class="section-title" id="cv-title">CV</h2>
  <div class="cv-grid">
    <div>
      <h3 class="label">Education</h3>
      ${edu}
    </div>
    <div>
      <h3 class="label">Skills</h3>
      <ul>${cv.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    </div>
    <div>
      <h3 class="label">Languages</h3>
      <ul>${cv.languages.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    </div>
  </div>
</section>
</div>

<section class="section contact" id="contact" aria-labelledby="contact-title">
  <h2 class="section-title" id="contact-title">Contact</h2>
  <div class="contact__body">
    <p class="contact__lead">${esc(site.contact.lead)}</p>
    <a class="contact__email ink-link" href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>
    <ul class="contact__links">
${site.contact.links.map((l) => `      <li><a class="ink-link" href="${esc(l.url)}"><span class="net">${esc(l.label)}</span><span class="handle">${esc(l.handle)}</span></a></li>`).join("\n")}
    </ul>
  </div>
</section>`;

  return shell({
    ...ctx,
    home: true,
    title: `${name} — Concept art portfolio`,
    description: site.metaDescription,
    body,
  });
}

function projectPage(ctx, p, i) {
  const { projects, name } = ctx;
  const key = p.media[p.keyVisual];
  const rest = p.media.filter((_, j) => j !== p.keyVisual);
  const next = projects[(i + 1) % projects.length];
  const nextIdx = (i + 1) % projects.length;

  // Balanced image grid: two per row on wider screens. With an odd count, the first
  // wide image takes a full row so the rest pair up. Small images sit in a normal
  // cell but never grow past their natural width (--nw), so they are not upscaled.
  const firstWide = rest.findIndex((m) => !m.small && m.ratio >= 1.25);
  const seq = rest.map((m, j) => {
    const n = p.media.indexOf(m) + 1;
    const full = rest.length === 1 || (rest.length % 2 === 1 && j === firstWide);
    const cls = m.small ? "is-small" : full ? "is-full" : m.ratio >= 1.25 ? "is-half" : "is-tall";
    const sizes = m.small ? "480px"
      : full ? "(min-width: 1500px) 1300px, 92vw"
      : "(min-width: 1500px) 640px, (min-width: 720px) 45vw, 92vw";
    return `    <li class="${cls}">
      <figure style="--nw:${m.width}px">
        <div class="plate">${img(m, { sizes })}</div>
        <figcaption class="figure-caption"><span class="no">${n}</span>${esc(m.caption)}</figcaption>
      </figure>
    </li>`;
  }).join("\n");

  const links = p.links ? `
    <ul class="project-links">
${p.links.map((l) => `      <li><a class="ink-link" href="${esc(l.url)}">${esc(l.label)} <span aria-hidden="true">↗</span></a></li>`).join("\n")}
    </ul>` : "";
  const credit = p.credit ? `\n    <p class="credit">${esc(p.credit)}</p>` : "";

  const body = `
<a class="back-link" href="index.html#work"><span class="arrow" aria-hidden="true">←</span> Back to portfolio</a>
<article class="project project--${esc(p.slug)}" aria-labelledby="page-title">
  <div class="project-head">
    <div class="project-text">
      <h1 class="project-title" id="page-title"><span class="work-card__num">${pad(i + 1)} / ${pad(projects.length)}</span>${esc(p.title)}</h1>
      <p class="kind">${esc(p.kind)}</p>
      <div class="project-intro">
        ${p.intro.map((t) => `<p>${esc(t)}</p>`).join("\n        ")}
      </div>
    </div>
    <figure class="key-visual" style="--ar:${key.ratio.toFixed(3)};--nw:${key.width}px">
      <div class="plate">${img(key, { sizes: "(min-width: 1500px) 680px, (min-width: 960px) 46vw, 92vw", priority: true })}</div>
      <figcaption class="figure-caption"><span class="no">1</span>${esc(key.caption)}</figcaption>
    </figure>
    <div class="project-facts">
      <dl class="facts">
${p.details.map((d) => `        <div><dt class="label">${esc(d.label)}</dt><dd>${esc(d.value)}</dd></div>`).join("\n")}
      </dl>${links}${credit}
    </div>
  </div>

  <section class="section project-images" aria-labelledby="images-title">
    <h2 class="section-title" id="images-title">Project images</h2>
    <ol class="sequence">
${seq}
    </ol>
  </section>

  <nav class="project-nav" aria-label="Projects">
    <a href="index.html#work"><span class="arrow l" aria-hidden="true">←</span> Back to portfolio</a>
    <a class="next" href="${next.slug}.html"><small>Next project</small><span class="next__title">${pad(nextIdx + 1)} / ${esc(next.title)}</span> <span class="arrow r" aria-hidden="true">→</span></a>
  </nav>
</article>`;

  return shell({
    ...ctx,
    home: false,
    title: `${p.title} — ${name}`,
    description: `${p.title}: ${p.summary}`,
    body,
  });
}

function notFoundPage({ name }) {
  // Self-contained: it can be served from any path by the host.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — ${esc(name)}</title><meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#191512;font-family:"EB Garamond",Georgia,serif;color:#22170e}
main{max-width:34rem;margin:16px;padding:40px 32px;background:#c9a171;box-shadow:inset 0 0 30px rgba(92,50,18,.45)}
h1{margin:0 0 12px;font-family:"Marck Script","Segoe Script",cursive;font-weight:400;font-size:2.6rem;line-height:1}
a{color:inherit;text-decoration-color:#8c3424;text-decoration-thickness:2px;text-underline-offset:.2em}</style></head>
<body><main><h1>This page isn't in the folio.</h1><p>The address may have changed. <a href="./">Go to ${esc(name)}'s portfolio</a>.</p></main></body></html>
`;
}

// ---------- validation ----------

const MANIFEST_KEYS = ["schemaVersion", "name", "studyProgram", "bio", "countryCode", "portfolioUrl", "photoOriginal", "photoStamp"];

async function validateManifest() {
  const m = await readJSON(path.join(DIST, "portfolio.json"));
  const errors = [];
  const keys = Object.keys(m);
  if (keys.join() !== MANIFEST_KEYS.join()) errors.push(`keys must be exactly ${MANIFEST_KEYS.join(", ")} (got ${keys.join(", ")})`);
  if (m.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  for (const k of ["name", "studyProgram", "bio"]) if (typeof m[k] !== "string" || !m[k].trim()) errors.push(`${k} must be a non-empty string`);
  if (typeof m.name === "string" && [...m.name].length > 80) errors.push("name over 80 chars");
  if (typeof m.studyProgram === "string" && [...m.studyProgram].length > 80) errors.push("studyProgram over 80 chars");
  const bioLen = typeof m.bio === "string" ? [...m.bio].length : 0;
  if (bioLen > 180) errors.push(`bio is ${bioLen} chars (max 180)`);
  if (!(m.countryCode === null || /^[A-Z]{2}$/.test(m.countryCode))) errors.push("countryCode must be two capital letters or null");
  if (!(m.portfolioUrl === null || /^https:\/\/[^\s]+$/.test(m.portfolioUrl))) errors.push("portfolioUrl must be an https URL or null");
  if (typeof m.portfolioUrl === "string" && /localhost|127\.0\.0\.1/.test(m.portfolioUrl)) errors.push("portfolioUrl must not be localhost");
  for (const k of ["photoOriginal", "photoStamp"]) {
    const v = m[k];
    if (v === null) continue;
    if (typeof v !== "string") { errors.push(`${k} must be a string or null`); continue; }
    if (/^https:\/\//.test(v)) continue;
    if (v.startsWith("/") || /^[a-z]+:/i.test(v)) { errors.push(`${k} must be relative without a leading slash or https`); continue; }
    if (!(await exists(path.join(DIST, v)))) errors.push(`${k} file missing in build: ${v}`);
  }
  return { manifest: m, bioLen, errors };
}

// ---------- main ----------

async function main() {
  const t0 = Date.now();
  const [projects, site, manifest] = await Promise.all([
    readJSON(path.join(SRC, "data", "projects.json")),
    readJSON(path.join(SRC, "data", "site.json")),
    readJSON(path.join(PUB, "portfolio.json")),
  ]);

  await fs.rm(DIST, { recursive: true, force: true });
  await copyDir(PUB, DIST);
  await copyDir(path.join(SRC, "fonts"), path.join(DIST, "assets", "fonts"));
  await processTextures();
  await copyDir(path.join(SRC, "assets", "covers"), path.join(DIST, "assets", "covers"));
  await fs.mkdir(path.join(DIST, "assets", "hero"), { recursive: true });
  for (const file of ["hero-still.webp", "hero-drawing-30fps.mp4"]) {
    await fs.copyFile(path.join(SRC, "assets", "hero", file), path.join(DIST, "assets", "hero", file));
  }

  // CSS (with generated edge) + JS
  let css = await fs.readFile(path.join(SRC, "css", "site.css"), "utf8");
  css += `\n.sheet { --sheet-edge: ${edgePolygon()}; }\n`;
  const js = await fs.readFile(path.join(SRC, "js", "site.js"), "utf8");
  const v = crypto.createHash("sha1").update(css + js).digest("hex").slice(0, 8);
  await fs.writeFile(path.join(DIST, "assets", "site.css"), css);
  await fs.writeFile(path.join(DIST, "assets", "site.js"), js);

  // images
  for (const p of projects) {
    p.media = await Promise.all(p.media.map(processMedia));
    if (p.card.cover) p.cardCover = await processCover(p.card.cover);
  }
  const ctx = {
    projects, site, v,
    name: manifest.name,            // shared with the FMK gallery manifest
    tagline: site.tagline,
    year: new Date().getFullYear(),
  };

  await fs.writeFile(path.join(DIST, "index.html"), homePage(ctx));
  for (const [i, p] of projects.entries()) {
    await fs.writeFile(path.join(DIST, `${p.slug}.html`), projectPage(ctx, p, i));
  }
  await fs.writeFile(path.join(DIST, "404.html"), notFoundPage(ctx));

  // checks
  const { bioLen, errors } = await validateManifest();
  const missing = [];
  for (const f of ["index.html", "404.html", ...projects.map((p) => `${p.slug}.html`)]) {
    const html = await fs.readFile(path.join(DIST, f), "utf8");
    for (const m of html.matchAll(/(?:src|href)="([^"#?:]+)(?:[?#][^"]*)?"/g)) {
      const ref = m[1];
      if (ref.startsWith("mailto") || ref === "./") continue;
      if (!(await exists(path.join(DIST, ref)))) missing.push(`${f}: ${ref}`);
    }
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const part of m[1].split(",")) {
        const ref = part.trim().split(/\s+/)[0];
        if (!(await exists(path.join(DIST, ref)))) missing.push(`${f}: ${ref}`);
      }
    }
  }
  for (const file of ["hero-still.webp", "hero-drawing-30fps.mp4"]) {
    if (!(await exists(path.join(DIST, "assets", "hero", file)))) missing.push(`hero: ${file}`);
  }

  const imgBytes = projects.flatMap((p) => p.media.flatMap((m) => m.variants)).reduce((a, b) => a + b.bytes, 0);
  console.log(`Built dist/ in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log(`  pages: index.html, ${projects.map((p) => p.slug + ".html").join(", ")}, 404.html`);
  console.log("  hero: 288 frames at 30 fps, delivered as a single MP4 with a WebP still");
  console.log(`  project image variants: ${(imgBytes / 1024 / 1024).toFixed(2)} MB across all sizes`);
  console.log(`  portfolio.json bio: ${bioLen}/180 characters`);
  if (errors.length || missing.length) {
    for (const e of errors) console.error("  manifest error:", e);
    for (const e of missing) console.error("  missing file:", e);
    process.exitCode = 1;
  } else {
    console.log("  portfolio.json valid; all referenced files exist");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
