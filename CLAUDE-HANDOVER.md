# SAMI Elite 3.0.0 — start here

Prepared for Joseph Whelan, 16 November 2026.

This ZIP is a **new application root** with web/backend source, a built PWA, and the iPhone/iPad Xcode project. It is not an incremental patch to the old static SAMI. Preserve the original repository and work on a separate release branch. SAMI v2.6 is excluded.

## Current result

- Strongest recovered historical baseline: clean `SAMI-Pro-2.9.0-STUDIO-FLAT-PWA.zip`; 28 archived builds and two repository snapshots assessed.
- New Vercel project `sami-elite` is already deployed. Current successful deployment is `dpl_2WvTApiqwdJDchknSrEergEwc4a2` in team `team_dUXnt0KTZZW6abmmwWaWKrwC`.
- Local vector CAD and exports are independent of external generation. Mapping/services have finite deadlines; independent constraint sources can return partial results.
- Recovered Trakway corner geometry, whole-panel pads, grouping, measured assets, local proposals, portable projects and private cloud saves are implemented.
- 15 automated tests pass; production build and native asset sync pass. Detailed live checks and limitations are in `docs/VERIFICATION.md`.

## Finish the external setup

1. First confirm the exact domain the user purchased: strict checks show sami.site has no delegation and Vercel currently lists it as available. Read the corrected `docs/DEPLOYMENT-HANDOVER.md`; apply DNS records only once the correct owned domain/account is established. Do not buy a domain, remove mail records or change nameservers unnecessarily.
2. Add a valid server-side `WHAT3WORDS_API_KEY`, fix AI Gateway team authorisation (live upstream 403), redeploy, and verify both features. Never expose credentials with a `VITE_` prefix.
3. Use the complete source root for Vercel. Keep `api/`, `server/` and the lockfile. Uploading `dist` alone loses backend functionality. Private Blob is already connected to the Elite project.
4. With authorised GitHub access, create a separate branch and run the included CI. The connector used for this work returned 403; it did not create a branch or commit.
5. On a Mac, run the Apple release steps and real-device tests. The ZIP does not contain a signed IPA. Use `scripts/archive-ios.sh` or Xcode Organizer after setting the Apple team and a unique build number.

Do not replace the native backend origin with an expiring preview URL. It defaults to `https://sami.site`; an intentional alternative requires `VITE_API_BASE` at build time, followed by `npm run ios:sync`.

## Run and validate

Node 24 recommended. Run `npm ci`, `npm test`, then `npm run dev`. Local app URL: `http://127.0.0.1:5173`.

Run Playwright on a supported machine and finish the file-import workflow that could not be verified through this environment's file chooser. Walk a real project from site location through CAD, Trakway, welfare/plant, constraints, route, PDF, portable save and reopening on a second device.

Do not conflate public mapped services with an authoritative utility search, or reference truck routing with certified HGV navigation. Keep source dates and partial/error states visible.

## Package contents

| Path | Purpose |
|---|---|
| `src/` | Responsive editor, geometry, asset catalogue, project data and document export |
| `api/`, `server/` | Vercel endpoints, provider handling, private cloud and connected assistant |
| `dist/` | Built browser assets; not a standalone backend deployment |
| `ios/` | Native iPhone/iPad project with bundled web assets |
| `tests/`, `.github/workflows/` | Core tests and browser/native verification workflow |
| `docs/BUILD-ASSESSMENT.md` | Version journey, best historical build and regressions |
| `docs/VERIFICATION.md` | Actual passes, timings and unfinished checks |
| `docs/DEPLOYMENT-HANDOVER.md` | Domain records, deployment configuration and credential setup |
| `docs/APPLE-RELEASE.md` | Mac signing, TestFlight and App Store preparation |
| `BUILD-MANIFEST.json` | Exact packaged file sizes and SHA-256 checksums |

Dependencies are pinned in `package-lock.json`. `node_modules`, private keys and environment secrets are deliberately not included; install dependencies with `npm ci`.
