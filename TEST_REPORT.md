# SAMI v2.7.14 — Test report

Historical v2.7.14 results below were tested 22 September 2026. They do not certify the current release.

## Current v2.8.8 workspace-profile supplement

Checked 7 October 2026:

| Area | Result | Evidence |
|---|---|---|
| Profile catalog | **PASS — static** | Five admin profiles combine a layout, theme and accent; the admin action remains behind the existing unlock gate. |
| Classic Pro layout | **PASS — static** | Wide desktop rules restore the left inspector and bottom command dock; tablet/portrait layout rules remain separate. |
| Live preview | **NOT RUN in browser** | Profiles apply immediately and are reversible through admin/manual settings, but rendered screenshots and physical device testing remain outstanding. |

## Current v2.8.7 Ask SAMI supplement

Checked 7 October 2026:

| Area | Result | Evidence |
|---|---|---|
| Local assistant guidance | **PASS — static** | Local help and project-summary paths are present; common stage/map/undo phrases are recognized. |
| Failure feedback | **PASS — syntax/static** | Async command failures are caught and shown in the conversation. |
| Endpoint state | **PASS — static** | The panel distinguishes local mode from a configured-but-unverified endpoint; saving connection settings refreshes the indicator. |
| OpenAI response | **NOT RUN** | No backend URL or provider credentials were supplied. OpenAI must be called from a secure server endpoint, not directly with a browser-held secret. |

## Current v2.8.6 reliability and data-source supplement

Checked 7 October 2026:

