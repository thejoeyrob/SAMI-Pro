export function apiBase() {
  if (import.meta.env?.VITE_API_BASE)
    return import.meta.env.VITE_API_BASE.replace(/\/$/, "");
  return globalThis.Capacitor?.isNativePlatform?.()
    ? "https://sami.site"
    : import.meta.env?.VITE_API_BASE || "";
}
export class ApiError extends Error {
  constructor(message, status = 0, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export async function request(
  action,
  body,
  { timeout = 12000, signal = undefined, headers = {} } = {},
) {
  const ctl = new AbortController(),
    timer = setTimeout(
      () => ctl.abort(new DOMException("Request timed out", "TimeoutError")),
      timeout,
    );
  const abort = () => ctl.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  try {
    const r = await fetch(`${apiBase()}/api/${action}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
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
