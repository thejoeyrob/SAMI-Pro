import test from "node:test";
import assert from "node:assert/strict";
import { apiBase, request, ApiError, NATIVE_API_BASE } from "../src/core/network.mjs";

test("native builds talk to the live SAMI Elite backend, web builds to their own origin", () => {
  delete globalThis.Capacitor;
  assert.equal(apiBase(), "");
  globalThis.Capacitor = { isNativePlatform: () => true };
  assert.equal(apiBase(), NATIVE_API_BASE);
  assert.match(NATIVE_API_BASE, /^https:\/\/sami-elite\.vercel\.app$/);
  delete globalThis.Capacitor;
});

test("requests reach the backend and return its data", async () => {
  globalThis.Capacitor = { isNativePlatform: () => true };
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ words: "filled.count.soap" }), { status: 200 });
  };
  const d = await request("words", { coordinates: [-0.1276, 51.5072] });
  assert.equal(d.words, "filled.count.soap");
  assert.equal(seen.url, "https://sami-elite.vercel.app/api/words");
  assert.equal(seen.init.method, "POST");
  delete globalThis.Capacitor;
});

test("no connection gives a clear error and never a fake or empty result", async () => {
  globalThis.fetch = async () => { throw new TypeError("Load failed"); };
  for (const action of ["words", "services", "ohl", "constraints", "route"]) {
    await assert.rejects(request(action, {}), (e) => e instanceof ApiError && e.details.offline === true && /connection/.test(e.message));
  }
});

test("server errors surface the server's message", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "what3words: Invalid key" }), { status: 422 });
  await assert.rejects(request("words", {}), /Invalid key/);
});
