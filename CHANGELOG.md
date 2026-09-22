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
