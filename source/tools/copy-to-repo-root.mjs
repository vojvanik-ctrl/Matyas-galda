// Copy the freshly built site (source/dist) to the repository root, which is
// what GitHub Pages publishes ("Deploy from a branch: main / (root)").
//
//   cd source && npm run publish:root
//
// Only the entries the build produces are replaced at the root. Nothing else at
// the root is touched: source/, .git, README.md and any other files stay.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(SOURCE, "dist");
const ROOT = path.resolve(SOURCE, "..");
const PROTECTED = new Set(["source", ".git", ".gitignore", "README.md", ".github"]);

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const e of await fs.readdir(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(a, b);
    else await fs.copyFile(a, b);
  }
}

const entries = await fs.readdir(DIST, { withFileTypes: true }).catch(() => null);
if (!entries || !entries.some((e) => e.name === "index.html")) {
  console.error("source/dist/index.html not found: run `npm run build` first.");
  process.exit(1);
}
for (const e of entries) {
  if (PROTECTED.has(e.name)) throw new Error(`refusing to overwrite protected root entry: ${e.name}`);
  const target = path.join(ROOT, e.name);
  await fs.rm(target, { recursive: true, force: true });
  if (e.isDirectory()) await copyDir(path.join(DIST, e.name), target);
  else await fs.copyFile(path.join(DIST, e.name), target);
}
console.log(`Copied ${entries.length} top-level entries from source/dist to the repository root:`);
console.log("  " + entries.map((e) => e.name + (e.isDirectory() ? "/" : "")).join(", "));
