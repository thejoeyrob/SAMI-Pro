import {
  mapData,
  constraints,
  geocode,
  words,
  route,
  ServiceError,
} from "./upstream.mjs";
import { cloud } from "./cloud.mjs";
import { assistant, configuredAI } from "./assistant.mjs";
const counts = new Map();
function rate(req) {
  const key = (req.headers["x-forwarded-for"] || "local").split(",")[0],
    now = Date.now(),
    hit = counts.get(key) || { at: now, n: 0 };
  if (now - hit.at > 60000) {
    hit.at = now;
    hit.n = 0;
  }
  hit.n++;
  counts.set(key, hit);
  if (counts.size > 2000) counts.delete(counts.keys().next().value);
  if (hit.n > 90)
    throw new ServiceError("Too many requests. Wait a moment and retry.", 429);
}
export async function handler(req, res) {
  const origin = req.headers.origin,
    host = req.headers.host,
    allowed = [
      "capacitor://localhost",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://sami.site",
      "https://www.sami.site",
      ...(process.env.SAMI_ALLOWED_ORIGINS || "").split(",").filter(Boolean),
    ];
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (origin) {
    if (
      !allowed.includes(origin) &&
      origin !== `https://${host}` &&
      origin !== `http://${host}`
    ) {
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: "Origin not allowed." }));
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    rate(req);
    const action =
      req.query?.action ||
      new URL(req.url, "http://localhost").pathname.split("/").at(-1);
    if (action === "health") {
      return res.end(
        JSON.stringify({
          version: "3.0.0",
          cad: "local-vector",
          cloud: !!(
            process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
          ),
          what3words: !!process.env.WHAT3WORDS_API_KEY,
          ai: configuredAI(),
          providers: {
            cad: "OpenStreetMap / Overpass",
            ohl: "OpenStreetMap / Overpass",
            services: "OpenStreetMap / Overpass",
            constraints: "Historic England / Natural England / Planning Data",
            routing: process.env.VALHALLA_URL
              ? "Configured Valhalla"
              : "Public Valhalla reference service",
          },
          timestamp: new Date().toISOString(),
        }),
      );
    }
    if (req.method !== "POST") throw new ServiceError("POST required.", 405);
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (JSON.stringify(body).length > 3_500_000)
      throw new ServiceError(
        "Project is too large for cloud upload. Export the portable project instead.",
        413,
      );
    let data;
    switch (action) {
      case "cad":
      case "ohl":
      case "services":
        data = await mapData(action, body.bounds);
        break;
      case "constraints":
        data = await constraints(body.bounds);
        break;
      case "search":
        data = await geocode(body.query, body.focus);
        break;
      case "words":
        data = await words(body);
        break;
      case "route":
        data = await route(body);
        break;
      case "cloud":
        data = await cloud(
          body,
          (req.headers.authorization || "").replace(/^Bearer\s+/i, ""),
        );
        break;
      case "assistant":
        data = await assistant(body);
        break;
      default:
        throw new ServiceError("Unknown endpoint.", 404);
    }
    return res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = e.status || 502;
    const msg =
      e instanceof ServiceError
        ? e.message
        : /NoObjectGenerated|API key|authentication|credential|verification|credit|funds|quota|not authorized/i.test(
              e.message,
            )
          ? "Connected service is unavailable or needs account configuration. Check Connection status."
          : "The request could not be completed. Your saved drawing is unaffected.";
    return res.end(JSON.stringify({ error: msg }));
  }
}