| Area | Result | Evidence |
|---|---|---|
| Release tests | **PASS** | `node --test geometry-tests.mjs release-tests.mjs`: 6 tests passed, 0 failed. |
| CAD site-area guard | **PASS — source/test** | CAD is disabled without an area; clearing an area exits Site Plan and clears its captured background. Legacy CAD state falls back to a valid map base. |
| OSM gas/water mapping | **AVAILABLE — reference only** | Existing bounded OSM snapshots include mapped gas/water utility tags; coverage is sparse and absence is not evidence of absence. |
| Official gas-data candidate | **NOT CONNECTED** | SpatialData.gov.scot lists SGN Scotland WFS layers, but its service metadata marks them **Restricted**. See [dataset metadata](https://data.spatialhub.scot/dataset/sgn_gas_network-sgn). |
| Official water-data candidate | **NOT CONNECTED** | Scottish Water stopcock points and supply-catchment polygons are catalogued, not distribution-main geometry; no clear reuse licence was returned in the catalogue search. See [stopcocks](https://www.data.gov.uk/dataset/scottish-waters-stopcocks) and [supply catchments](https://www.data.gov.uk/dataset/scottish-waters-water-supply-catchments). |
| what3words | **API-BASED** | Existing route/access lookup and user-key settings remain; a downloadable/licensable local grid database was not identified. |
| AI source repair | **NOT IMPLEMENTED** | `SAMI_AI_BACKEND_SPEC.md` now describes the authenticated, isolated diff/test/approval/deploy service needed; the static app cannot write repository files or run builds. |
| Browser/device interaction | **NOT RUN** | No browser automation or physical tablet acceptance was available in this environment. |

The 2.8.5 UI and 2.8.4 verification supplements and older v2.7.14/13 results below do not certify the current rendering.

## Current v2.8.4 verification supplement

Checked 7 October 2026:

| Area | Result | Evidence |
|---|---|---|
| JavaScript syntax | **PASS** | `node --check` completed for every root `.js` file. |
| Regression tests | **PASS** | `node --test geometry-tests.mjs release-tests.mjs`: 4 tests passed, 0 failed. |
| Release integrity | **PASS** | Generated runtime, HTML, config, manifest, service worker and asset manifest agree on v2.8.4; every generated shell file exists and audio remains outside the critical shell. |
| Browser zoom | **PASS — static** | Viewport sizing remains enabled without `maximum-scale` or `user-scalable=no`. |
| Grouping fix | **PASS — syntax only** | Mixed locked/unlocked grouping now selects a feature that was actually grouped. No browser interaction run was available here. |
| Browser/device acceptance | **NOT RUN** | No Chromium/Playwright installation was detectable in this environment. Use `MANUAL_TEST_CHECKLIST.md` for installed-app, touch, provider and assistive-technology acceptance. |

The historic v2.7.14 and v2.7.13 results below remain useful regression context, but have not been rerun against v2.8.4.

---

## v2.7.14 feedback-fix verification

The v2.7.14 delta was built from the completed v2.7.13 field/CAD/services release. The following checks were rerun against the final v2.7.14 source tree:

| Area | Result | Evidence |
|---|---|---|
| JavaScript syntax | **PASS** | All 23 shipped `.js` files pass `node --check`. |
| CSS parse | **PASS** | `app.css` parses with zero top-level `tinycss2` errors. |
| Version/manifest | **PASS** | `VERSION.json`, generated runtime version, service worker and manifest are stamped `2.7.14`; manifest primary display is `standalone` and no longer prefers window-controls-overlay. |
| Installed-app detection | **PASS — static** | Bootstrap, cinema, engine and workspace recognise standalone, minimal-ui, window-controls-overlay and `navigator.windowControlsOverlay.visible`. |
| Precision controls | **PASS — static/syntax** | Unified pointer drag path is present; exact pointer-up placement, map-tap repositioning, **＋ Point**, **◎ Me**, current-position geolocation, nudge/keyboard actions and map-under-crosshair guidance are present. |
| Placement stale-state fix | **PASS — static/syntax** | Tool start and route-pick paths clear stale click/drag/pan suppression before accepting a deliberate map point. |
| Route W3W | **PASS — static/syntax** | Dropped route point calls reverse-geocode and what3words conversion when a key is configured; route state stores coordinate/address/W3W independently. |
| Services | **PASS — static/syntax** | Checked layers trigger the existing mapping refresh; public reference query includes gas/water/wastewater plus drain/ditch tags and retains failure fallbacks. |
| OHL popup | **PASS — static/syntax** | Compact OHL card contains immediate Add/Update support and Edit actions. Existing v2.7.13 OHL fixture coverage remains unchanged. |
| Promo timing | **PASS — static** | From the PLAN ACCESS cue onwards the visual text lead changes from 0.9 s to 1.5 s, including the closing SAMI morph sequence. |
| Light UI/sidebar/tabs | **PASS — CSS parse/static** | Light-mode topbar/bubbles/inspector/precision controls use appearance tokens; nested compact sections lose stagger indentation; inspector tabs have zero gap/radius and connect to panel body. |

### Browser-run limitation for this delta

A new Playwright v2.7.14 integration script was prepared for installed-PWA detection, touch cursor drag, asset placement, route W3W, services/OHL and light-theme rendering. Chromium launches in this environment, but every navigation is blocked by the host policy with `net::ERR_BLOCKED_BY_ADMINISTRATOR`, including a fully intercepted synthetic HTTPS origin. Therefore **no fresh v2.7.14 browser/device pass is claimed**. The v2.7.13 results below are retained as the immediately preceding regression baseline and the v2.7.14-specific behaviours are marked for first-priority real-device acceptance.

## v2.7.13 regression baseline

## Release provenance

- Original supplied v2.7.6 ZIP SHA-256: **PASS** — `fa728976f99addfad9d30d3159cda76714bf2b8ec3adda047b63fcb342ed2a35`.
- Latest GitHub baseline reviewed: **PASS** — v2.7.12, commit `aa59b001941f3d761c490298e6ae54bf0d965e03`.
- Preservation rule: the v2.7.12 tree was the functional baseline; earlier work was retained only where it was compatible and tested.

## Automated results

| Area | Result | Evidence |
|---|---|---|
| Static integrity | **PASS** | v2.7.13 baseline: 24 JavaScript files passed `node --check`; manifest/references and recorded voice wording were validated. |
| Feature inventory | **PASS** | Baseline v2.7.12: 191 literal controls, 113 literal actions, 24 literal storage keys. v2.7.13: 194 controls, 117 actions, 26 keys. No baseline literal control, action or key is missing. |
| v2.7.6 storage compatibility | **PASS** | A v2.7.6-shaped project preserved ID `v276-preserved-project`, data and edits after reload. No destructive database cleanup was detected. |
| Save failure handling | **PASS** | localStorage recovery quota failure still saved to IndexedDB and showed a backup warning. Simulated IndexedDB failure showed `Save failed`, retained the active project and allowed retry. |
| Drawing smoke | **PASS** | Site area, Trakway run, Undo/Redo, drag/drop asset, 13 themes, backup/import, GeoJSON and PDF executed without captured page errors. |
| Precision cursor | **PASS** | Drag offset measured 84 × -48 px. On-screen and rotated-map nudge tests both produced an exact 5.0 m total. Initial focus remained on `BODY`. |
| Services/OHL | **PASS (mocked source)** | KML service import passed. Overpass fixture returned 400 V, 11 kV, 400 kV and untagged OHL, seven supports, plus gas, water and drainage types. |
| Visio import | **PASS** | Modern Visio XML fixture imported one shape/two parts. Legacy binary `.vsd`/`.vss` produced conversion guidance rather than a silent failure. |
| Service worker lifecycle | **PASS** | First install cached the shell but not audio; offline reload/edit worked; versioned JS stayed JavaScript; missing JS returned blank 503; MP3 range returned 206 online/offline; waiting worker activated only after consent; project survived simulated 2.7.13→2.7.14 update. |
| Weak-network fallback | **PASS** | A stalled navigation returned the cached shell after 3003 ms. |
| UI/accessibility subset | **PASS** | Automated subset reported zero violations in each of 13 themes. 390×844, 844×390, 1024×768 and 1366×1024 layouts had no document overflow, cursor clipping or cursor/panel overlap. Escape closed the tested modal. |
| Theme contrast tokens | **PASS** | Worst measured normal-text ratios ranged from 5.46:1 to 6.23:1; UI-boundary ratios ranged from 3.39:1 to 4.42:1. |
| Install guidance | **PASS (emulated)** | iOS Safari/Chrome, iPad desktop mode, Android Chrome/Firefox, Samsung Internet, embedded browser, desktop Chrome/Firefox and macOS Safari all showed a gate with platform-specific instructions and a reachable `Skip to install`. |
| PWA shortcuts | **PASS** | New site, open last project and route-to-site opened the intended workspace/mode, removed the query string and left `BODY` focused. |
| PDF inspection | **PASS** | Generated A3 PDF: two pages, 95,920 bytes. Rendered pages and extracted text were inspected: white paper, dark transparent SAMI wordmark, title block, main-road/provider attribution, thin service lines and boxed optional OHL schedule were present; no unsupported-glyph marker remained. |

## Performance

The warm/offline result is good; the simulated cold result remains above the requested target.

- 4× CPU slowdown, approximately 1.6 Mbps and 150 ms latency, uncompressed local host: **9962.3 ms** to the measured repeat-launch ready point.
- Warm offline repeat launch: **418.7 ms**.
- Requested cold target: about 2500 ms — **not met in this artificial uncompressed serial-resource test**.

Host Brotli/gzip will materially reduce transfers, but real-device measurement is still required. Large runtime-coupled modules were not split in this release because doing so late would create disproportionate regression risk.

## Not run or not claimed

- No physical iPhone, iPad, Android, Windows or macOS device was available. Browser emulation is not a substitute for touch hardware, VoiceOver/TalkBack, outdoor glare, OS process eviction or install UI.
- Live external provider calls were not used in the functional run. OHL, utility, geocoder and routing behaviours were tested with controlled fixtures/mocks; production coverage and provider availability remain location-dependent.
- No statutory gas, water or sewer dataset was supplied. Public OpenStreetMap-derived utility mapping is reference information and must never be treated as proof that a service is absent.
- Real GPS, microphone, wake-lock denial, pen hardware, Web Share and native file-picker behaviour were not exercised.
- No complete WCAG conformance audit, penetration test, high-volume load test or independent drawing-scale certification was performed.
- The first-install/no-cache/no-network case cannot load a web app and should show the browser’s normal unavailable state.

Use `MANUAL_TEST_CHECKLIST.md` before production rollout.

## Previous v2.7.13 package validation

- `SAMI_v2_7_13_FIELD_CAD_SERVICES_ROOT_FLAT_PWA.zip`: **PASS** — 90 entries, every entry at archive root, and `unzip -t` reported no errors.

## v2.7.14 package validation

- `SAMI_v2_7_14_FIELD_TOUCH_SERVICES_UI_ROOT_FLAT_PWA.zip`: **PASS** — produced from exactly **90** tracked release files, with every entry at archive root and no containing directory.
- `unzip -t`: **PASS** — no compressed-data errors.
- Archive-path check: **PASS** — zero entries contain `/`.
- The companion SHA-256 is generated only after the definitive ZIP is written and names this exact archive.
