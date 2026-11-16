import test from "node:test";
import assert from "node:assert/strict";
import G from "../src/core/geometry.mjs";
import {
  newProject,
  feature,
  groupFeatures,
  ungroupFeatures,
  expandSelection,
  duplicateFeatures,
  rotate,
  translate,
  centerOf,
  polygonArea,
  trakwayPad,
  trakwayRun,
  PRODUCTS,
  migrateProject,
  replaceSnapshot,
  validateFeatures,
} from "../src/core/model.mjs";
import { ASSETS, createAsset } from "../src/core/assets.mjs";
import { localCommand, applyActions } from "../src/core/commands.mjs";
import { planSVG, dxfDocument, kmlDocument } from "../src/core/documents.mjs";
import {
  fetchJSON,
  wayGeometry,
  cached,
  checkedBounds,
} from "../server/upstream.mjs";
const origin = [-2.127, 52.586],
  pr = G.projection(origin),
  rect = () => feature("stone", G.rectangle(origin, 20, 15));
test("width, length and counterclockwise rotation match plan axes", () => {
  const g = G.rectangle(origin, 20, 15),
    r = g.coordinates[0].map(pr.xy);
  assert.ok(Math.abs(r[1][0] - r[0][0] - 20) < 1e-6);
  assert.ok(Math.abs(r[2][1] - r[1][1] - 15) < 1e-6);
  assert.ok(Math.abs(polygonArea(g) - 300) < 0.002);
  const asset = createAsset(ASSETS[0], origin);
  assert.ok(Math.abs(polygonArea(asset.geometry) - 27) < 0.001);
});
test("group, transform, duplicate and ungroup retain geometry and independent groups", () => {
  let fs = [rect(), feature("note", { type: "Point", coordinates: origin })];
  fs = groupFeatures(
    fs,
    fs.map((f) => f.id),
  );
  assert.equal(expandSelection(fs, [fs[0].id]).length, 2);
  const before = JSON.stringify(fs),
    rotated = rotate(fs, 90);
  assert.ok(Math.abs(polygonArea(rotated[0].geometry) - 300) < 0.01);
  const copy = duplicateFeatures(rotated);
  assert.notEqual(copy[0].properties.groupId, fs[0].properties.groupId);
  assert.equal(copy[0].properties.groupId, copy[1].properties.groupId);
  assert.notEqual(copy[0].id, fs[0].id);
  assert.equal(
    ungroupFeatures(fs, [fs[0].id])[1].properties.groupId,
    undefined,
  );
  assert.equal(JSON.stringify(fs), before);
  const delta = pr.xy(centerOf(translate(fs, 5, 0)));
  assert.ok(Math.abs(delta[0] - 5) < 0.001);
});
test("Lion whole panel pad 15 × 15 covers extent without gaps or fractional panels", () => {
  const p = trakwayPad(origin, 15, 15, PRODUCTS.lion);
  assert.equal(p.count, 35);
  assert.equal(p.actualWidth, 15);
  assert.ok(Math.abs(p.actualLength - 16.87) < 1e-9);
  const centers = p.features.slice(0, 6).map((f) => pr.xy(centerOf([f])));
  assert.ok(Math.abs(centers[1][0] - centers[0][0] - 3) < 0.001);
  assert.ok(Math.abs(centers[5][1] - centers[0][1] - 2.41) < 0.001);
});
test("Sabre uses full 4 × 2 m physical footprint and 200 mm overlap", () => {
  const p = trakwayRun([origin, pr.ll([0, 20])], {
    ...PRODUCTS.sabre,
    lanes: 2,
  });
  assert.ok(p.features.length > 10);
  assert.ok(Math.abs(polygonArea(p.features[0].geometry) - 8) < 0.001);
  const c = p.features.slice(0, 4).map((f) => pr.xy(centerOf([f])));
  assert.ok(Math.abs(Math.abs(c[1][0] - c[0][0]) - 3.8) < 0.001);
  assert.ok(Math.abs(c[2][1] - c[0][1] - 1.8) < 0.001);
  assert.ok(p.warnings.some((x) => /unverified/i.test(x)));
});
test("portable project roundtrip retains styling, logos, photos, groups and source metadata", () => {
  const p = newProject();
  const fs = [rect(), rect()];
  p.features = groupFeatures(
    fs,
    fs.map((f) => f.id),
  );
  p.meta.logo = "data:image/png;base64,aGVsbG8=";
  p.features[0].properties.photo = "data:image/png;base64,aGVsbG8=";
  p.features[0].properties.color = "#123456";
  assert.deepEqual(migrateProject(JSON.parse(JSON.stringify(p))), p);
});
test("legacy project migrates styles without destroying legacy data", () => {
  const old = {
    format: "SAMI-PROJECT-3",
    name: "Old",
    features: [
      {
        ...rect(),
        properties: { type: "stone", styleFill: "#abcdef", groupId: "group1" },
      },
    ],
    customShapes: [{ name: "fixture" }],
    company: "Test",
    area: [-2.128, 52.585, -2.126, 52.587],
  };
  const p = migrateProject(old);
  assert.equal(p.features[0].properties.fill, "#abcdef");
  assert.equal(p.features[0].properties.groupId, "group1");
  assert.equal(p.library[0].name, "fixture");
  assert.equal(p.meta.company, "Test");
  assert.deepEqual(migrateProject(JSON.parse(JSON.stringify(p))), p);
});
test("bad geometries and excessive query extents are rejected", () => {
  assert.throws(() =>
    validateFeatures([
      feature("line", { type: "LineString", coordinates: [[0, 0]] }),
    ]),
  );
  assert.throws(() =>
    validateFeatures([
      feature("area", {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
        ],
      }),
    ]),
  );
  assert.throws(() => checkedBounds([-10, 50, 0, 60]));
  assert.throws(() =>
    migrateProject({ format: "SAMI-ELITE-1", features: [], origin: [300, 0] }),
  );
});
test("failed and empty refreshes retain dated source geometry", () => {
  let p = newProject();
  const saved = [rect()];
  p.snapshots.services = {
    features: saved,
    status: { state: "ready", updatedAt: "2026-11-01" },
    bounds: [-2.128, 52.585, -2.126, 52.587],
  };
  p = replaceSnapshot(
    p,
    "services",
    [],
    { state: "error", message: "Timeout" },
    p.snapshots.services.bounds,
  );
  assert.equal(p.snapshots.services.features.length, 1);
  assert.match(p.snapshots.services.status.message, /retained/);
});
test("missing OSM points never fabricate a service segment", () => {
  const g = wayGeometry({
    geometry: [
      { lon: 0, lat: 0 },
      { lon: 0.01, lat: 0 },
      null,
      { lon: 0.1, lat: 0 },
      { lon: 0.11, lat: 0 },
    ],
  });
  assert.equal(g.type, "MultiLineString");
  assert.equal(g.coordinates.length, 2);
});
test("local copilot is a reversible proposal, precise dimensions, no mutation before Apply", () => {
  const p = newProject();
  const cmd = localCommand("Create a 20 by 15 metre stone area");
  const out = applyActions(p, cmd.actions, [], origin);
  assert.equal(p.features.length, 0);
  assert.equal(out.project.features.length, 1);
  assert.ok(
    Math.abs(polygonArea(out.project.features[0].geometry) - 300) < 0.01,
  );
  assert.equal(localCommand("Where are the unrecorded gas pipes?"), null);
});
test("CAD, SVG, DXF and KML are deterministic local geometry without fetch", () => {
  const p = newProject();
  p.features = [rect()];
  const out = planSVG(p);
  assert.match(out.svg, /<path/);
  assert.ok(out.scaleDenominator > 0);
  assert.match(dxfDocument(p), /local origin WGS84/);
  assert.match(kmlDocument(p), /<Polygon>/);
});
test("request deadline aborts an indefinitely stalled upstream", async () => {
  const original = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = (_url, { signal }) =>
    new Promise((_resolve, reject) =>
      signal.addEventListener("abort", () => {
        aborted = true;
        reject(new Error("abort"));
      }),
    );
  try {
    const start = Date.now();
    await assert.rejects(
      fetchJSON("https://example.invalid", { timeout: 30 }),
      /timed out/,
    );
    assert.ok(Date.now() - start < 250);
    assert.equal(aborted, true);
  } finally {
    globalThis.fetch = original;
  }
});
test("parallel identical reads share one upstream and cache the result", async () => {
  let n = 0;
  const work = async () => {
    n++;
    return { features: [] };
  };
  await Promise.all([cached("test-key", work), cached("test-key", work)]);
  assert.equal(n, 1);
  const hit = await cached("test-key", work);
  assert.equal(hit.cached, true);
  assert.equal(n, 1);
});

test("compressed cloud reads preserve the same object revision token", async () => {
  const { normalizeETag } = await import("../server/cloud.mjs");
  assert.equal(
    normalizeETag('W/"object-version"'),
    normalizeETag('"object-version"'),
  );
  assert.notEqual(
    normalizeETag('W/"older-version"'),
    normalizeETag('"newer-version"'),
  );
  assert.equal(normalizeETag(undefined), undefined);
});
