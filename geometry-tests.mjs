/* Regression checks for geometry.js panel-layout generation.
   Run with: node --test geometry-tests.mjs
   No packages or network required. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('trakway 60-120deg corner-snap: exit panel seams flush against the 5/4/3/2 corner block, no gap', () => {
  const G = require('./geometry.js');
  const R = 6378137, rad = Math.PI / 180;
  const projection = origin => {
    const mx = R * rad * Math.cos(origin[1] * rad), my = R * rad;
    return { xy: p => [(p[0]-origin[0])*mx, (p[1]-origin[1])*my], ll: p => [origin[0]+p[0]/mx, origin[1]+p[1]/my] };
  };
  function segDist(a1, a2, b1, b2) {
    const ptSeg = (p, a, b) => {
      const abx=b[0]-a[0], aby=b[1]-a[1], apx=p[0]-a[0], apy=p[1]-a[1];
      const len2 = abx*abx+aby*aby || 1e-9;
      const t = Math.max(0, Math.min(1, (apx*abx+apy*aby)/len2));
      return Math.hypot(p[0]-(a[0]+abx*t), p[1]-(a[1]+aby*t));
    };
    return Math.min(ptSeg(a1,b1,b2), ptSeg(a2,b1,b2), ptSeg(b1,a1,a2), ptSeg(b2,a1,a2));
  }
  function overlaps(P, Q) {
    for (const poly of [P, Q])
      for (let i = 0; i < poly.length; i++) {
        const p1=poly[i], p2=poly[(i+1)%poly.length], nx=-(p2[1]-p1[1]), ny=p2[0]-p1[0];
        let minP=Infinity,maxP=-Infinity,minQ=Infinity,maxQ=-Infinity;
        for (const p of P){const d=p[0]*nx+p[1]*ny; minP=Math.min(minP,d); maxP=Math.max(maxP,d);}
        for (const q of Q){const d=q[0]*nx+q[1]*ny; minQ=Math.min(minQ,d); maxQ=Math.max(maxQ,d);}
        if (maxP < minQ || maxQ < minP) return false;
      }
    return true;
  }
  function polyDistance(P, Q) {
    if (overlaps(P, Q)) return 0;
    let min = Infinity;
    for (let i = 0; i < P.length; i++)
      for (let j = 0; j < Q.length; j++)
        min = Math.min(min, segDist(P[i], P[(i+1)%P.length], Q[j], Q[(j+1)%Q.length]));
    return min;
  }
  const configs = [
    { length: 2.41, width: 3, overlap: 0, lateralOverlap: 0, lanes: 1 },   // lion, real app defaults
    { length: 2.5, width: 3, overlap: 0, lateralOverlap: 0, lanes: 1 },    // tuff, real app defaults
    { length: 3.5, width: 1, overlap: 0.15, lateralOverlap: 0.05, lanes: 1 },
  ];
  for (const cfg of configs) {
    const opts = { product: 'lion', ...cfg };
    for (let angleDeg = 60; angleDeg <= 120; angleDeg += 1) {
      const pr = projection([0, 0]);
      const a = [-100, 0], b = [0, 0], theta = angleDeg * rad;
      const c = [100 * Math.cos(theta), 100 * Math.sin(theta)];
      const points = [a, b, c].map(pr.ll);
      const result = G.panels(points, opts);
      const row3 = [];
      let exitSeed = null;
      for (const f of result.panels) {
        const rect = f.geometry.coordinates[0].slice(0, 4).map(pr.xy);
        if (f.corner && f.junctionRow === 4) row3.push(rect);
        if (f.cornerRule && f.cornerRule.includes('exit overlap')) exitSeed = rect;
      }
      assert.ok(exitSeed, `angle ${angleDeg} (${JSON.stringify(cfg)}): no exit panel emitted`);
      assert.ok(row3.length, `angle ${angleDeg}: no corner row 4 emitted`);
      let gap = Infinity;
      for (const r of row3) gap = Math.min(gap, polyDistance(exitSeed, r));
      assert.ok(gap < 0.05, `angle ${angleDeg} (${JSON.stringify(cfg)}): exit panel is ${gap.toFixed(3)}m from the corner block, expected touching/overlapping`);
    }
  }
});
