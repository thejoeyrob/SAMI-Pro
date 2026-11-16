# SAMI Elite — iPhone/iPad release

## What is provided

A Capacitor 8 iOS project at `ios/App/App.xcodeproj`, bundle ID `site.sami.elite`, version 3.0.0/build 1. It bundles the editor for offline drawing and uses native camera, location and file-sharing plugins. iPhone and iPad are enabled. The icon retains SAMI branding; permission strings and a privacy manifest are included.

**This package is source, not a signed IPA.** `npm run ios:sync` succeeded. No macOS Xcode compiler, signing team credentials or App Store Connect session was available for this build. Xcode compilation, physical-device verification, signing, upload and Apple review remain outstanding.

## Mac build

1. Use a supported Xcode 26+ installation and Node 24. Open Xcode once and complete its setup.
2. Register the bundle ID in your Apple Developer account and create the matching App Store Connect app (or deliberately change the ID consistently if you already have a SAMI app record).
3. Fix `sami.site` DNS and backend credentials before building. Verify `https://sami.site/api/health`.
4. In the extracted source root, run `npm ci`, `npm test`, `npm run ios:sync`.
5. Open `ios/App/App.xcodeproj`, select the App target, select your team in Signing & Capabilities, enable automatic signing and set a new build number.
6. Run on a real iPhone and iPad. Then select Any iOS Device, Product → Archive, and use Organizer to validate/distribute to App Store Connect.

An equivalent export script is provided:

```bash
export APPLE_TEAM_ID='YOUR_TEAM_ID'
export SAMI_BUILD_NUMBER='1'
bash scripts/archive-ios.sh
```

For App Store Connect API-key signing, the script accepts `ASC_KEY_PATH`, `ASC_KEY_ID`, `ASC_ISSUER_ID`. Keep the private `.p8` outside the source/archive and outside Git. The script exports to `build/export`; upload the resulting IPA using Organizer or Transporter. Use a unique build number for each upload.

## TestFlight acceptance checks

- Create/edit/reopen a project in airplane mode; restore network and save/load a private cloud copy.
- Test touch placement, pan/zoom, grouped panel movement and ungrouping, colour controls and keyboard dismissal on both device sizes.
- Export/share a PDF and `.sami` file; reopen the file on another platform and verify groups, photos, logo and route.
- Test camera/library/location permission denied and granted paths. Location is requested only when used; background location is not requested.
- Resolve a valid what3words address, attach it to the correct entrance, then verify route origin and destination.
- Confirm external data failures visibly terminate and do not prevent editing/export.
- Test app background/resume and device storage pressure. Keep an exported backup.

## App Store preparation

App name: SAMI Elite. Proposed subtitle: Site plans, access and logistics.

The in-app Privacy & data page is also reachable at `/privacy`; it describes behaviour but needs the owner's final contact/support information and review before being treated as the published business privacy policy. App Store privacy declarations must account for optional cloud project content, photos and precise locations, search/routing requests and connected AI prompts. Do not mark all data “not collected” merely because local editing works offline.

Provide actual iPhone/iPad screenshots, support URL, privacy URL, age rating, content-rights responses and review notes. No subscription/paywall or Apple in-app purchase flow is included. No Apple approval or App Store listing is implied by the source package.

No CarPlay, CloudKit, LiDAR or ARKit entitlement is included. Adding these requires separate implementation, eligibility/entitlements and testing; Apple Developer membership does not switch them on automatically.
