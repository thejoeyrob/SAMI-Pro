// SAMI Elite network layer.
// The browser build talks to its own origin. The native (TestFlight) build has no
// origin of its own, so it talks to the SAMI Elite production deployment. With no
// connection, each lookup fails with a clear message; local drawing, CAD and exports
// keep working. Empty offline results are never returned, so a missing lookup is never
// mistaken for "nothing there".

// Stable production alias of the sami-elite Vercel project (not an expiring preview).
// Override at build time with VITE_API_BASE once sami.site DNS points at Vercel.
export const NATIVE_API_BASE = "https://sami-elite.vercel.app";

export function isNative() {
  return !!globalThis.Capacitor?.isNativePlatform?.();
}

export function apiBase() {
  const env = import.meta.env?.VITE_API_BASE;
  if (env) return env.replace(/\/$/, "");
  return isNative() ? NATIVE_API_BASE : "";
}

// Public web address used for share links. Native builds cannot share capacitor://.
export function publicBase() {
  return isNative() ? apiBase() : window.location.origin;
}

export class ApiError extends Error {
  constructor(message, status = 0, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const OFFLINE_MESSAGES = {
  words: "what3words needs a connection. Check your signal and try again.",
  search: "Place search needs a connection. Check your signal and try again.",
  route: "Route planning needs a connection. Check your signal and try again.",
  assistant:
    "Ask SAMI's connected answers need a connection. Local commands still work.",
  cad: "Mapped CAD detail needs a connection. Your drawing still works.",
  ohl: "Overhead line lookup needs a connection. Nothing shown does not mean no lines.",
  services: "Mapped services lookup needs a connection. Nothing shown does not mean no services.",
  constraints: "Constraint lookup needs a connection. Nothing shown does not mean no constraints.",
  cloud: "Cloud save needs a connection. Your project is still saved on this device.",
  health: "SAMI's connected services are unreachable right now.",
};

async function offline(action, _body, cause) {
  throw new ApiError(
    OFFLINE_MESSAGES[action] ||
      "SAMI's connected services are unreachable. Local drawing tools still work.",
    0,
    { offline: true, cause: cause?.message },
  );
}

export async function request(
  action,
  body,
  { timeout = 12000, signal = undefined, headers = {} } = {},
) {
  if (globalThis.navigator && navigator.onLine === false)
    return offline(action, body);
  const ctl = new AbortController(),
    timer = setTimeout(
      () => ctl.abort(new DOMException("Request timed out", "TimeoutError")),
      timeout,
    );
  const abort = () => ctl.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  try {
    let r;
    try {
      r = await fetch(`${apiBase()}/api/${action}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctl.signal,
      });
    } catch (e) {
      if (ctl.signal.aborted)
        throw new ApiError(
          signal?.aborted
            ? "Cancelled."
            : "The source took too long. Saved data is still available.",
          408,
        );
      // fetch rejects with a TypeError when there is no route to the server.
      return await offline(action, body, e);
    }
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        "The server returned an invalid response. Check connection status.",
        r.status,
      );
    }
    if (!r.ok)
      throw new ApiError(
        data.error || `Request failed (${r.status}).`,
        r.status,
        data,
      );
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (ctl.signal.aborted)
      throw new ApiError(
        signal?.aborted
          ? "Cancelled."
          : "The source took too long. Saved data is still available.",
        408,
      );
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
