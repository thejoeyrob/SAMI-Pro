import http from "node:http";
import { createServer } from "vite";
import { handler } from "./handlers.mjs";
const api = http.createServer(async (req, res) => {
  let body = "",
    tooLarge = false;
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 3_500_000) {
      tooLarge = true;
      break;
    }
  }
  if (tooLarge) {
    res.writeHead(413, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Request too large." }));
  }
  try {
    req.body = body ? JSON.parse(body) : {};
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid JSON." }));
  }
  await handler(req, res);
});
api.listen(5174, "127.0.0.1");
const vite = await createServer();
await vite.listen();
vite.printUrls();
