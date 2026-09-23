# SAMI v2.7.19 — Restore consistent build after interrupted session

## What happened

A prior chat session's credits ran out mid-work, before the completed v2.7.18 fixes (asset icon sizing, services-refresh, precision-cursor tap conflict, undo/redo relocation) were pushed to `engine.js`, `workspace.js`, and `cinema.js`. In the gap, a separate session produced its own "recovery" package with different, divergent implementations of the same fixes, which was then manually uploaded to GitHub via **Add file → Upload files**. That upload replaced `engine.js`, `workspace.js`, `cinema.js`, `app.css`, `index.html`, `CHANGELOG.md`, `sw.js` and `ASSET_MANIFEST.json` with an unverified, mixed set of files — mixing two independent sessions' edits is exactly how "no drawing" and a regressed measure-cursor bug happen.

## Fixed in v2.7.19

- **Restored the complete, internally consistent v2.7.15–18 fix set** across all core files in one push, replacing the mixed/divergent uploaded build. This includes the asset icon true-footprint sizing, the services-refresh-on-checkbox-toggle removal, the precision-cursor tap-conflict fix, and everything else documented under v2.7.18 below.
- **Undo/Redo relocated again** — this time into the **canvas toolbar** (top-right, next to map style and zoom), not the top bar. While tracing this the stylesheet turned out to already have a rule anticipating exactly this placement (`.canvas-toolbar .history-controls { position: static !important; }`, dated to the v2.7.13 pass) — canvas-toolbar was evidently the original, correct home for these buttons before they got displaced into the floating position that prompted the original complaint. `.history-controls button` also already shares the 48px map-control touch sizing, so no new CSS override was needed, only removing the now-unneeded top-bar-specific rules.
- Version bumped to 2.7.19 specifically so the service worker forces a clean cache update rather than serving anything cached from the interim uploaded build.

## Still open

Everything listed under v2.7.18's "Still open" section, unchanged: icon artwork recolouring, the Trakway 60–120° corner-snap gap, the CAD export redesign, the route-to-site 3-map layout, CAD export detail-level toggle, non-scrolling menus, asset library refresh, top-bar activity indicator. None of these were touched by the interim uploaded build either, per its own RECOVERY_README.md.

---

# SAMI v2.7.18 — Asset rendering, services refresh, precision cursor, top bar

## Fixed in v2.7.18

- **Asset icons now render at true footprint size and rotation** instead of a fixed 27–34px square regardless of zoom. Root cause: every placed asset drew two disconnected layers — a styled polygon (the "box") and a separate fixed-size icon marker with hardcoded colours, never linked. This explained all of: opacity only affecting the box, colour changes only affecting the box, and detailed assets looking barely visible/elongated. The icon is now sized from the asset's real length × width at current zoom and rotates to match placement angle; its opacity now follows the fill-opacity control. Colour recolouring of the icon artwork itself is still open — most icons are multi-part with intentional shading, so a safe fix needs per-icon care rather than a blanket colour swap.
- **Asset default outline weight** changed from 2px to 0.5px.
- **Services & constraints no longer auto-refreshes on every checkbox toggle.** Previously each checked box independently scheduled its own debounced network refresh, so checking several sources in quick succession fired several overlapping refresh cycles — this was very likely both the "constantly refreshing" symptom and, separately, the cause of the OHL "+ Add support" popup silently failing (support-point coordinates could shift between when the popup was built and when the button was tapped, invalidating the lookup). Checkboxes now only toggle visibility; refreshing happens solely via the renamed **"Show / Refresh"** button, moved to the top of the panel instead of the bottom.
- **Undo/Redo moved from a floating bottom-right position into the top bar**, next to Export/Menu — HTML and CSS verified (balanced tags, no orphaned references, confirmed nothing else depended on the old fixed position).
- **Precision-cursor (measure map) tap conflict removed.** There were two competing systems repositioning the crosshair on tap — a custom pointer-event interceptor and Leaflet's own native click handling — running concurrently with Leaflet's native map panning (which must stay enabled, since "pan the map under the fixed cursor" is a required workflow). The custom interceptor's `stopImmediatePropagation()` could leave Leaflet's own drag/tap gesture recognition mid-state, matching the reported "drag works once, then tapping stops working." Removed the custom interceptor; Leaflet's native click (already correctly wired to reposition the cursor) is now the only path. **Needs real-device confirmation** — this environment has no way to test live touch gestures.
- **"Continue in browser" added** as a quiet, text-only link under Why SAMI? on the install gate, for anyone who wants to use SAMI without installing. The choice persists (`localStorage`) so it isn't asked again on the next visit.

