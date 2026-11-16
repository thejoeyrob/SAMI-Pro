# SAMI Elite — deployment handover

## Start here

This is a new application root. Do not merge its HTML/JavaScript files into the old static app or unpack old build ZIPs over it. Keep the original repository/build archives for rollback. Create a separate `sami-elite-3.0.0` branch, replace that branch's application root with this package, then review before merging.

The source is already deployed to the Vercel `sami-elite` project in Joseph's team. The connected GitHub integration returned 403 on a write; no new branch or commit was created through that integration.

Project ID: `prj_iYOYEBtpX5ZLDpgZel6BEqcOfqUZ`
Team ID: `team_dUXnt0KTZZW6abmmwWaWKrwC`

Use Node 24, `npm ci`, `npm test`, `npm run build`. Vercel framework: Vite; output: `dist`. Deploy the **whole source root**, including `api/` and `server/`; `dist` alone has no server endpoints. The `.vercelignore` excludes native/test material from web uploads.

## sami.site — remaining DNS action

The Vercel project has `sami.site` attached and `www.sami.site` configured to redirect to it. **Correction from the 16 November 19:10 UTC recheck:** the earlier non-strict DNS response returned parent `.site` registry nameservers, not authoritative nameservers delegated to `sami.site`. A strict Vercel query returned no domain-specific nameservers, public DNS returned NXDOMAIN, and the RDAP lookup returned 404. Vercel domain search reported `sami.site` available as a premium domain. These observations do not verify the user's domain purchase; check the exact spelling and registration account/receipt before taking action. No domain purchase or transfer was made.

Vercel reports no apex A records/CNAME and `misconfigured: true`. **Only after confirming ownership and the correct domain**, configure the recommended records below at its authoritative DNS host. If the purchased domain differs, attach that verified domain to Elite and fetch its own current Vercel recommendations. Preserve mail/MX/TXT records. Do not change nameservers blindly.

| Type | Host | Value |
|---|---|---|
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | 9db75c4a750a6558.vercel-dns-017.com |

These are the rank-1 recommendations returned for this project/domain. Recheck Vercel's Domains page before applying if doing this significantly later. The correct registration/DNS account is not established here, so these records have not been written. Once DNS resolves, verify HTTPS, `/api/health`, a CAD query, a cloud save and a PDF export on the actual domain.

## Connections

| Setting | State / action |
|---|---|
| Private Vercel Blob | Connected to Elite; use server-side automatically injected token. Never expose it with `VITE_`. |
| WHAT3WORDS_API_KEY | Not configured. Add a valid key with the necessary conversion permissions in Vercel production and preview, then redeploy and verify both coordinate-to-words and words-to-coordinate paths. |
| AI Gateway | Request-context OIDC enabled; see verification record for actual call outcome. Optional `AI_GATEWAY_API_KEY` is server-only. |
| Public map/constraint sources | Configured; some public endpoints can fail or have incomplete coverage. Contracted/self-hosted endpoints are an expansion option. |
| Routing | Public Valhalla reference service; set `VALHALLA_URL` for a production service with agreed capacity/support. |
| Native backend | Defaults to `https://sami.site`. Optional `VITE_API_BASE` must be set before building native assets. Do not embed temporary preview links, API secrets or Vercel bypass tokens in an IPA. |

Protection remains enabled on Vercel preview/deployment hostnames. Temporary review links expire; they are not the permanent app address. Cloud edit links should be generated on the final stable domain for routine use.

## Suggested release sequence

1. Confirm the exact purchased domain and its registration status, then correct DNS and configure what3words.
2. Run the included web tests on a normal development/CI machine.
3. Walk a real pilot project through locate → boundary → CAD context → Trakway and assets → services/constraints → route → PDF → portable file → second device.
4. Compile and sign the iOS project on a Mac; test on real iPhone and iPad through TestFlight.
5. Publish owner contact details, support and privacy policy; align App Store privacy disclosures with the actual deployment/providers.
6. Only then announce a wider release or send a partner demonstration as a finished product.

## Keep the user's work safe

Saved projects belong to a browser origin/device. Moving from an old hostname to sami.site does not automatically move that browser's IndexedDB. Export `.sami`/legacy project files from the previous app and import them into Elite. Keep originals. An uploaded ZIP of app code is not a backup of users' saved projects.

A `.sami` file includes drawings, photos, logo, source snapshots and metadata. Anyone holding a private cloud edit link can read/edit that project; revoke the link to delete that cloud copy. This release has no user-account invitation or role-management system.
