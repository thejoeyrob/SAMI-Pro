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