## Investigated, found not to be a bug

- **CAD conversion "not functioning correctly"** — traced the full capture pipeline (Overpass query → feature parsing → road-width buffering) and found no defect; the user confirmed this was very likely a symptom of the services auto-refresh issue above (CAD population appeared to hang because it was queued behind overlapping refresh cycles), not a separate bug.
- **"SAMI AI" not working** — by design, not a bug. `window.SAMI_CONFIG.aiEndpoint` is blank in this build (same as `voiceEndpoint`, `hgvRouteEndpoint`); structured local commands (create a run, add an access point, export, etc.) all work without it, but free-text Q&A needs a real backend deployed and its URL set in `config.js`. `SAMI_AI_BACKEND_SPEC.md` in this repo documents what that backend needs to accept; it was written but no server was ever stood up against it.

## Still open

- Icon artwork recolouring (see above)
- Trakway 60–120° corner-snap gap (explicitly flagged as high-risk, needs isolated treatment)
- CAD export redesign: logo flattening, user-logo background removal, 2-column key with shapes/signs/numbered markers, condensed detail boxes, inline OHL line labels, auto-varied line colours/dash
- Route-to-site 3-map layout (labelled overview → last-main-road-to-site → final turns), condensed to one page
- CAD export detail-level toggle (simple/high)
- Non-scrolling menus
- Asset library refresh for quality/reliability
- Top-bar background-activity indicator

---

# SAMI v2.7.17 — Touch-target pass 1

## Fixed in v2.7.17

- `.selection-bar button` grown from 32px to the 44px touch floor. Verified safe: the container is absolutely positioned with an auto height and a flexible, ellipsis-truncating label in the middle — the bar simply grows a little taller and the label truncates further under pressure; nothing else depends on its old height.

## Checked and deliberately left alone this round

- `.top-actions button` — attempted the same 39→44px bump, then reverted it. `.top-actions` sits inside `.topbar`, which has a **fixed height** (58px including padding on mobile, per its own `@media (max-width: 600px)` rule) with no per-breakpoint override for this button size. Growing the buttons there would very likely overflow that fixed bar on mobile. Fixing this properly means also adjusting the mobile topbar height, which is a coordinated two-part change I'm not making without being able to see the rendered result.
- `.history-controls button`, `.canvas-quick-tools button`, `#inspectorTabs button`, `.object-row > .icon-btn` — each has multiple breakpoint-specific rule blocks (3–8 occurrences across the stylesheet) that would each need the same container/sibling check `.selection-bar` and `.top-actions` got before touching. Not done yet — queued for the next pass, one group at a time, same method.

## Why this is going slower than a blanket resize

A global find-and-replace across the 93 declarations flagged in v2.7.16 would be fast but is exactly the kind of change the brief explicitly forbids ("do not introduce regressions"). Two of five groups checked this round; one was safe to fix, one had a real fixed-height conflict that a blind resize would have shipped as a visual bug. Continuing at this pace rather than guessing.

---

# SAMI v2.7.16 — Northern Ireland constraints, Studio Prestige mode, licensing

## Added in v2.7.16

- **Live Northern Ireland ASSI constraints** (NIEA/DAERA) — confirmed against NIEA's own officially-attributed ArcGIS FeatureServer (`NI_ASSIs`, contact `NIEA.GIS@daera-ni.gov.uk`), using the standard Esri REST query pattern. This is on firmer ground than the Scotland/Wales WFS connectors added in v2.7.15, which were built from service documentation rather than a confirmed live endpoint. New "Northern Ireland ASSI sites" button in Services & constraints. All four UK nations now have a live public constraint connector.
- **Prestige mode toggle added to the desktop Studio settings panel** (previously Workspace-only), same on/off semantics and same shine-sweep effect.
- **LICENSE file added at repo root** — proprietary notice covering the first-party source, assets, and trademarks, distinct from the existing third-party OSS license files (Leaflet, polygon-clipping, QR code) which are unaffected.

## Audited, not yet changed

- Static analysis of `app.css` (multi-line-aware, not just a single-line grep) found 93 button/control declarations across dense toolbars — `.selection-bar button` (29–32px), `.canvas-quick-tools button` (36px), `.top-actions button` (39px), `.history-controls button` (34–37px), `#inspectorTabs button` (35–42px) — under the 44px touch-target floor. There is no `pointer: coarse` / `hover: none` split anywhere in the stylesheet, so these apply identically to touch and mouse. The earlier audit's "44px — Fixed" claim (A01) evidently didn't reach every dense toolbar row. Not patched in this pass: these are tightly packed horizontal toolbars, and resizing 93 declarations without the ability to see the rendered layout risks overflow/wrapping regressions. Needs a visually-verified pass, ideally on a real device, before touching.

