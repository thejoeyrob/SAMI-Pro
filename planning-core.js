/* Pure, shared geometry contracts for the workspace, imports and exports. */
(function (root) {
  'use strict';
  const G = typeof module === 'object' && module.exports ? require('./geometry.js') : root.SamiGeometry;
  function captureBounds(project) {
    const b = project?.area;
    if (!G.validBounds(b) || G.area(b) < 1) throw Error('Define a valid site area first.');
    const raw = Number(project.planBleed ?? 10);
    const bleed = Number.isFinite(raw) ? Math.max(0, Math.min(200, raw)) : 10;
    const bounds = G.expandBoundsMeters(b, bleed);
    if (!G.validBounds(bounds) || G.area(bounds) > 6000000)
      throw Error('CAD detail supports sites up to 6 km² including the drawing margin. Reduce the site area or margin.');
    return bounds;
  }
  function captureKey(project, detail) {
    return captureBounds(project).map(x => x.toFixed(7)).join(',') + ':' + detail;
  }
  function needsCapture(project, detail) {
    let key;
    try { key = captureKey(project, detail); } catch { return !!project?.area; }
    const meta = project.planBaseMeta;
    return !meta || meta.stale || meta.captureKey !== key;
  }
  function waySegments(geometry) {
    const segments = []; let segment = [];
    for (const node of geometry || []) {
      if (node && G.validCoord([node.lon,node.lat])) segment.push(node);
      else { if (segment.length > 1) segments.push(segment); segment = []; }
    }
    if (segment.length > 1) segments.push(segment);
    return segments;
  }
  function rings(g) {
    if (!g) return [];
    if (g.type === 'Point') return [[g.coordinates]];
    if (g.type === 'Polygon' || g.type === 'MultiLineString') return g.coordinates;
    if (g.type === 'MultiPolygon') return g.coordinates.flat();
    return g.type === 'LineString' ? [g.coordinates] : [];
  }
  function resolveDimension(feature, features) {
    const points = (feature.geometry?.coordinates || []).map(p => p.slice());
    let anchors = [];
    try { anchors = JSON.parse(feature.properties.dimensionAnchors || '[]'); } catch {}
    if (!Array.isArray(anchors)) anchors = [];
    for (let i = 0; i < Math.min(2, points.length); i++) {
      const a = anchors[i], source = a && features.find(f => f.id === a.featureId);
      const p = source && rings(source.geometry)[a.ring]?.[a.vertex];
      if (G.validCoord(p)) points[i] = p.slice();
    }
    return points;
  }
  function offsetAt(a, b, point) {
    const pr = G.projection(a), q = pr.xy(b), p = pr.xy(point), n = Math.hypot(...q);
    return n ? (-q[1] * p[0] + q[0] * p[1]) / n : 0;
  }
  function dimensionGeometry(feature, features = []) {
    const points = resolveDimension(feature, features);
    if (points.length < 2 || !points.every(G.validCoord)) return null;
    const [a, b] = points, pr = G.projection(a), q = pr.xy(b), length = Math.hypot(...q);
    if (length < 0.01) return null;
    const raw = Number(feature.properties.dimensionOffset ?? 2), offset = Number.isFinite(raw) ? raw : 2;
    const normal = [-q[1] / length, q[0] / length], at = (p, n) => pr.ll([p[0] + normal[0] * n, p[1] + normal[1] * n]);
    const p = at([0, 0], offset), r = at(q, offset), sign = offset < 0 ? -1 : 1;
    const gap = Math.min(.15, Math.abs(offset) * .15), over = Math.min(.3, Math.max(.08, length * .015));
    return { points, length: G.distance(a, b), offset, line: [p, r],
      extensions: [[at([0, 0], sign * gap), at([0, 0], offset + sign * over)], [at(q, sign * gap), at(q, offset + sign * over)]],
      midpoint: [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2] };
  }
  function dimensionLabel(metres, properties = {}) {
    const units = ['m', 'mm', 'ft'].includes(properties.dimensionUnits) ? properties.dimensionUnits : 'm';
    const scale = units === 'mm' ? 1000 : units === 'ft' ? 3.280839895 : 1;
    const places = Number.isInteger(+properties.dimensionPrecision) ? Math.max(0, Math.min(3, +properties.dimensionPrecision)) : units === 'mm' ? 0 : 2;
    return (metres * scale).toFixed(places) + ' ' + units;
  }
  function nearestCorner(coord, features, project, toPixel, tolerance = 16, preferredId = null) {
    const target = toPixel(coord), candidates = [];
    for (const f of features) {
      const m = f.properties || {};
      if (m.hidden || m.guideHidden || m.type === 'measure' || project.hiddenTypes?.includes(m.type)) continue;
      if (m.type === 'service' && project.serviceVisibility?.[m.serviceType] === false && !m.planCommitted) continue;
      rings(f.geometry).forEach((ring, ri) => ring.forEach((p, vi) => {
        if (!G.validCoord(p)) return;
        const px = toPixel(p), d = Math.hypot(px.x - target.x, px.y - target.y);
        if (d <= tolerance) candidates.push({coord:p.slice(), anchor:{featureId:f.id,ring:ri,vertex:vi}, distance:d, preferred:f.id === preferredId});
      }));
    }
    candidates.sort((a,b) => (a.distance - (a.preferred ? 3 : 0)) - (b.distance - (b.preferred ? 3 : 0)));
    return candidates[0] || {coord:coord.slice(),anchor:null};
  }
  const api = {waySegments,captureBounds,captureKey,needsCapture,rings,resolveDimension,offsetAt,dimensionGeometry,dimensionLabel,nearestCorner};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SAMIPlanning = api;
})(typeof window === 'object' ? window : globalThis);
