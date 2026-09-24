/* Dev-time only; no package installation or build step is needed to run SAMI. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const versionInfo = JSON.parse(
  fs.readFileSync(path.join(root, "VERSION.json"), "utf8"),
);
const { version, descriptor } = versionInfo;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error("Invalid semantic version");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8"),
  write = (f, s) => fs.writeFileSync(path.join(root, f), s);

/* Home screen icon variant. Two source sets are kept permanently in the repo
   (sami-*-nebula.png and sami-*-black.png); this copies the selected one
   over the canonical filenames index.html/manifest.webmanifest reference.
   Pick explicitly with `node build.mjs --icon=black` / `--icon=nebula`
   (persists as the new baseline). With no flag, the variant auto-alternates
   every time the version number actually changes from what's currently
   stamped in version.js - a simple, visible "this update landed" signal on
   the home screen after a real release, while re-running build.mjs without
   a version bump leaves it alone. */
const ICON_VARIANTS = ["nebula", "black"];
const iconFlag = process.argv
  .find((a) => a.startsWith("--icon="))
  ?.slice("--icon=".length);
if (iconFlag && !ICON_VARIANTS.includes(iconFlag))
  throw Error(`--icon must be one of: ${ICON_VARIANTS.join(", ")}`);
let previousStampedVersion = null;
try {
  const m = read("version.js").match(/version:"([^"]+)"/);
  if (m) previousStampedVersion = m[1];
} catch {}
let iconVariant = ICON_VARIANTS.includes(versionInfo.iconVariant)
  ? versionInfo.iconVariant
  : "nebula";
if (iconFlag) {
  iconVariant = iconFlag;
} else if (previousStampedVersion && previousStampedVersion !== version) {
  iconVariant = ICON_VARIANTS[(ICON_VARIANTS.indexOf(iconVariant) + 1) % ICON_VARIANTS.length];
}
if (versionInfo.iconVariant !== iconVariant) {
  versionInfo.iconVariant = iconVariant;
  write("VERSION.json", JSON.stringify(versionInfo, null, 2) + "\n");
}
for (const base of [
  "sami-app-icon-512",
  "sami-app-icon-192",
  "sami-apple-touch-icon",
  "sami-maskable-512",
])
  fs.copyFileSync(
    path.join(root, `${base}-${iconVariant}.png`),
    path.join(root, `${base}.png`),
  );
console.log(`Icon variant: ${iconVariant}`);

write(
  "version.js",
  `/* Generated from VERSION.json by build.mjs. */\nwindow.SAMI_VERSION=Object.freeze({version:${JSON.stringify(version)},descriptor:${JSON.stringify(descriptor)},asset:name=>name.split('?')[0]+'?v=${version}'});\n`,
);
let html = read("index.html").replace(
  /data-sami-version="[^"]*"/g,
  `data-sami-version="${version}"`,
);
if (!html.includes("data-sami-version="))
  html = html.replace("<html ", `<html data-sami-version="${version}" `);
html = html.replace(
  /((?:src|href)="|(?:src|href)=')([^"'#?:]+\.(?:js|css|png|svg|webmanifest|mp3))(?:\?v=[^"']*)?(["'])/g,
  (all, a, file, b) =>
    /^https?:/.test(file) ? all : a + file + "?v=" + version + b,
);
html = html.replace(
  /(<span data-version>)[^<]+(<\/span>)/g,
  "$1v" + version + "$2",
);
write("index.html", html);
let config = read("config.js").replace(
  /build:\s*["'][^"']*["']/,
  `build: ${JSON.stringify(version)}`,
);
write("config.js", config);
const manifest = JSON.parse(read("manifest.webmanifest"));
manifest.version = version;
for (const i of [...manifest.icons, ...(manifest.screenshots || [])])
  i.src = i.src.split("?")[0] + "?v=" + version;
write("manifest.webmanifest", JSON.stringify(manifest, null, 2) + "\n");
const names = fs
  .readdirSync(root)
  .filter((f) => fs.statSync(path.join(root, f)).isFile());
const referenced = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1].split(/[?#]/)[0].replace(/^\.\//, ""))
  .filter((name) => !/^(?:https?:|data:|blob:)/.test(name));
const shellNames = new Set([
  "index.html",
  ...referenced.filter((name) => /\.(?:js|css)$/.test(name)),
  "sami-wordmark.png",
  "sami-badge.png",
  "marker-icon.png",
  "marker-icon-2x.png",
  "marker-shadow.png",
  "layers.png",
  "layers-2x.png",
]);
const missing = [...shellNames].filter((name) => !names.includes(name));
if (missing.length) throw Error("Missing critical app files: " + missing.join(", "));
const shell = [...shellNames]
  .sort()
  .map((f) => "./" + f);
const optional = names
  .filter(
    (f) =>
      /^sami-(app-icon|apple-touch-icon|maskable)/.test(f) ||
      f === "manifest.webmanifest" ||
      f.startsWith("screenshot-"),
  )
  .sort()
  .map((f) => "./" + f);
const sw = read("sw-template.txt")
  .replace("__VERSION__", JSON.stringify(version))
  .replace("__SHELL__", JSON.stringify(shell))
  .replace("__OPTIONAL__", JSON.stringify(optional));
write("sw.js", sw);
write(
  "ASSET_MANIFEST.json",
  JSON.stringify(
    {
      version,
      shell,
      optional,
      media: names.filter((f) => f.endsWith(".mp3")),
      development: [
        "VERSION.json",
        "build.mjs",
        "sw-template.txt",
        "ASSET_MANIFEST.json",
      ],
      runtimeGenerated: ["sw.js"],
      compatibility: [
        "bootstrap.js",
        "field.css",
        "field.js",
        "loader.js",
        "network.js",
        "download",
        "STABLE_RESTORE_QA.json",
      ].filter((f) => names.includes(f)),
      documentation: names.filter(
        (f) =>
          /\.md$|LICENSE/.test(f) ||
          f === ".nojekyll" ||
          f === "UI_WIREFRAMES.svg",
      ),
      screenshots: names.filter((f) => f.startsWith("screenshot-")),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Stamped SAMI ${version}: ${shell.length} critical files, ${optional.length} optional files, audio lazy.`,
);
