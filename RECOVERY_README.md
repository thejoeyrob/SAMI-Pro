# SAMI v2.7.18 — completed recovery

This package completes the interrupted GitHub update at commit 9f5673e.
It includes the recovered cursor, asset rendering, services and browser-entry
changes, Undo/Redo moved away from Menu, and the darker welcome page.

## Publish to the existing GitHub Pages site

1. Extract this ZIP. All application files are at its root.
2. Open thejoeyrob/SAMI-Pro in GitHub, on the main branch.
3. Choose Add file → Upload files, then upload the extracted files together.
4. Commit the replacement files and wait for the Pages deployment to finish.
5. Reopen SAMI online. If Update available appears, use Save & reload.

Do not clear browser storage: your saved projects are kept on the device.
The package contains no sample user projects or new private credentials.

## Publication status

Direct publication from this session was attempted as one atomic GitHub commit,
but the Git Trees API returned HTTP 403, Resource not accessible by integration.
The connection's displayed push permission did not translate into API write access.
No remote files were changed by that failed attempt. This ZIP is the prepared
replacement, not a claim that the live site is updated.

## Verification

Run `node build.mjs` and `node --test recovery-tests.mjs` from the extracted folder.
Eight focused recovery checks pass; all 23 runtime JS files pass syntax checks.
The test browser could read the hosted previous build but could not open the local
preview, so physical touch and rendered-layout verification are still required.
See TEST_REPORT.md and CHANGELOG.md for scope and limitations.

## Outstanding work

The AI backend is still not connected. No new AI service or paid account was
created. Live CAD conversion diagnosis, export redesign, icon recolouring and
other items in the changelog's Still open section remain separate work.
