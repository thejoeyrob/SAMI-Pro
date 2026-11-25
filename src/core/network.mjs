export function apiBase() {
  // SAMI Elite 3.0.0 - Fully offline/local mode
  // No external API dependencies required
  return "local://offline";
}
export class ApiError extends Error {
  constructor(message, status = 0, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
// Local service handler for offline-first mode
import { handleLocalService, LocalServiceError } from "./local-services.mjs";

export async function request(
  action,
  body,
  { timeout = 12000, signal = undefined, headers = {} } = {},
) {
  // SAMI Elite 3.0.0 - Fully offline/local mode
  // All services handled locally without backend

  const ctl = new AbortController(),
    timer = setTimeout(
      () => ctl.abort(new DOMException("Request timed out", "TimeoutError")),
      timeout,
    );
  const abort = () => ctl.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });

  try {
    // Use local services instead of API calls
    const data = await handleLocalService(action, body);

    // Check if response has error flag
    if (data?.error) {
      throw new ApiError(data.error, data.status || 503);
    }

    return data;
  } catch (e) {
    if (ctl.signal.aborted)
      throw new ApiError(
        signal?.aborted
          ? "Cancelled."
          : "The source took too long. Saved data is still available.",
        408,
      );
    if (e instanceof LocalServiceError)
      throw new ApiError(e.message, e.status);
    if (e instanceof ApiError)
      throw e;
    throw new ApiError(e.message || "Local service error", 502);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
