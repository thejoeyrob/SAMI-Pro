# SAMI Elite 3.0.0 — verification and release gates

Recorded 16 November 2026. This is a reviewable release candidate, not a signed App Store submission.

## Delivered deployment

Vercel project: `sami-elite`, project ID `prj_iYOYEBtpX5ZLDpgZel6BEqcOfqUZ`.

Current successful deployment: `dpl_2WvTApiqwdJDchknSrEergEwc4a2`.

Deployment hostname: `sami-elite-qms666nnp-josephrwhelan-6160.vercel.app`. Deployment hostnames retain Vercel protection. The temporary review URL supplied separately expires; it is intentionally not embedded in app code or this package.

`sami.site` and `www.sami.site` are attached, but external DNS is not yet corrected. See `DEPLOYMENT-HANDOVER.md` for the observed records and recommended changes.

## Completed checks

| Check | Observed result |
|---|---|
| Automated core suite | 15 tests passed, zero failures, zero skipped |
| Production web build | TypeScript and Vite build passed; offline shell generated |
| Native asset preparation | `npm run ios:sync` passed; four native plugins registered |
| Desktop editor | Example opened; measured Trakway pad placed; group/ungroup and colour controls exercised |
| Responsive layout | Same deployed app visually checked at 390 px phone and 820 px tablet widths, plus desktop; this is browser viewport testing, not physical-device testing |
| Local Ask SAMI | A 20 × 15 m stone-area request produced a proposal, Apply created the area, and Undo restored the previous plan |
| PDF export | Example with 77 plan objects / 56 panels produced a two-page A3 landscape vector PDF; approximately 284 ms from click to download in the desktop test |
| PDF visual check | Both exported pages rendered and inspected; title block, labels and access page present |
| Portable export | `.sami` downloaded; automated model round-trip retains style, groups, photos, logo and source metadata |
| Private cloud | Create/read/save verified; browser save reached version 2; stale save rejected; disposable API-test project deleted |

The automated suite covers geometry axes and rotation, whole-panel dimensions and overlaps, grouping/transforms, legacy migration, portable data, invalid geometry and query bounds, source-failure retention, OSM missing-node handling, reversible local proposals, deterministic local CAD formats, aborting a stalled request, cache coalescing, cloud revision tokens, and recovered Trakway corner seams.

### Cloud revision repair found during live testing

A larger saved project exposed an additional issue: compressed Blob reads return a weak ETag (`W/` prefix), while writes return the equivalent strong token. Comparing those strings directly caused false conflict errors. Elite normalises that representation while preserving conditional writes and real stale-version rejection.

The deployed regression check returned: create 200/version 1 → read 200/same token → save 200/version 2 → stale save 409 → equivalent compressed-token save 200/version 3 → cleanup 200. This was found and fixed in Elite; it is not attributed to a historical build without evidence.

## Live external-data checks

These are single observed responses, not performance guarantees or a complete UK coverage assessment. Provider checks were performed on the deployed backend; the final deployment preserves those provider paths and adds the cloud/PDF/mobile corrections.

| Request | HTTP / state | Result | Time |
|---|---|---|---|
| CAD context | 200 / ready | 367 mapped features | 7.291 s |
| Public services | 200 / ready | 1 mapped feature in test area | 6.787 s |
| OHL | 200 / empty | No returned records; explicitly not confirmation of absence | 6.320 s |
| Constraints | 200 / partial | 44 records, 5 of 6 sources responded | 4.468 s |
| Postcode search | 200 | One result for WV1 1LD | 3.375 s |
| Truck route | 200 | 1.651 km route | 2.993 s |

Initial map context still needs a network request. Local CAD display and document export use saved vector geometry and do not wait for an AI-generated image. The measured sub-second PDF export does **not** mean a first uncached map/constraint search completes in that time. Requests have finite deadlines and explicit partial/error states.

Planning Data returned 503 during these checks. Independent Historic England and Natural England responses remained usable. Public records remain incomplete; the app does not establish utility clearance or certify route suitability.

## Outstanding release gates

| Gate | Exact state / next action |
|---|---|
| Permanent domain | Strict DNS check shows no domain delegation; public DNS returns NXDOMAIN and Vercel lists sami.site as available. Confirm the exact purchased domain/account before changing DNS or buying anything. Connected Vercel configuration is prepared. |
| what3words | Server key is missing. Both conversion directions remain unverified. Do not describe the app as an official partnership. |
| Connected Ask SAMI | Actual request failed after approximately 11.2 s: upstream gateway 403; app returned a clear 503 authorisation message. Configure the team's AI Gateway authorisation or a valid server-side gateway key, then verify a real proposal. Local drawing commands work independently. |
| Browser import | The test environment's file-chooser transfer stalled. End-to-end browser file import is **not recorded as passed**; model/parser checks are a narrower result. Re-run file import on a normal browser/device. |
| Automated browser suite | Nine configured desktop/tablet/phone cases are included but not executed here: local Chromium cannot launch under this environment's OS socket restrictions. |
| GitHub / CI | Connected integration rejected write access with HTTP 403. No new branch, commit or PR was created; packaged CI is not a passed CI run. |
| iOS | Xcode project generated and assets synchronised. No Xcode compile, Apple signing, IPA export, physical-device test or App Store Connect upload was completed. |
| Public release | Complete owner support/privacy details, provider capacity review and a real cross-device pilot before wider release. |

## Reproduce

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run ios:sync
```

The server checks are in `scripts/check-live.py` and `scripts/check-cloud.py`. Inspect their argument usage before running; use a disposable project for cloud checks. Do not commit preview protection tokens or private cloud edit links. Use the Mac steps in `APPLE-RELEASE.md` for native compilation and signing.

Historical inventory and source-comparison metadata are included as `REVIEWED-BUILDS.json` and `BUILD-COMPARISON.json`. Those are an audit index; the 28 old archives are not duplicated in the new source package.

## Resumed access check — 16 November, approximately 19:10 UTC

Vercel connector access succeeded; the user's app-specific permission already allows actions. Deployment health returned HTTP 200. AI Gateway usage showed two rejected 403 requests with zero recorded gateway cost in the preceding 24 hours. Neither older in-scope SAMI project had environment variables containing a recoverable what3words key.

The user selected Google in the secure Vercel dashboard sign-in prompt. Automatic approval review then denied access to the Google authentication origin pending explicit user authorisation. No Google page content was inspected and no workaround was attempted. Dashboard sign-in is paused; this is separate from the functioning Vercel connector.

The domain diagnosis was corrected after a strict query; see `DEPLOYMENT-HANDOVER.md`. The user indicated they were providing a what3words key, but no actual key value was present in the received message. No key has been configured.
