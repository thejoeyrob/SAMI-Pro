# SAMI Elite — build assessment and recovery record

Prepared for Joseph Whelan · 16 November 2026 · Release candidate 3.0.0

## The strongest recovered SAMI

**The clean archived SAMI Pro 2.9.0 Studio build is the strongest recovered historical foundation.** This is a source-based assessment, not a claim that every external provider still works in that archive. Its site-planning scope, CAD context capture, planning module and Trakway work are the most complete combination recovered without the duplicated capture functions found in the current SAMI-Pro repository.

The exact archive is `SAMI-Pro-2.9.0-STUDIO-FLAT-PWA.zip`, SHA-256 `32e7e356d2ca635cdd4620afdfb2a823a99b883a67673adf0e3d7daa7cb5caf2`.

The latest version number alone is not a reliable release indicator:

- `Ask-SAMI` main, commit `f999c17f779f1a12825064f55166c4c2e2986ace`, has the 2.8.3 engine at its deployment root. A later ZIP elsewhere in the repository does not make the deployed app 2.9.
- `SAMI-Pro` main, commit `95f75cf47181fdad69f335db387adbafd2000af6`, contains later work but also duplicated CAD capture definitions and additional layered fixes. It is not a clean superset of the archived 2.9 build.
- **SAMI v2.6 was excluded.** It was not used as a code source or judged as part of SAMI's development.

Twenty-eight representative archived packages were recovered and compared, alongside the two repository snapshots. The evidence includes source, README/changelog material and existing test reports. No complete historical production telemetry stream was available; old test reports using mocked data cannot establish live provider availability today.

## The purpose worth preserving

SAMI's strongest idea is one continuous field workflow: locate a site and its actual delivery entrance, understand access and constraints, build an editable site layout, and issue a professional plan that someone else can reopen and amend.

Trakway is a distinctive specialist capability within that workflow. It should not dictate the entire drawing model or bury ordinary areas, welfare, plant and logistics tools. The unique product direction is the combination of site logistics, precise temporary access layouts, entrance-level location and an assistant that proposes actual editable work.

## How the builds progressed

| Build family | Valuable progress | What Elite carries forward |
|---|---|---|
| 0.3 / 0.4 | HGV/site-planning purpose and direct object interaction | Route-to-site alongside an editable site drawing |
| 0.5 | Public services and a two-page A3 document engine | Source-aware overlays and site/access documents |
| 0.6 | Drawing-first workflow, grouping, hidden guide geometry | Explicit group/ungroup, atomic transforms and undo |
| 0.8 map-first / Studio | Measured stencils, whole-panel pads, accurate product profiles, restrained panel outlines | Independent asset catalogue and recovered Trakway geometry |
| 0.9.1 / 0.9.5 | Structured workspace, private-source direction, hashed assets and presentation | Clear data boundaries, hashed production assets and separated backend |
| 2.3 / 2.4.1 | Established general engine and OHL repair work | Reference for legacy project migration and source semantics |
| 2.7.0–2.7.11 | PDF refinement; repeated measurement, touch, cursor and selection repair | One coordinate/geometry model, touch tool states and direct selection controls |
| 2.7.13–2.7.18 | Field CAD, services UI, W3W direction and cleaner workspace | Compact data status, entrance metadata and cross-device workflow |
| 2.7.15 CarPlay companion | Native handoff exploration | Retained as historical evidence, not represented as a shipped CarPlay app |
| 2.8.0 / 2.8.2 / 2.8.3 | Navigation renovation and clutter reduction | Distinct Design, Services, Route and Ask SAMI sections |
| Clean 2.9.0 Studio | Strongest combined CAD/plan/Trakway baseline recovered | Reference baseline for the new build, not a template copied wholesale |

Several packages share the same engine bytes despite different labels. For example, the recovered 2.7.1 and 2.7.2 engines match; 2.7.14 and the 2.7.15 web package also match. This does not prove the entire package is identical, but it prevents treating every release name as a substantive engine improvement.

## Regressions and failure mechanisms

| Finding | Evidence and consequence | Elite response |
|---|---|---|
| Duplicate CAD capture functions | Current SAMI-Pro defines `capturePlanBase` and `planBaseNeedsCapture` twice. Later definitions override earlier capture-key logic. | One local CAD renderer and one explicit context-loading path. |
| Long sequential waits | Old Overpass flow permits three approximately 38-second attempts; planning paging can permit three 25-second requests. | Shared bounded deadlines, abortable bodies, caches and in-flight request coalescing. |
| Timeout without cancellation | A `Promise.race` stops waiting but does not necessarily stop the original request or its late side effects. | AbortController/AbortSignal plus project-identity guards on results. |
| Missing backend connections | AI, voice and routing endpoint configuration is empty in recovered static configurations; private service sources are empty. A queue file exists without being loaded in some builds. | Actual same-origin API routes for mapping, search, routing, cloud and structured Ask SAMI. Missing configuration is visible. |
| Mixed cached releases | Long immutable caching on unhashed script/style filenames can combine old code with a new page. | Hashed assets; HTML/service worker revalidate. No indefinite caching of API responses. |
| Reintroduced touch/accessibility problems | Some later roots disable zoom again; multiple layout/style layers create competing controls. | New responsive workspace, user zoom retained, compact tool states and bottom drawers. |
| Unclear “no result” semantics | Empty/error states can look like working indefinitely or a clear site. | Loading, ready, empty, partial and error are distinct. Empty public data is not proof of absence. |
| Naming ahead of implementation | CarPlay-ready, AI-ready and native descriptions do not themselves establish working entitlements or backend services. | Release guide separates delivered code, verified behaviour and unfinished external setup. |

