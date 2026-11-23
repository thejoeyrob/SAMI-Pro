#!/usr/bin/env bash
set -euo pipefail
# Run on macOS with Xcode 26+. No credentials are embedded in this project.
: "${APPLE_TEAM_ID:?Set your Apple Developer team ID}"
: "${SAMI_BUILD_NUMBER:?Set a unique App Store Connect build number}"
if ! command -v xcodebuild >/dev/null; then echo 'Xcode is required on this machine.' >&2; exit 1; fi
npm ci
npm run ios:sync
mkdir -p build
args=()
if [[ -n "${ASC_KEY_PATH:-}" ]]; then
  : "${ASC_KEY_ID:?Set the App Store Connect API key ID}"
  : "${ASC_ISSUER_ID:?Set the App Store Connect issuer ID}"
  args=(-authenticationKeyPath "$ASC_KEY_PATH" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
fi
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath build/SAMI-Elite.xcarchive DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CURRENT_PROJECT_VERSION="$SAMI_BUILD_NUMBER" CODE_SIGN_STYLE=Automatic CODE_SIGN_IDENTITY="Apple Distribution" PROVISIONING_PROFILE_SPECIFIER="" -allowProvisioningUpdates ${args[@]+"${args[@]}"} archive
python3 - <<'PY'
import plistlib,os
options={'method':'app-store-connect','teamID':os.environ['APPLE_TEAM_ID'],'signingStyle':'automatic','uploadSymbols':True,'manageAppVersionAndBuildNumber':False,'destination':'export'}
with open('build/ExportOptions.plist','wb') as f:plistlib.dump(options,f)
PY
xcodebuild -exportArchive -archivePath build/SAMI-Elite.xcarchive -exportPath build/export -exportOptionsPlist build/ExportOptions.plist -allowProvisioningUpdates ${args[@]+"${args[@]}"}
echo 'Signed IPA exported in build/export. Upload using Xcode Organizer or Transporter.'
