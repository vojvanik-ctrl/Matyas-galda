// Minimal static server for checking the build locally (no dependencies).
//   node tools/serve.mjs dist 8080             -> http://localhost:8080/
//   node tools/serve.mjs dist 8080 /matyas-galda/  -> simulates hosting in a subdirectory
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || "dist");
const port = Number(process.argv[3] || 8080);
const base = (process.argv[4] || "/").replace(/\/?$/, "/");

const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
};

http.createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!url.startsWith(base)) { res.writeHead(302, { Location: base }); return res.end(); }
  let rel = url.slice(base.length);
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  let file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const st = await fs.stat(file).catch(() => null);
    if (!st && !path.extname(file)) file += ".html"; // extensionless, like GitHub Pages
    const body = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    const body = await fs.readFile(path.join(root, "404.html")).catch(() => "Not found");
    res.writeHead(404, { "Content-Type": types[".html"] });
    res.end(body);
  }
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}${base}`));
