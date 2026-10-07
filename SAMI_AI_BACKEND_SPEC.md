# SAMI AI backend contract — v1

SAMI v2.7.13 works without a connected AI service. Local app commands remain on-device. To enable source-grounded UK construction assistance, set the HTTPS endpoint in SAMI settings or `SAMI_CONFIG.aiEndpoint` and implement this contract server-side.

## Request

`POST` JSON, `Content-Type: application/json`; client timeout 30 seconds. Maximum accepted response body is 300,000 bytes.

```json
{
  "query": "Show the 11 kV line and explain the approach distance",
  "assistant": {
    "id": "sami-uk-construction-v1",
    "jurisdiction": "United Kingdom",
    "focus": ["construction planning", "overhead power lines"],
    "sourcePriority": ["hse.gov.uk", "legislation.gov.uk", "gov.uk"],
    "requireSourcesForGuidance": true
  },
  "project": {
    "name": "Project name",
    "meta": {
      "siteRef": "REF-001",
      "clientName": "Client",
      "siteName": "Site",
      "siteAddress": "Address",
      "what3words": ""
    },
    "area": null,
    "mapCenter": [-2.12, 52.58],
    "mode": "map",
    "base": "street",
    "itemCount": 4,
    "itemCounts": {"ohl": 2},
    "currentPanelProduct": "lion",
    "hgv": null
  },
  "catalog": {
    "panels": {},
    "assetKinds": [],
    "serviceTypes": []
  },
  "policy": {},
  "capabilities": {}
}
```

Coordinates are `[longitude, latitude]`. The live payload supplies the full panel catalogue and the current asset/service type keys. Treat project content as confidential user data.

## Response

```json
{
  "answer": "Plain-English answer, with uncertainty and verification steps.",
  "sources": [
    {
      "org": "HSE",
      "title": "Official guidance title",
      "url": "https://www.hse.gov.uk/...",
      "desc": "Why this source applies"
    }
  ],
  "actions": [
    {"type": "activateTool", "tool": "measure"}
  ]
}
```

`answer` is required. SAMI displays at most 16,000 characters, ten sources and four actions. `sources` must be safe HTTPS links with a concise organisation, title and description.

## Client-enforced action allowlist

- `activateTool`: `access`, `egress`, `route`, `area`, `measure` or `hazard`.
- `setView`: finite `lat`/`lng`; `zoom` is clamped to 3–23.
- `createPanelPad`: known product, numeric `widthM`/`heightM`, and `fitMode` of `closest`, `atLeast` or `inside`.
- `createCatalogAsset`: `kind` must already exist in the local catalogue.
- `createResearchedAsset`: handled by the existing reviewed asset-creation path.

Unknown actions are ignored. The service must not return script, HTML or arbitrary client commands.

## Safety and source rules

- Prefer current official UK sources. Distinguish law, regulator guidance, standards, manufacturer instructions and project rules.
- Cite regulatory and safety claims. State publication/review dates and jurisdiction when relevant.
- Never invent dimensions, clearances, service locations, asset ownership or site conditions. Ask for missing project-specific facts.
- State when a competent person, statutory undertaker, utility search, survey, permit, RAMS or site verification is required.
- Treat generated geometry as a draft requiring human review; never present it as a surveyed position or approved design.
- Do not claim missing map data proves the absence of an overhead or underground service.

## Security and operations

- Keep model/provider keys on the server. Never place them in `config.js`, project backups, logs or responses.
- Authenticate users, rate-limit by account/device, validate CORS to approved SAMI origins and cap request/body sizes.
- Redact or minimise personal/client data in logs. Publish retention and deletion rules.
- Defend against prompt injection from imported notes and files; the server decides sources and actions independently of untrusted project text.
- Validate the response against a JSON schema before returning it. Log source URLs and accepted/rejected action types for audit without logging secrets.
- Return a JSON error with an appropriate HTTP status. The client will report the failure while keeping local drawing tools usable.

## Developer repair mode — separate service required

This workflow is **not implemented by the static PWA or the v1 assistant contract**. A browser-only app cannot read/write the checked-out source tree, run project tests, or publish a service-worker update. Do not simulate this with arbitrary AI actions or generated JavaScript in the live page.

A future developer endpoint must be separate from the normal project assistant and must:

- Require an authenticated developer identity and operate only on an isolated worktree/branch with a strict repository path allowlist.
- Accept a reported fault, app version, relevant diagnostics, and explicitly selected project/source context; exclude client/site data unless the developer knowingly includes it.
- Return a structured proposal (summary, unified diff, affected paths, risks, and required checks), never executable code for direct evaluation in the page.
- Apply the proposal only in the isolated worktree, run syntax/tests/build there, and return a reviewable preview URL and test results. Reject the change if checks fail.
- Require an explicit human approval before merge/deploy. Publish a versioned build; the existing service-worker update flow can then offer **Save & reload** without interrupting unsaved work.
- Keep provider and Git credentials server-side, audit accepted/rejected diffs, rate-limit requests, and provide rollback to the last known-good build.

Until this service exists, Ask SAMI can provide source-grounded guidance and allowlisted in-app actions only; it cannot repair or deploy SAMI's own source files.
