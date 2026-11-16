import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const walk = async (p) => {
  const out = [];
  for (const e of await readdir(p, { withFileTypes: true })) {
    const f = p + "/" + e.name;
    if (e.isDirectory()) out.push(...(await walk(f)));
    else out.push(f);
  }
  return out;
};
const files = (await walk("dist")).filter((x) => !x.endsWith("sw.js"));
const revision = createHash("sha256")
  .update(await readFile("dist/index.html"))
  .digest("hex")
  .slice(0, 12);
// Only this app's shell is cached. Provider tiles, API responses and cloud edit links are excluded.
await writeFile(
  "dist/sw.js",
  `const CACHE='sami-elite-${revision}',SHELL=${JSON.stringify(files.map((x) => "/" + x.slice(5)))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sami-elite-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match('/index.html'))));return;}if(SHELL.includes(u.pathname))e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});`,
);
console.log("Offline app shell generated:", revision);
