// SAMI Elite 3.0.0 - Local/Offline Services
// All services run locally without backend dependencies

import {
  getLocalCAD,
  getLocalConstraints,
  getLocalServices,
  OFFLINE_DATA,
} from "./offline-data.mjs";

export class LocalServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

// Health check - report offline mode
export async function checkHealth() {
  return {
    version: "3.0.0",
    mode: "offline-local",
    cad: "local-vector",
    cloud: false,
    what3words: false,
    ai: false,
    providers: {
      cad: "Local rendering (OpenStreetMap reference)",
      ohl: "Local data only",
      services: "Local data only",
      constraints: "Local data only",
      routing: "Offline (manual or external tools)",
    },
    timestamp: new Date().toISOString(),
  };
}

// Local search - returns empty (user can place manually)
export async function localSearch(query, focus) {
  // Could implement local geocoding here if needed
  return { results: [] };
}

// Local What3Words - returns empty (user can enter manually)
export async function localWords(body) {
  return {
    words: "unavailable.in.offline",
    coordinates: body.coordinates,
    note: "What3Words requires internet connection. Enter address manually.",
  };
}

// Local CAD - returns offline data or empty with import instructions
export async function localMapData(kind, bounds) {
  return getLocalCAD(bounds);
}

// Local constraints - returns reference data with import instructions
export async function localConstraints(bounds) {
  return getLocalConstraints(bounds);
}

// Local routing - returns unavailable message
export async function localRoute(body) {
  return {
    error: "Route calculation requires internet. Use mapping app or external routing service.",
    status: 503,
  };
}

// Local AI - returns unavailable message
export async function localAssistant(body) {
  return {
    error: "AI Assistant (Ask SAMI) requires internet connection.",
    status: 503,
  };
}

// Local cloud - returns unavailable message
export async function localCloud(body, key) {
  return {
    error: "Cloud sync disabled in offline mode. Projects save locally.",
    status: 503,
  };
}

// Main dispatcher for local services
export async function handleLocalService(action, body) {
  switch (action) {
    case "health":
      return await checkHealth();
    case "search":
      return await localSearch(body.query, body.focus);
    case "words":
      return await localWords(body);
    case "cad":
    case "ohl":
      return await localMapData(action, body.bounds);
    case "services":
      return getLocalServices(body.bounds);
    case "constraints":
      return await localConstraints(body.bounds);
    case "route":
      return await localRoute(body);
    case "assistant":
      return await localAssistant(body);
    case "cloud":
      return await localCloud(body, "");
    default:
      throw new LocalServiceError("Unknown service: " + action, 404);
  }
}
