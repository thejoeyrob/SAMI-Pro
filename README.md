# SAMI Elite 3.0.0 — release candidate

A fresh, field-focused site planning workspace for browser, iPhone and iPad. Preserves SAMI branding and the recovered Trakway bend layout while making general site design a first-class workflow.

## Run

Node 24 recommended. `npm ci`, then `npm run dev`. Open http://127.0.0.1:5173.
`npm test` runs geometry, portability and network-deadline checks. `npm run build` builds the production PWA and offline shell. `npm run test:e2e` runs desktop/tablet/phone browser workflows (install Playwright Chromium, or set CHROMIUM_EXECUTABLE_PATH).

## Deploy

Vercel framework Vite, build `npm run build`, output `dist`, Node 24. Keep the root `api/` and `server/` directories: uploading only `dist` omits the backend. Private Blob storage is connected in the deployed Elite project. Add WHAT3WORDS_API_KEY server-side. AI Gateway uses Vercel request-context OIDC, but the live call was rejected by the gateway with 403; team gateway authorisation remains outstanding. See `.env.example`, `CLAUDE-HANDOVER.md` and `docs/VERIFICATION.md`.

## iPhone and iPad

The native Xcode project is in `ios/App/App.xcodeproj`; run `npm run ios:sync` first. The app bundles the full offline editor, plus native camera, location and file sharing. It is not just a URL wrapper. `scripts/archive-ios.sh` archives and exports a signed IPA on a configured Mac. Signing needs your Apple team, a registered app ID and credentials. Source code is not an uploadable IPA.

## Data model

`.sami` is a portable JSON project in WGS84. Groups, styles, photos, logos, route and captured source data travel with it. Cloud saves use private edit links and conditional ETag writes; save/load are explicit, not real-time collaboration. Do not share a cloud edit link publicly. Keep exported backups.

## Data provenance

CAD rendering/export are local. First-time context retrieval is a bounded network operation. Small OSM extracts are cached; Overpass remains an alternative for large sites and configured providers. Utilities are public mapped references, not a statutory utility search. Heritage/ecology are queried independently from Historic England and Natural England; local planning/TPO/flood use Planning Data, with incomplete mainly-English coverage. Failures are not reported as a clear site.

## Review before release

This is a release candidate, not a claim of Apple approval or survey/engineering certification. Review `docs/` for the build audit, supported formats, source limits and Apple release steps. Existing SAMI v2.6 projects are excluded from this work.
