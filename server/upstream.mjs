import { DOMParser } from "@xmldom/xmldom";
import G from "../src/core/geometry.mjs";
const cache = new Map(),
  inflight = new Map();
export class ServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}
export async function fetchJSON(
  url,
  {
    timeout = 8000,
    maxBytes = 6_000_000,
    signal,
    format = "json",
    ...options
  } = {},
) {
  const ctl = new AbortController(),
    timer = setTimeout(() => ctl.abort(), timeout),
    abort = () => ctl.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) ctl.abort();
  try {
    const r = await fetch(url, {
      ...options,
      signal: ctl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SAMI-Elite/3.0 (+https://sami.site)",
        ...options.headers,
      },
    });
    if (!r.ok)
      throw new ServiceError(
        r.status === 429
          ? "Source busy. Retry shortly."
          : `Source returned HTTP ${r.status}.`,
        r.status === 429 ? 429 : 502,
      );
    if (Number(r.headers.get("content-length")) > maxBytes)
      throw new ServiceError("Source response exceeded the safe size limit.");
    const reader = r.body.getReader(),
      chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ServiceError("Source response exceeded the safe size limit.");
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    const data = format === "text" ? text : JSON.parse(text);
    return data;
  } catch (e) {
    if (ctl.signal.aborted)
      throw new ServiceError(
        "Source timed out. Your saved plan is unaffected.",
        504,
      );
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export async function cached(key, work, ttl = 300000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return { ...hit.value, cached: true };
  if (inflight.has(key)) return inflight.get(key);
  const job = work()
    .then((value) => {
      cache.set(key, { value, at: Date.now() });
      if (cache.size > 100) cache.delete(cache.keys().next().value);
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}
export function checkedBounds(b, maxArea = 8_000_000) {
  if (!G.validBounds(b) || G.area(b) < 1 || G.area(b) > maxArea)
    throw new ServiceError(
      "Define a smaller valid site area (up to 6 km² plus margin).",
      400,
    );
  return b.map((x) => Math.round(x * 1e7) / 1e7);
}
export function wayGeometry(el) {
  const segments = [];
  let current = [];
  for (const p of el.geometry || []) {
    if (p && G.validCoord([p.lon, p.lat])) current.push([p.lon, p.lat]);
    else {
      if (current.length > 1) segments.push(current);
      current = [];
    }
  }
  if (current.length > 1) segments.push(current);
  if (!segments.length) return null;
  if (segments.length > 1)
    return { type: "MultiLineString", coordinates: segments };
  const ps = segments[0],
    t = el.tags || {},
    closed =
      ps.length > 3 && ps[0][0] === ps.at(-1)[0] && ps[0][1] === ps.at(-1)[1];
  const area =
    closed &&
    (t.building ||
      t.landuse ||
      t.leisure ||
      t.natural === "water" ||
      t.area === "yes" ||
      t.man_made === "works");
  return {
    type: area ? "Polygon" : "LineString",
    coordinates: area ? [ps] : ps,
  };
}
export function osmFeatures(data, kind, bounds) {
  if (!Array.isArray(data.elements))
    throw new ServiceError("Invalid source response.");
  if (data.remark && /runtime error|out of memory|timed out/i.test(data.remark))
    throw new ServiceError(
      "The source could not complete this area. Reduce the area and retry.",
    );
  const fs = [];
  for (const e of data.elements) {
    const t = e.tags || {};
    let geometry =
      e.type === "node"
        ? { type: "Point", coordinates: [e.lon, e.lat] }
        : wayGeometry(e);
    if (!geometry) continue;
    try {
      geometry = G.clipGeometry(geometry, bounds);
    } catch {
      continue;
    }
    if (!geometry) continue;
    let type =
      kind === "cad"
        ? t.building
          ? "building"
          : t.highway
            ? "road"
            : t.railway
              ? "rail"
              : t.waterway || t.natural === "water"
                ? "water"
                : t.natural === "tree"
                  ? "tree"
                  : t.barrier
                    ? "fence"
                    : "context"
        : "service";
    let serviceType =
      kind === "ohl"
        ? "ohl"
        : t.substance === "gas" || t.utility === "gas"
          ? "gas"
          : t.telecom || t.utility === "telecom" || t.communication
            ? "telecom"
            : t.substance === "water" ||
                t.utility === "water" ||
                t.emergency === "fire_hydrant"
              ? "water"
              : t.waterway ||
                  t.sewer ||
                  t.manhole ||
                  ["sewer", "drainage"].includes(t.utility)
                ? "drainage"
                : t.power || ["electricity", "power"].includes(t.utility)
                  ? "electric"
                  : "utility";
    const colours = {
      building: "#a5b0b4",
      road: "#a9b3b4",
      rail: "#8e9299",
      water: "#8db3c2",
      tree: "#83a783",
      context: "#b4bdb3",
      fence: "#a1a9aa",
      ohl: "#b96d7e",
      gas: "#bd9e3f",
      water_service: "#4b9bb9",
      telecom: "#7d72b4",
      drainage: "#948e77",
      electric: "#bf6e59",
      utility: "#8b799a",
    };
    const color =
      kind === "cad"
        ? colours[type] || colours.context
        : colours[serviceType === "water" ? "water_service" : serviceType] ||
          "#8c789b";
    fs.push({
      type: "Feature",
      id: `${kind}:osm:${e.type}:${e.id}`,
      geometry,
      properties: {
        type,
        layer: kind === "cad" ? "context" : kind === "ohl" ? "ohl" : "services",
        serviceType,
        label:
          t.name ||
          t.ref ||
          (kind === "ohl"
            ? t.power === "pole"
              ? "OHL pole"
              : t.power === "tower"
                ? "Electricity pylon"
                : "Overhead line"
            : t.building
              ? "Building"
              : t.highway || serviceType),
        color,
        fill:
          kind === "cad"
            ? type === "building"
              ? "#e9eeec"
              : type === "water"
                ? "#d9e8ed"
                : "#edf0e9"
            : color,
        opacity: kind === "cad" ? 0.8 : 0.16,
        weight: kind === "ohl" ? 2 : 1,
        voltage: t.voltage || "",
        operator: t.operator || "",
        ref: t.ref || "",
        power: t.power || "",
        source: "OpenStreetMap contributors",
        sourceRecord: `https://www.openstreetmap.org/${e.type}/${e.id}`,
        capturedAt: new Date().toISOString(),
        verification:
          "Public mapped reference. Incomplete coverage; not a utility survey.",
      },
    });
    if (fs.length >= 8000) break;
  }
  return fs;
}
export function parseOSM(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new ServiceError("Unexpected XML declaration.");
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.documentElement?.tagName !== "osm")
    throw new ServiceError("Invalid map response.");
  const nodes = new Map(),
    elements = [],
    tags = (e) =>
      Object.fromEntries(
        Array.from(e.getElementsByTagName("tag")).map((t) => [
          t.getAttribute("k"),
          t.getAttribute("v"),
        ]),
      );
  for (const n of Array.from(doc.getElementsByTagName("node"))) {
    const node = {
      type: "node",
      id: n.getAttribute("id"),
      lon: +n.getAttribute("lon"),
      lat: +n.getAttribute("lat"),
      tags: tags(n),
    };
    nodes.set(node.id, node);
    if (Object.keys(node.tags).length) elements.push(node);
  }
  for (const w of Array.from(doc.getElementsByTagName("way"))) {
    const t = tags(w);
    if (!Object.keys(t).length) continue;
    elements.push({
      type: "way",
      id: w.getAttribute("id"),
      tags: t,
      geometry: Array.from(w.getElementsByTagName("nd")).map(
        (n) => nodes.get(n.getAttribute("ref")) || null,
      ),
    });
  }
  return { elements };
}
function matchesKind(e, kind) {
  const t = e.tags || {};
  if (kind === "cad")
    return e.type === "way"
      ? !!(
          t.building ||
          t.highway ||
          t.railway ||
          t.waterway ||
          t.landuse ||
          t.natural ||
          t.barrier
        )
      : t.natural === "tree";
  if (kind === "ohl")
    return (
      ["line", "minor_line", "pole", "tower"].includes(t.power) &&
      t.location !== "underground"
    );
  return !!(
    t.man_made === "pipeline" ||
    t.utility ||
    [
      "cable",
      "underground_cable",
      "substation",
      "transformer",
      "switch",
    ].includes(t.power) ||
    t.telecom === "cable" ||
    ["drain", "ditch"].includes(t.waterway) ||
    t.manhole ||
    t.emergency === "fire_hydrant"
  );
}
async function smallAreaMap(bounds) {
  return cached(
    "osm-small:" + bounds.join(","),
    async () =>
      parseOSM(
        await fetchJSON(
          "https://api.openstreetmap.org/api/0.6/map?bbox=" + bounds.join(","),
          {
            format: "text",
            headers: { Accept: "application/xml" },
            timeout: 6500,
            maxBytes: 8_000_000,
          },
        ),
      ),
    900000,
  );
}
export async function mapData(kind, b) {
  const bbox = checkedBounds(b),
    key = kind + ":" + bbox.join(",");
  return cached(key, async () => {
    const range = [bbox[1], bbox[0], bbox[3], bbox[2]].join(",");
    const clauses =
      kind === "cad"
        ? [
            'way["building"]',
            'way["highway"]',
            'way["railway"]',
            'way["waterway"]',
            'way["landuse"]',
            'way["natural"]',
            'way["barrier"]',
            'node["natural"="tree"]',
          ]
        : kind === "ohl"
          ? [
              'way["power"~"^(line|minor_line)$"]["location"!="underground"]',
              'node["power"~"^(pole|tower)$"]',
            ]
          : [
              'way["man_made"="pipeline"]',
              'way["utility"]',
              'way["power"~"^(cable|underground_cable)$"]',
              'way["telecom"="cable"]',
              'way["waterway"~"^(drain|ditch)$"]',
              'node["utility"]',
              'node["manhole"]',
              'node["power"~"^(substation|transformer|switch)$"]',
              'node["emergency"="fire_hydrant"]',
            ];
    const query =
      "[out:json][timeout:7];(" +
      clauses.map((t) => `${t}(${range});`).join("") +
      ");out body geom;";
    const endpoints = [
      process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter",
      process.env.OVERPASS_FALLBACK_URL ||
        "https://overpass.private.coffee/api/interpreter",
    ];
    let data, error;
    const deadline = Date.now() + 9500;
    // A small, cached map extract avoids dependence on the Overpass query queue.
    // Large sites and configured commercial/self-hosted Overpass still use the query service.
    if (G.area(bbox) <= 2_000_000 && !process.env.OVERPASS_URL) {
      try {
        const raw = await smallAreaMap(bbox);
        data = { elements: raw.elements.filter((e) => matchesKind(e, kind)) };
      } catch (e) {
        error = e;
      }
    }

    for (const endpoint of data ? [] : endpoints) {
      const remaining = deadline - Date.now();
      if (remaining < 500) break;
      try {
        data = await fetchJSON(endpoint, {
          timeout: Math.min(4500, remaining),
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
        });
        if (
          data.remark &&
          /runtime error|timed out|out of memory/i.test(data.remark)
        )
          throw new ServiceError("Source could not complete the query.");
        break;
      } catch (e) {
        data = null;
        error = e;
      }
    }
    if (!data)
      throw (
        error || new ServiceError("Mapped data is temporarily unavailable.")
      );
    const features = osmFeatures(data, kind, bbox);
    return {
      features,
      bounds: bbox,
      source: "OpenStreetMap contributors",
      updatedAt: new Date().toISOString(),
      state: features.length ? "ready" : "empty",
      message: features.length
        ? `${features.length} mapped features loaded.`
        : "No public mapped records returned. This does not confirm absence.",
      partial: data.elements.length >= 8000,
    };
  });
}
const DATASETS = [
  "conservation-area",
  "tree-preservation-zone",
  "local-nature-reserve",
  "flood-risk-zone",
];
async function planningConstraints(b) {
  const bounds = checkedBounds(b),
    key = "constraints:" + bounds.join(",");
  return cached(key, async () => {
    const [w, s, e, n] = bounds,
      url = new URL("https://www.planning.data.gov.uk/entity.geojson");
    for (const d of DATASETS) url.searchParams.append("dataset", d);
    url.searchParams.set(
      "geometry",
      `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`,
    );
    url.searchParams.set("geometry_relation", "intersects");
    url.searchParams.set("limit", "300");
    const data = await fetchJSON(url, { timeout: 8500 });
    if (!Array.isArray(data.features))
      throw new ServiceError(
        "Planning source returned an unexpected response.",
      );
    const features = data.features.flatMap((f) => {
      let g;
      try {
        g = G.clipGeometry(f.geometry, bounds);
      } catch {
        return [];
      }
      if (!g) return [];
      const p = f.properties || {},
        dataset = p.dataset || p.prefix;
      return [
        {
          type: "Feature",
          id: "planning:" + (p.entity || p.reference || Math.random()),
          geometry: g,
          properties: {
            type: "service",
            layer: "constraints",
            label: p.name || dataset || "Planning constraint",
            serviceType: dataset,
            dataset,
            color: dataset?.includes("flood") ? "#609ab2" : "#9980ac",
            fill: dataset?.includes("flood") ? "#9cc8da" : "#b3a0c1",
            opacity: 0.2,
            weight: 1.2,
            source: "Planning Data · England",
            sourceRecord: p.entity
              ? `https://www.planning.data.gov.uk/entity/${p.entity}`
              : "https://www.planning.data.gov.uk/",
            capturedAt: new Date().toISOString(),
            verification:
              "Public planning reference. Coverage varies by dataset and authority.",
          },
        },
      ];
    });
    return {
      features,
      bounds,
      source: "Planning Data · England",
      updatedAt: new Date().toISOString(),
      state:
        data.features.length >= 300
          ? "partial"
          : features.length
            ? "ready"
            : "empty",
      message:
        data.features.length >= 300
          ? "300 record limit reached. Narrow the site for a fuller check."
          : features.length
            ? `${features.length} public planning records loaded.`
            : "No records returned. Coverage is incomplete and mainly England.",
      partial: data.features.length >= 300,
    };
  });
}
const HE =
  "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer";
const NE = "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services";
const DIRECT_CONSTRAINTS = [
  {
    id: "listed",
    name: "Listed buildings",
    source: "Historic England",
    url: HE + "/0",
  },
  {
    id: "monuments",
    name: "Scheduled monuments",
    source: "Historic England",
    url: HE + "/6",
  },
  {
    id: "sssi",
    name: "SSSI",
    source: "Natural England",
    url: NE + "/SSSI_England/FeatureServer/0",
  },
  {
    id: "woodland",
    name: "Ancient woodland inventory",
    source: "Natural England",
    url: NE + "/Ancient_Woodland_England/FeatureServer/0",
  },
  {
    id: "woodland-revised",
    name: "Revised ancient woodland",
    source: "Natural England",
    url: NE + "/Ancient_Woodland_Revised_England/FeatureServer/0",
  },
];
async function directConstraint(source, bounds) {
  const u = new URL(source.url + "/query");
  Object.entries({
    f: "geojson",
    where: "1=1",
    geometry: bounds.join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: "300",
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const d = await fetchJSON(u, { timeout: 8200 });
  if (d.error || !Array.isArray(d.features))
    throw new ServiceError(source.name + " source is unavailable.");
  const features = d.features.flatMap((f, index) => {
    let geometry;
    try {
      geometry = G.clipGeometry(f.geometry, bounds);
    } catch {
      return [];
    }
    if (!geometry) return [];
    const p = f.properties || {},
      gs =
        geometry.type === "MultiPoint"
          ? geometry.coordinates.map((c) => ({ type: "Point", coordinates: c }))
          : [geometry];
    return gs.map((g, i) => ({
      type: "Feature",
      id:
        source.id +
        ":" +
        (p.ListEntry || p.LIST_ENTRY || p.OBJECTID || p.FID || index) +
        ":" +
        i,
      geometry: g,
      properties: {
        type: "service",
        layer: "constraints",
        serviceType: source.id,
        label: p.Name || p.NAME || p.name || source.name,
        color: source.source === "Natural England" ? "#688c67" : "#94729f",
        fill: source.source === "Natural England" ? "#a5c7a3" : "#c1a6cd",
        opacity: 0.2,
        source: source.source,
        sourceRecord: p.hyperlink || p.Hyperlink || p.HYPERLINK || source.url,
        capturedAt: new Date().toISOString(),
        verification:
          "Official published reference. Boundaries and status require checking; not a complete site search.",
        attribution:
          source.source +
          "; contains OS data © Crown copyright and database right.",
      },
    }));
  });
  return { features, partial: d.features.length >= 300 };
}
export async function constraints(b) {
  const bounds = checkedBounds(b);
  return cached(
    "constraints-direct:" + bounds.join(","),
    async () => {
      const sources = [
        {
          name: "Local planning, flood & TPO records",
          source: "Planning Data",
          load: () => planningConstraints(bounds),
        },
        ...DIRECT_CONSTRAINTS.map((s) => ({
          ...s,
          load: () => directConstraint(s, bounds),
        })),
      ];
      const results = await Promise.allSettled(sources.map((s) => s.load()));
      const statuses = results.map((r, i) => ({
        name: sources[i].name,
        state:
          r.status === "rejected"
            ? "error"
            : r.value.partial
              ? "partial"
              : r.value.features.length
                ? "ready"
                : "empty",
        count: r.status === "fulfilled" ? r.value.features.length : 0,
        message: r.status === "rejected" ? r.reason.message : "",
      }));
      const features = results.flatMap((r) =>
          r.status === "fulfilled" ? r.value.features : [],
        ),
        failed = statuses.filter((s) => s.state === "error");
      if (failed.length === sources.length)
        throw new ServiceError(
          "All constraint sources are currently unavailable. Saved records remain on your plan.",
          503,
        );
      const partial =
        failed.length > 0 || statuses.some((s) => s.state === "partial");
      return {
        features,
        bounds,
        statuses,
        source: "Historic England / Natural England / Planning Data",
        updatedAt: new Date().toISOString(),
        state: partial ? "partial" : features.length ? "ready" : "empty",
        partial,
        message:
          `${features.length} records; ${sources.length - failed.length}/${sources.length} sources responded.` +
          (failed.length
            ? " Unavailable: " + failed.map((s) => s.name).join(", ") + "."
            : "") +
          " Coverage is England-focused. Revised woodland supersedes older geometry where available.",
      };
    },
    900000,
  );
}
export async function geocode(q, focus) {
  q = String(q || "").trim();
  if (q.length < 3 || q.length > 180)
    throw new ServiceError(
      "Enter an address, postcode, coordinates or three-word address.",
      400,
    );
  const coordinate = q.match(
    /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
  );
  if (coordinate) {
    const p = [+coordinate[2], +coordinate[1]];
    if (!G.validCoord(p)) throw new ServiceError("Invalid coordinates.", 400);
    return {
      results: [{ name: q, coordinates: p, source: "Entered coordinates" }],
    };
  }
  if (/^(\/\/\/)?[\p{L}\p{M}-]+\.[\p{L}\p{M}-]+\.[\p{L}\p{M}-]+$/u.test(q)) {
    const d = await words({ words: q });
    return {
      results: [
        {
          name: "///" + d.words,
          coordinates: [d.coordinates.lng, d.coordinates.lat],
          words: d.words,
          source: "what3words",
        },
      ],
    };
  }
  return cached(
    "geocode:" + q.toLowerCase(),
    async () => {
      if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(q)) {
        const d = await fetchJSON(
          "https://api.postcodes.io/postcodes/" + encodeURIComponent(q),
        );
        return {
          results: [
            {
              name: d.result.postcode + ", " + (d.result.admin_district || ""),
              coordinates: [d.result.longitude, d.result.latitude],
              source: "Postcodes.io · postcode centroid",
            },
          ],
        };
      }
      const u = new URL(
        process.env.PHOTON_URL || "https://photon.komoot.io/api/",
      );
      u.searchParams.set("q", q);
      u.searchParams.set("limit", "5");
      u.searchParams.set("lang", "en");
      if (G.validCoord(focus)) {
        u.searchParams.set("lat", String(focus[1]));
        u.searchParams.set("lon", String(focus[0]));
      }
      const d = await fetchJSON(u, { timeout: 8000 });
      return {
        results: (d.features || []).map((f) => ({
          name: [
            f.properties.name,
            f.properties.street,
            f.properties.city,
            f.properties.postcode,
            f.properties.country,
          ]
            .filter(Boolean)
            .join(", "),
          coordinates: f.geometry.coordinates,
          source: "Photon · OpenStreetMap",
        })),
      };
    },
    3600000,
  );
}
export async function words(input) {
  const key = process.env.WHAT3WORDS_API_KEY;
  if (!key)
    throw new ServiceError(
      "what3words is not configured. Add WHAT3WORDS_API_KEY to the Vercel project; coordinates and map placement still work.",
      503,
    );
  const action = input.suggest
      ? "autosuggest"
      : input.words
        ? "convert-to-coordinates"
        : "convert-to-3wa",
    u = new URL("https://api.what3words.com/v3/" + action);
  u.searchParams.set("key", key);
  if (input.words)
    u.searchParams.set(
      input.suggest ? "input" : "words",
      String(input.words).replace(/^\/+/, ""),
    );
  else {
    if (!G.validCoord(input.coordinates))
      throw new ServiceError("Choose a point first.", 400);
    u.searchParams.set(
      "coordinates",
      `${input.coordinates[1]},${input.coordinates[0]}`,
    );
    u.searchParams.set("language", "en");
  }
  if (input.suggest) u.searchParams.set("clip-to-country", "GB");
  const d = await fetchJSON(u, { timeout: 6000 });
  if (d.error) throw new ServiceError("what3words: " + d.error.message, 422);
  return d;
}
function decodePolyline(str) {
  let i = 0,
    x = 0,
    y = 0,
    out = [];
  while (i < str.length) {
    let result = 0,
      shift = 0,
      b;
    do {
      b = str.charCodeAt(i++) - 63;
      result |= (b & 31) << shift;
      shift += 5;
      if (shift > 30 || i > str.length + 1)
        throw Error("Invalid route geometry");
    } while (b >= 32);
    x += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      b = str.charCodeAt(i++) - 63;
      result |= (b & 31) << shift;
      shift += 5;
      if (shift > 30 || i > str.length + 1)
        throw Error("Invalid route geometry");
    } while (b >= 32);
    y += result & 1 ? ~(result >> 1) : result >> 1;
    out.push([y / 1e6, x / 1e6]);
  }
  return out;
}
export async function route(input) {
  const { from, to, vehicle } = input;
  if (!G.validCoord(from) || !G.validCoord(to))
    throw new ServiceError("Choose a departure and an access point.", 400);
  for (const k of ["height", "width", "length", "weight"])
    if (!Number.isFinite(vehicle?.[k]) || vehicle[k] <= 0 || vehicle[k] > 100)
      throw new ServiceError("Check vehicle dimensions and weight.", 400);
  const payload = {
    locations: [
      { lat: from[1], lon: from[0] },
      { lat: to[1], lon: to[0] },
    ],
    costing: "truck",
    costing_options: {
      truck: {
        height: vehicle.height,
        width: vehicle.width,
        length: vehicle.length,
        weight: vehicle.weight,
        exclude_restricted: true,
      },
    },
    units: "kilometers",
    language: "en-GB",
  };
  const u = new URL(
    process.env.VALHALLA_URL || "https://valhalla1.openstreetmap.de/route",
  );
  u.searchParams.set("json", JSON.stringify(payload));
  const d = await fetchJSON(u, { timeout: 9000 });
  if (d.trip?.status !== 0 || !d.trip.legs?.length)
    throw new ServiceError(
      d.error || "No route was returned for this vehicle.",
    );
  const coordinates = d.trip.legs.flatMap((l) => decodePolyline(l.shape));
  return {
    geometry: { type: "LineString", coordinates },
    distanceKm: d.trip.summary.length,
    durationSeconds: d.trip.summary.time,
    maneuvers: d.trip.legs
      .flatMap((l) => l.maneuvers || [])
      .map((m) => ({
        instruction: m.instruction,
        distanceKm: m.length,
        time: m.time,
      })),
    vehicle,
    from,
    to,
    source: "Valhalla / OpenStreetMap · truck profile",
    updatedAt: new Date().toISOString(),
    warning:
      "Route planning reference. Verify restrictions, bridge heights, delivery access and current road conditions. Navigation handoff does not retain this truck profile.",
  };
}
