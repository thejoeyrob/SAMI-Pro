import G from "./geometry.mjs";
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  "sami-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
export const clone = (x) => structuredClone(x);
export const MAX_FEATURES = 15000;
/** @returns {import("../types").Project} */
export function newProject(name = "Untitled site", origin = [-2.127, 52.586]) {
  const now = new Date().toISOString();
  return {
    format: "SAMI-ELITE-1",
    version: 1,
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    revision: 0,
    origin,
    area: null,
    features: [],
    planBase: [],
    snapshots: {},
    meta: {
      client: "",
      company: "",
      author: "",
      jobTitle: "",
      contact: "",
      address: "",
      reference: "",
      revision: "P01",
      notes: "",
    },
    view: { center: origin, zoom: 18, basemap: "cad" },
    library: [],
  };
}
/** @returns {import("../types").Feature} */
export const feature = (type, geometry, properties = {}) => ({
  type: "Feature",
  id: uid(),
  geometry,
  properties: {
    type,
    label: type,
    layer: "design",
    color: "#218879",
    fill: "#7ed2bb",
    opacity: 0.5,
    weight: 1.5,
    ...properties,
  },
});
export function coords(g) {
  if (!g) return [];
  const walk = (a) =>
    typeof a?.[0] === "number" ? [a] : Array.isArray(a) ? a.flatMap(walk) : [];
  return walk(g.coordinates);
}
/** @returns {import("../types").Bounds|null} */
export function boundsOfFeatures(fs) {
  const ps = fs.flatMap((f) => coords(f.geometry));
  if (!ps.length) return null;
  let b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of ps) {
    b[0] = Math.min(b[0], p[0]);
    b[1] = Math.min(b[1], p[1]);
    b[2] = Math.max(b[2], p[0]);
    b[3] = Math.max(b[3], p[1]);
  }
  return b;
}
/** @returns {import("../types").Coord} */
export function centerOf(fs) {
  const b = boundsOfFeatures(fs);
  return b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : [0, 0];
}
export function mapGeometry(g, fn) {
  const walk = (a) => (typeof a?.[0] === "number" ? fn(a) : a.map(walk));
  return { ...g, coordinates: walk(g.coordinates) };
}
export function translate(fs, east, north, origin = centerOf(fs)) {
  const pr = G.projection(origin);
  return fs.map((f) => ({
    ...f,
    geometry: mapGeometry(f.geometry, (p) => {
      const [x, y] = pr.xy(p);
      return pr.ll([x + east, y + north]);
    }),
  }));
}
export function rotate(fs, degrees, origin = centerOf(fs)) {
  const pr = G.projection(origin),
    a = (degrees * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return fs.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      angle: (Number(f.properties.angle || 0) + degrees) % 360,
    },
    geometry: mapGeometry(f.geometry, (p) => {
      const [x, y] = pr.xy(p);
      return pr.ll([x * c - y * s, x * s + y * c]);
    }),
  }));
}
export function scaleFeatures(fs, sx, sy, origin = centerOf(fs)) {
  if (!(sx > 0 && sy > 0 && sx < 1000 && sy < 1000))
    throw Error("Enter positive dimensions.");
  const pr = G.projection(origin);
  return fs.map((f) => ({
    ...f,
    geometry: mapGeometry(f.geometry, (p) => {
      const [x, y] = pr.xy(p);
      return pr.ll([x * sx, y * sy]);
    }),
  }));
}
export function expandSelection(fs, ids, individual = false) {
  const set = new Set(ids);
  if (!individual) {
    const groups = new Set(
      fs
        .filter((f) => set.has(f.id))
        .map((f) => f.properties.groupId)
        .filter(Boolean),
    );
    for (const f of fs) if (groups.has(f.properties.groupId)) set.add(f.id);
  }
  return [...set];
}
export function groupFeatures(fs, ids) {
  if (ids.length < 2) throw Error("Select at least two items to group.");
  const groupId = uid(),
    set = new Set(expandSelection(fs, ids));
  return fs.map((f) =>
    set.has(f.id) ? { ...f, properties: { ...f.properties, groupId } } : f,
  );
}
export function ungroupFeatures(fs, ids) {
  const set = new Set(expandSelection(fs, ids));
  return fs.map((f) => {
    if (!set.has(f.id)) return f;
    const p = { ...f.properties };
    delete p.groupId;
    return { ...f, properties: p };
  });
}
export function duplicateFeatures(fs) {
  const groups = new Map();
  return translate(
    fs.map((f) => {
      const p = { ...f.properties };
      if (p.groupId) {
        if (!groups.has(p.groupId)) groups.set(p.groupId, uid());
        p.groupId = groups.get(p.groupId);
      }
      if (p.runId) p.runId = p.groupId || uid();
      return { ...clone(f), id: uid(), properties: p };
    }),
    3,
    -3,
  );
}
export function polygonArea(g) {
  if (!g || !g.type.includes("Polygon")) return 0;
  const polygons = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  let total = 0;
  for (const rings of polygons) {
    for (let j = 0; j < rings.length; j++) {
      const pr = G.projection(rings[j][0]),
        r = rings[j].map(pr.xy);
      let a = 0;
      for (let i = 0; i < r.length - 1; i++)
        a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
      total += (j ? -1 : 1) * Math.abs(a / 2);
    }
  }
  return Math.max(0, total);
}
export function validateFeatures(fs) {
  if (!Array.isArray(fs) || fs.length > MAX_FEATURES)
    throw Error("This file exceeds the 15,000 object limit.");
  let count = 0;
  const ids = new Set();
  return fs.map((f) => {
    if (
      !f ||
      f.type !== "Feature" ||
      !f.geometry ||
      ![
        "Point",
        "LineString",
        "Polygon",
        "MultiPoint",
        "MultiLineString",
        "MultiPolygon",
      ].includes(f.geometry.type)
    )
      throw Error("Unsupported or missing geometry.");
    const ps = coords(f.geometry);
    count += ps.length;
    if (count > 350000)
      throw Error("Too many vertices. Simplify this drawing first.");
    if (!ps.length || !G.validateFeature(f) || ps.some((p) => !G.validCoord(p)))
      throw Error("Coordinates must be valid WGS84 longitude/latitude.");
    const id = typeof f.id === "string" && !ids.has(f.id) ? f.id : uid();
    ids.add(id);
    const props = { ...(f.properties || {}) };
    for (const key of [
      "label",
      "notes",
      "type",
      "layer",
      "words",
      "assetKind",
      "source",
      "sourceRecord",
    ])
      if (key in props)
        props[key] = String(props[key]).slice(0, key === "notes" ? 10000 : 500);
    for (const [key, min, max] of [
      ["opacity", 0, 1],
      ["angle", -36000, 36000],
      ["weight", 0.1, 20],
      ["fontSize", 8, 48],
      ["width", 0.01, 5000],
      ["length", 0.01, 5000],
    ])
      if (key in props) {
        const n = Number(props[key]);
        if (!Number.isFinite(n)) delete props[key];
        else props[key] = Math.max(min, Math.min(max, n));
      }
    for (const key of ["image", "photo"])
      if (
        props[key] &&
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(props[key])
      )
        delete props[key];
    return { ...f, id, properties: props };
  });
}
/** @returns {import("../types").Project} */
export function migrateProject(raw) {
  let p = raw.project || raw;
  if (p.type === "FeatureCollection") {
    const n = newProject(p.name || "Imported drawing");
    n.features = validateFeatures(p.features);
    n.area = boundsOfFeatures(n.features);
    if (n.area) n.origin = centerOf(n.features);
    return n;
  }
  if (p.format === "SAMI-ELITE-1") {
    const out = { ...newProject(), ...clone(p) };
    out.name = String(out.name || "Imported project").slice(0, 200);
    out.revision = Number.isSafeInteger(out.revision) ? out.revision : 0;
    out.features = validateFeatures(out.features);
    out.planBase = validateFeatures(out.planBase || []);
    out.snapshots = out.snapshots || {};
    for (const k of Object.keys(out.snapshots))
      out.snapshots[k].features = validateFeatures(
        out.snapshots[k].features || [],
      );
    if (out.area && !G.validBounds(out.area))
      throw Error("Invalid project boundary.");
    if (!G.validCoord(out.origin)) throw Error("Invalid project origin.");
    out.meta = { ...newProject().meta, ...out.meta };
    for (const k of Object.keys(out.meta))
      out.meta[k] = String(out.meta[k] ?? "");
    if (
      out.meta.logo &&
      !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(out.meta.logo)
    )
      delete out.meta.logo;
    if (!G.validCoord(out.view?.center))
      out.view = { center: out.origin, zoom: 18, basemap: "cad" };
    return out;
  }
  if (
    !Array.isArray(p.features) ||
    !/^SAMI-PROJECT-[123]$/.test(p.format || "")
  )
    throw Error("Choose a SAMI project or GeoJSON FeatureCollection.");
  const n = newProject(p.name || p.title || "Recovered SAMI project");
  n.id = p.id || n.id;
  n.createdAt = p.createdAt || n.createdAt;
  n.area = G.validBounds(p.area) ? p.area : null;
  n.features = validateFeatures(p.features).map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      color: f.properties.color || f.properties.styleColor || "#278b78",
      fill: f.properties.fill || f.properties.styleFill || "#a5d6c6",
      opacity: Number(
        f.properties.fillOpacity ?? f.properties.styleFillOpacity ?? 0.5,
      ),
      layer: f.properties.type === "service" ? "services" : "design",
    },
  }));
  n.planBase = validateFeatures(p.planBase || []);
  n.origin = n.area
    ? [(n.area[0] + n.area[2]) / 2, (n.area[1] + n.area[3]) / 2]
    : centerOf(n.features);
  n.view = { center: n.origin, zoom: 18, basemap: "cad" };
  n.meta = {
    ...n.meta,
    client: p.client || "",
    company: p.company || "",
    author: p.preparedBy || "",
    address: p.address || "",
    reference: p.reference || "",
    revision: p.revision || "P01",
    notes: p.notes || "",
    logo: p.companyLogo || p.logo || "",
  };
  n.library = p.shapeLibrary || p.customShapes || [];
  n.route = p.route || null;
  n.legacy = clone(p);
  delete n.legacy.features;
  delete n.legacy.planBase;
  return n;
}
export function replaceSnapshot(p, kind, incoming, status, bounds) {
  const old = p.snapshots[kind];
  const keep =
    (status.state === "error" || status.state === "empty") &&
    old?.features?.length;
  return {
    ...p,
    snapshots: {
      ...p.snapshots,
      [kind]: {
        features: keep ? old.features : incoming,
        status: {
          ...status,
          ...(keep ? { updatedAt: old.status.updatedAt } : {}),
          message:
            status.message + (keep ? " Last saved records retained." : ""),
          count: keep ? old.features.length : incoming.length,
        },
        bounds: keep ? old.bounds : bounds,
      },
    },
  };
}
export function planFeatures(p, visibility = {}) {
  return [
    ...p.planBase,
    ...p.features,
    ...Object.values(p.snapshots || {}).flatMap((s) => s.features),
  ].filter(
    (f) =>
      !f.properties.hidden &&
      !f.properties.guideHidden &&
      visibility[f.properties.layer] !== false,
  );
}
export const PRODUCTS = {
  lion: {
    name: "Lion",
    product: "lion",
    length: 2.41,
    width: 3,
    overlap: 0,
    lateralOverlap: 0,
  },
  hybrid: {
    name: "Hybrid",
    product: "hybrid",
    length: 2.44,
    width: 3,
    overlap: 0,
    lateralOverlap: 0,
  },
  tuff: {
    name: "TuffTrak",
    product: "tuff",
    length: 2.5,
    width: 3,
    overlap: 0,
    lateralOverlap: 0,
  },
  sabre: {
    name: "Sabre-X",
    product: "sabre",
    length: 2,
    width: 4,
    overlap: 0.2,
    lateralOverlap: 0.2,
  },
};
export function trakwayRun(points, options) {
  const groupId = uid(),
    result = G.panels(points, options);
  return {
    features: result.panels.map((p, i) =>
      feature("panel", p.geometry, {
        label: `${options.name || options.product} ${i + 1}`,
        product: options.product,
        groupId,
        runId: groupId,
        color: "#526773",
        fill: "#c0ccd2",
        opacity: 0.85,
        weight: 0.65,
        corner: p.corner,
        cornerRule: p.cornerRule,
        sabreUnverified: p.sabreUnverified,
        jointOffsetMm: p.jointOffsetMm,
        runOptions: options,
        runPoints: i === 0 ? points : undefined,
      }),
    ),
    warnings: result.warnings,
  };
}
export function trakwayPad(center, width, length, options, angle = 0) {
  if (!(width > 0 && length > 0 && width <= 500 && length <= 500))
    throw Error("Pad dimensions must be between 0 and 500 m.");
  const across = options.width - (options.lateralOverlap || 0),
    along = options.length - (options.overlap || 0),
    cols = Math.max(
      1,
      Math.ceil((width - (options.lateralOverlap || 0)) / across),
    ),
    rows = Math.max(1, Math.ceil((length - (options.overlap || 0)) / along));
  if (cols * rows > 5000) throw Error("This pad exceeds 5,000 panels.");
  const pr = G.projection(center),
    groupId = uid(),
    fs = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      fs.push(
        feature(
          "panel",
          G.rectangle(
            pr.ll([
              (x - (cols - 1) / 2) * across,
              (y - (rows - 1) / 2) * along,
            ]),
            options.width,
            options.length,
            0,
          ),
          {
            label: options.name,
            product: options.product,
            groupId,
            runId: groupId,
            color: "#526773",
            fill: "#c0ccd2",
            opacity: 0.85,
            weight: 0.65,
          },
        ),
      );
  return {
    features: rotate(fs, angle, center),
    actualWidth: cols * across + (options.lateralOverlap || 0),
    actualLength: rows * along + (options.overlap || 0),
    count: rows * cols,
  };
}
export function quantities(p) {
  const f = p.features.filter((x) => !x.properties.guideHidden),
    panels = f.filter((x) => x.properties.type === "panel"),
    assets = f.filter((x) => x.properties.type === "asset");
  return {
    objects: f.length,
    panels: panels.length,
    assets: assets.length,
    stoneArea: f
      .filter((x) => ["stone", "stone-road"].includes(x.properties.type))
      .reduce((s, x) => s + polygonArea(x.geometry), 0),
    siteArea: p.area ? G.area(p.area) : 0,
  };
}