## Still open from v2.7.15

- Scotland/Wales WFS connectors remain unverified against a live round-trip (no outbound network access in this build environment).
- Code minification/obfuscation for the release build, and moving any future live secrets server-side, not yet done.

---

# SAMI v2.7.15 — Services, self-service what3words & Prestige mode

## Added in v2.7.15

- **what3words is now self-service.** Settings shows a plain status line — "Currently using the built-in demo what3words key" or "Using your own what3words account" — plus a direct link to get a personal API key. The field itself no longer pre-fills the demo key into a visible/copyable password box; it stays blank until the user adds their own. The demo key in `config.js` remains the default fallback everywhere (route pins, access points, PDF export), so nothing breaks for anyone who doesn't set their own key. Identical behaviour in both the field Workspace and desktop Studio settings panels (traced both render paths — Studio reuses the Workspace/engine field, not a separate copy).
- **Live Scotland protected-site constraints** (NatureScot: SSSI, SAC, SPA, NNR, Ramsar, World Heritage Site) via a new WFS connector against `ogc.nature.scot/geoserver/protectedareas`, mapped into the existing SSSI/ecology/heritage constraint types. New "Scotland protected sites" button in Services & constraints.
- **Live Wales protected-site constraints** (Natural Resources Wales SSSI) via a new WFS connector against `datamap.gov.wales/geoserver`. New "Wales protected sites (NRW)" button.
- **Prestige mode**, a named, toggleable presentation mode. On (default): a subtle travelling shine sweep on primary action buttons on hover, plus a slight press-scale, matching the existing brand-logo pulse treatment. Off = **Simple mode**: flat, instant, no shine — for glare, older devices, or battery life. Fully additive CSS gated the same way the app already gates its cinematic-motion setting, so it stacks correctly with (and never overrides) the OS-level `prefers-reduced-motion` setting.

## Known gap carried forward

- Northern Ireland (DAERA) equivalent constraint connector is not yet built — not enough was confirmed about its live API in this pass to ship it responsibly; it remains "data-pack" (import-only) for now.
- The Scotland/Wales WFS connectors above were built from published service documentation, not confirmed against a live request-response round trip (this environment has no outbound network access to test that here). They follow the same graceful-failure pattern as the existing England connector — if a layer name or endpoint shape has changed upstream, the request fails with a visible toast rather than silently showing zero results, consistent with the app's existing "absence is not proof of absence" principle. Treat as first-priority for real-network verification before relying on them operationally.
- Prestige mode's settings toggle is currently only exposed in the field Workspace settings panel, not the desktop Studio panel.

---

# SAMI v2.7.14 — Field Touch, Services & UI

## Fixed in v2.7.14

- Installed desktop PWAs now recognise `standalone`, `minimal-ui` and window-controls-overlay display states, so a correctly installed app is not left behind the browser/install gate.
- Precision measurement now uses one pointer-event path for touch, pen and mouse. The cursor is placed at the exact release coordinate, and the old competing touch handlers were removed.
- Added a permanent **＋ Point** action, **◎ Me** current-position action and explicit on-screen guidance for both workflows: drag/tap the cursor, or move the map beneath the fixed cursor.
- Cleared stale map-click suppression and drag/pan flags when starting placement or route tools so deliberate map taps are not discarded after changing tools.
- Route destination pins now reverse-geocode automatically and populate what3words automatically when the user has configured a what3words key; coordinates remain usable when either network service is unavailable.
- Reconnected checked service layers to the existing refresh path and broadened public reference discovery for gas, water, wastewater/sewerage and mapped drains/ditches without treating missing public data as proof of absence.
- OHL support popups now show **+ Add support / Update support** and **Edit** side-by-side immediately, while retaining the compact information-first popup.
- Tightened the promo text lead from **PLAN ACCESS** onwards so the visual sequence starts earlier relative to the recorded voice.
- Corrected light-theme top-bar, selection/status bubble, inspector and precision-panel colours so Arctic Light, Paper and Studio Light no longer retain inappropriate dark chrome/readability combinations.
- Removed nested-sidebar indentation/stagger and made inspector tabs join cleanly to their section body.

## Improved in v2.7.14

- The precision panel remains compact and avoids a blocking modal: **＋ Point**, **◎ Me**, Undo, Done, More and Close stay directly available.
- A map tap can reposition the measurement crosshair without committing a point; committing is an explicit **＋ Point** action.
- Installed-app detection is consistent across early bootstrap, cinematic launch, core engine and workspace shortcut handling.
- Utility and OHL refreshes retain the existing last-known-good/local-workflow behaviour on provider failure.
- The PWA manifest no longer prefers window-controls-overlay; `standalone` is the primary install mode for more predictable Windows/macOS behaviour.