The diagnosis is broader than one broken background connection: there are provider failures, incomplete configuration, client-side control-flow regressions and deployment/cache problems. Styling alone would not repair these.

## What is rebuilt in Elite

- Fresh React/TypeScript workspace with three appearance choices: Studio, Graphite and Blueprint; CAD, street and satellite map views.
- Forty-two original technical asset symbols across welfare, logistics, vehicles, plant, access, safety, utilities, events and landscape. Measured footprints, editable fill/outline/opacity, dimensions and rotation.
- Site boundaries, stone areas and roads, compounds, fences, exclusion areas, text, notes/photos, dimensions and delivery entrances.
- Recovered Lion/Hybrid/TuffTrak bend logic and whole-panel pads; atomic grouping, ungrouping, duplication, movement, rotation and undo. Sabre-X uses its full 4 × 2 m physical footprint with the configured 200 mm overlap stride. Confirm actual product/joint specifications for a job.
- CAD/SVG/PDF generated from saved vector geometry locally. Initial source retrieval is independent and bounded; saved context travels with the project.
- Small-site OpenStreetMap extracts with Overpass alternatives; independent Historic England and Natural England queries alongside Planning Data. Source failure does not block local design or exporting.
- Truck-profile routing, entrance coordinates and what3words fields; what3words conversion needs a valid server key.
- Ask SAMI local commands plus connected structured proposals. An action is reviewed and applied deliberately, and remains undoable.
- Portable `.sami` projects, local autosave and optional private cloud edit links with conditional writes to detect conflicting saves.
- A3 landscape vector PDF, route/access page, SVG, DXF, KML, GeoJSON and CSV exports; company metadata and a raster logo.
- A generated iPhone/iPad Xcode project bundling the offline editor, with native camera, location and file sharing adapters.

## Honest compatibility boundaries

`.sami` is the complete editable interchange format. Phone, tablet and desktop use the same model. Cloud save/load is explicit; this is not simultaneous multi-user editing or organisation-level account management.

Imports include supported SAMI project JSON, GeoJSON, KML/KMZ, GPX, simple DXF entities and raster reference images. DXF uses local metres with a documented WGS84 origin, **not automatic OSGB36/BNG conversion**. DWG requires conversion. IFC/BIM, binary Visio, CAD blocks/dimensions/hatches and full CAD round-trip fidelity are not implemented. Legacy metadata is retained where possible; every historical custom stencil is not guaranteed an identical rendered appearance.

Public utility records are incomplete. Owner-supplied underground utility plans, permissioned commercial data, authoritative clearance checks and a comprehensive UK statutory search are not supplied by the public map APIs. Mapped OHL metadata is shown when present; absent voltage or height is not fabricated.

The route brief includes saved route geometry and access details. It is not a fully annotated commercial road-atlas sheet or licensed turn-by-turn HGV navigation system. External navigation handoff may not retain the truck profile.

No CarPlay entitlement, iCloud/CloudKit service, live multi-user editor, AR survey or LiDAR accuracy claim is included. These are separate product decisions, not benefits automatically obtained by holding an Apple Developer membership.

## Verification record

The exact live timings and release gates are in `VERIFICATION.md`. Automated core tests passed, the production bundle built, and Capacitor synchronisation succeeded. Live deployed mapping, services, constraints, postcode search and routing produced bounded responses. The public local-planning source returned 503 during verification; independent heritage/ecology sources still returned results and the UI receives a partial status.

The included Playwright suite covers desktop/tablet/phone workflows, but this environment's local Chromium process cannot launch because of its OS socket restrictions. Browser flows are also checked manually against the deployed preview. GitHub's integration rejected write access with HTTP 403, preventing the proposed branch/CI run. Therefore the packaged CI workflow is **not evidence that CI or Xcode compilation passed**.

## Product judgement

The clean 2.9 archive is the best recovered historical app. Elite is the new architectural direction and reviewable release candidate: it consolidates the useful work and replaces the failure-prone data and UI paths. It should not be marketed as the best site-planning software in existence, Apple-approved or a confirmed what3words partnership on the basis of this build alone.

A credible what3words demonstration should show a precise site entrance linked to an editable operational plan: find the entrance, draw the access layout, add welfare and plant, review sourced constraints, ask SAMI for a proposed change, and issue/reopen the plan on another device. That is a stronger demonstration than an unsupported partnership label.
