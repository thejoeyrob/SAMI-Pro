import { get, put, del } from "@vercel/blob";
import { createHash, randomBytes } from "node:crypto";
import { migrateProject } from "../src/core/model.mjs";
import { ServiceError } from "./upstream.mjs";
const configured = () =>
  !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
function cloudPath(token) {
  if (!/^[a-f0-9]{64}$/.test(token || ""))
    throw new ServiceError("A valid private workspace key is required.", 401);
  return (
    "projects/" + createHash("sha256").update(token).digest("hex") + ".json"
  );
}
// Blob GET may use a weak HTTP ETag after response compression; the object
// version token is unchanged. Conditional storage writes require its strong form.
export const normalizeETag = (value) =>
  typeof value === "string" ? value.replace(/^W\//, "") : value;
async function read(path) {
  const result = await get(path, {
    access: "private",
    useCache: false,
    abortSignal: AbortSignal.timeout(7000),
  });
  if (!result || result.statusCode !== 200) return null;
  return {
    data: await new Response(result.stream).json(),
    etag: normalizeETag(result.blob.etag),
  };
}
export async function budget(scope, limit) {
  if (!configured())
    throw new ServiceError("Private cloud storage is not configured.", 503);
  const day = new Date().toISOString().slice(0, 10),
    path = "limits/" + scope.replace(/[^a-z0-9-]/gi, "") + "/" + day + ".json";
  for (let i = 0; i < 4; i++) {
    const hit = await read(path),
      n = hit?.data.count || 0;
    if (n >= limit)
      throw new ServiceError(
        "The daily preview allowance has been reached. Local drawing and exports still work.",
        429,
      );
    try {
      await put(path, JSON.stringify({ count: n + 1 }), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: !!hit,
        ...(hit ? { ifMatch: hit.etag } : {}),
        ttlDays: 2,
        abortSignal: AbortSignal.timeout(7000),
        contentType: "application/json",
      });
      return;
    } catch (e) {
      if (/precondition|already exists/i.test(e.message)) continue;
      throw e;
    }
  }
  throw new ServiceError("Cloud is busy. Please retry.", 409);
}
export async function cloud(input, token) {
  if (!configured())
    throw new ServiceError("Private cloud storage is not configured.", 503);
  const op = input.operation || "read";
  input = { ...input, etag: normalizeETag(input.etag) };
  if (op === "create") {
    await budget("new-projects", 50);
    const project = migrateProject(input.project),
      key = randomBytes(32).toString("hex");
    const result = await put(
      cloudPath(key),
      JSON.stringify({
        project,
        version: 1,
        updatedAt: new Date().toISOString(),
      }),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/json",
        abortSignal: AbortSignal.timeout(8000),
      },
    );
    return { key, etag: normalizeETag(result.etag), version: 1 };
  }
  const path = cloudPath(token),
    current = await read(path);
  if (!current)
    throw new ServiceError(
      "This cloud project was not found, or its link has been revoked.",
      404,
    );
  if (op === "read") return { ...current.data, etag: current.etag };
  if (!input.etag || input.etag !== current.etag)
    throw new ServiceError(
      "Another device has saved a newer version. Load the cloud copy or save your work as a separate project.",
      409,
    );
  try {
    if (op === "delete") {
      await del(path, {
        ifMatch: input.etag,
        abortSignal: AbortSignal.timeout(8000),
      });
      return { deleted: true };
    }
    if (op !== "save") throw new ServiceError("Unknown cloud action.", 400);
    const project = migrateProject(input.project);
    const result = await put(
      path,
      JSON.stringify({
        project,
        version: current.data.version + 1,
        updatedAt: new Date().toISOString(),
      }),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        ifMatch: input.etag,
        contentType: "application/json",
        abortSignal: AbortSignal.timeout(8000),
      },
    );
    return {
      etag: normalizeETag(result.etag),
      version: current.data.version + 1,
    };
  } catch (e) {
    if (/precondition/i.test(e.message))
      throw new ServiceError(
        "Another device saved during this upload. Your local changes are safe; resolve the conflict before saving again.",
        409,
      );
    throw e;
  }
}