## Verification note

All JavaScript syntax checks, CSS parsing, manifest/version checks and targeted v2.7.14 source assertions pass. This execution environment blocks Chromium navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so the new v2.7.14 touch/install paths still require the real-device checks in `MANUAL_TEST_CHECKLIST.md`. The comprehensive v2.7.13 browser suite remains the regression baseline, not a claimed v2.7.14 browser pass.

---

# SAMI v2.7.13 - Field CAD & Services

## Fixed

- Preserved v2.7.6/v2.7.12 project IDs, creation dates, saved dates and checkpoint history instead of creating duplicate projects after recovery.
- Prevented **New project** from replacing the current project when its final IndexedDB save fails. Save state now reports Saving, Saved or Failed truthfully.
- Made recovery-journal quota failure visible with a persistent one-tap **Export backup** warning while continuing the IndexedDB save.
- Kept the v2.7.12 exact finger-release cursor fix and removed the global button transition that made the measurement cursor lag behind a finger.
- Corrected 1 m/5 m precision nudges at normal and rotated bearings; Leaflet display-pixel rounding no longer changes the requested metre step.
- Restored drag-and-drop/touch-drag binding for placeable assets and kept normal drawing, Trakway run, undo and redo paths intact.
- Stopped the address/postcode, Ask SAMI and project-name fields from opening the keyboard when the workspace first appears.
- Fixed themed menu readability, light-theme contrast, responsive cursor/panel overlap and export-dialog scrolling.
- Repaired the remaining hard-coded favicon version so all runtime asset queries now use the single release version.
- Replaced an unsupported PDF measurement glyph with **TOTAL**, added provider attribution, and boxed the optional OHL support schedule by line.
- Kept HTML fallbacks navigation-only so a failed JavaScript, CSS or audio request can never receive the app document.

## Improved

- Precision measurement now supports one-finger drag, map tap, cursor tap, keyboard control, exact 1 m/5 m nudges, coordinate/bearing/distance readout, snap feedback, clean undo/cancel and multi-touch suppression.
- The workspace uses more of the map: compact measurement controls, collapsible inspector, 48 px map targets, safe-area support and fewer blocking panels.
- Every menu and control follows the selected appearance. All 13 themes pass the tested text/UI contrast rules.
- OHL capture covers mapped `power=line`/`minor_line` and overhead/surface cables from 400 V through 400 kV, plus untagged mapped lines. Pole/tower/portal/terminal metadata and last-good snapshots are retained.
- Public mapped gas, water and drainage records are recognised, with honest source/coverage caveats. KML/KMZ utility survey imports are supported.
- Pole/pylon symbols are slightly larger, outline-only, colour-selectable and open a compact information view when selected.
- Visio Open XML imports support VSSX/VSDX/VSTX/VSDM/VSTM archives and VDX XML. Legacy binary VSS/VSD files receive conversion guidance rather than a misleading parser error.
- Browser launches play the silent SAMI intro before install guidance; installed repeat launches go straight to the workspace. Skip is always keyboard/screen-reader reachable and audio remains gesture-gated.
- Install guidance now distinguishes iOS Safari, iOS non-Safari, iPad desktop mode, Android, embedded browsers, desktop Firefox, Chromium and macOS Safari.
- The CAD export uses a white sheet, dark transparent SAMI wordmark, linked road polygons, essential road labels, 0.25 mm service strokes, title block, north/scale, source attribution and optional OHL schedule.
- Service/API failures retain local tools and the last usable snapshot instead of clearing working information.
- First-party source remains readable and maintainable; bundled third-party libraries remain vendor-minified.

## Added

- `VERSION.json`, `version.js` and dependency-free `build.mjs` as the version/precache source of truth.
- Critical-shell-first service worker with a 3 s navigation timeout, version-pinned assets, lazy media/range caching and user-approved **Save & reload** updates.
- Portable project backup/import status, storage-persistence request, generated asset classification and PWA screenshots.
- Maskable icon, `lang="en-GB"`, direction, categories, display override and working **New site**, **Last project** and **Route** shortcuts.
- Screen wake lock during active precision measurement where supported.
- SAMI AI endpoint contract and UK construction-focused policy context; model/provider credentials remain server-side.

## Removed

No product feature, theme, storage key, database store, provider, MP3, recorded line or licence file was removed. The proposed bulk offline map download was deliberately not added because the current public OSM tile policy prohibits prefetch/offline use.
