/* Release integrity checks for the generated static PWA files.
   Run with: node --test geometry-tests.mjs release-tests.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("generated release stamps match VERSION.json", () => {
  const version = JSON.parse(read("VERSION.json")).version;
  const html = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const assets = JSON.parse(read("ASSET_MANIFEST.json"));

  assert.match(read("version.js"), new RegExp(`version:"${version}"`));
  assert.match(read("version.js"), new RegExp(`\\?v=${version}`));
  assert.match(html, new RegExp(`data-sami-version="${version}"`));
  assert.match(read("config.js"), new RegExp(`build: "${version}"`));
  assert.equal(manifest.version, version);
  assert.equal(assets.version, version);
  assert.match(read("sw.js"), new RegExp(`const VERSION = "${version}"`));

  const htmlVersions = [...html.matchAll(/[?&]v=(\d+\.\d+\.\d+)/g)].map(
    (match) => match[1],
  );
  assert.ok(htmlVersions.length > 0, "HTML should version its local assets");
  assert.ok(htmlVersions.every((assetVersion) => assetVersion === version));
  for (const icon of [...manifest.icons, ...(manifest.screenshots || [])])
    assert.match(icon.src, new RegExp(`[?&]v=${version}(?:$|&)`));
});

test("viewport allows browser zoom", () => {
  const html = read("index.html");
  const viewport = html.match(/<meta\b[^>]*\bname="viewport"[^>]*>/i);

  assert.ok(viewport, "viewport metadata should be present");
  assert.doesNotMatch(viewport[0], /maximum-scale|user-scalable\s*=\s*no/i);
});

test("CAD base requires a site area and clearing it exits Site Plan", () => {
  const engine = read("engine.js");

  assert.match(engine, /drawingBtn\.disabled = !state\.project\.area/);
  assert.match(engine, /if \(base === "drawing" && !state\.project\.area\)/);
  assert.match(engine, /if \(state\.mode === "plan"\) setMode\("map"\)/);
});

test("Ask SAMI exposes useful local commands and AI connection status", () => {
  const engine = read("engine.js");
  const html = read("index.html");
  const settings = read("studio.js");

  assert.match(engine, /function localAssistantHelp\(\)/);
  assert.match(engine, /function localProjectSummary\(\)/);
  assert.match(engine, /SAMI request failed/);
  assert.match(html, /id="assistantCapability"/);
  assert.match(settings, /OpenAI-compatible service/);
  assert.match(settings, /never the provider key/);
});

test("admin workspace profiles include Classic Pro and combine UI settings", () => {
  const workspace = read("workspace.js");
  const css = read("studio-ui.css");

  for (const profile of ["classic", "studio", "field", "drafting", "focus"])
    assert.match(workspace, new RegExp(`${profile}: \\{`));
  assert.match(workspace, /name: "Classic Pro"/);
  assert.match(workspace, /function applyWorkspaceProfile\(key\)/);
  assert.match(workspace, /cmd === "workspaceProfile" && adminUnlocked/);
  assert.match(css, /html\[data-layout="classic"\] \.inspector/);
  assert.match(css, /html\[data-layout="classic"\] \.primary-command-bar/);
});

test("studio UI overrides load last and are included in the shell", () => {
  const html = read("index.html");
  const renovationIndex = html.indexOf("ui-renovation.css");
  const studioIndex = html.indexOf("studio-ui.css");
  const assets = JSON.parse(read("ASSET_MANIFEST.json"));

  assert.ok(renovationIndex >= 0 && studioIndex > renovationIndex);
  assert.ok(assets.shell.includes("./studio-ui.css"));
  assert.match(read("studio-ui.css"), /min-width:\s*1200px/);
  assert.match(read("studio-ui.css"), /pointer:\s*coarse/);
});

test("generated shell references existing files and keeps audio lazy", () => {
  const assets = JSON.parse(read("ASSET_MANIFEST.json"));
  const shell = new Set(assets.shell);

  assert.ok(shell.has("./index.html"));
  for (const asset of shell)
    assert.ok(
      fs.existsSync(path.join(root, asset.replace(/^\.\//, ""))),
      `missing shell asset: ${asset}`,
    );
  for (const media of assets.media)
    assert.ok(!shell.has(`./${media}`), `audio should be lazy: ${media}`);
});