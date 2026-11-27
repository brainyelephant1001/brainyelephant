# Light Years Learning — Google Play Release Readiness

Status: **SOURCE UPDATED FOR API 36; NOT READY FOR UPLOAD**. This branch is the Android 1.0.0 **test build**, not a signed Google Play release. Keep existing code, signing material and backups intact.

## Confirmed from this branch (27 November 2026)
- Application ID: `com.brainyelephant.lightyears`
- Version: `1.0.0`, versionCode 1
- Current compileSdk / targetSdk: **35 / 35**
- minSdk: 23
- Test APK: `downloads/Light-Years-Learning-1.0.0.apk`
- Offline 30-question assessment with feedback/explanations
- README says the launcher icon is temporary and device/visual testing is pending
- Test APK key is disposable. **Never use its test signing key for publishing.**
- The GitHub branch is `light-years-learning-android`; the `main` branch is the Brainy Elephant website.

## Engineering before release
- [x] Source upgraded to Android compileSdk / targetSdk **36**; AGP updated to **8.10.1**. Build and runtime verification still pending.
- [ ] Install the Android 16 SDK/build tools; compile and test after changing SDK levels. The standalone `build.sh` now requires an API 36 `android.jar`; legacy `setup-tools.sh` still fetches API 35 tools and must not be treated as a release setup.
- [ ] Create production launcher icon/adaptive icon, distinct from temporary blue “LY”.
- [x] GitHub Actions: 30 correct/incorrect question paths, offline resume, feedback, 320px/360px mobile browser layouts and no-network checks passed on 27 November 2026 (run 45939910857).
- [ ] Physical Android device testing remains outstanding: lifecycle/restart, rotation, navigation and feedback on Samsung A14.
- [ ] Inspect displayed content for accuracy, reading level and accessibility.
- [ ] Define a release signing key kept **outside GitHub**, backed up securely; document key continuity for future updates.
- [ ] Increment versionCode for release as appropriate; generate a **signed release AAB**, not just an APK.
- [ ] Verify AAB signature, manifest, target API, final package ID and installation through Play internal testing.

## Store and business requirements
- [ ] Finish Brainy Elephant Ltd organisation verification in Play Console when D-U-N-S is issued.
- [ ] Finish trader status and public developer contact details under the correct legal entity.
- [ ] Store listing: truthful descriptions, screenshots, 512px icon, 1024×500 feature graphic, category, support contact.
- [ ] Privacy policy and Data safety declaration must match actual release behaviour; current test build claims no network, analytics, payments or account functionality.
- [ ] App content declarations, content rating, target audience, advertising status and testing track.
- [ ] Confirm pricing and ownership; do not publish without explicit approval.

## Word Roots is a separate app
- `com.brainyelephant.wordroots` is NOT this application and is NOT Scientific Roots. Its previously referenced `WordRoots-v1.0.0.aab` has not yet been inspected or verified in the currently connected GitHub repositories. Do not substitute another Roots app or claim that file is release-ready.

## Preservation
- Keep GitHub sources private where required, keep full copies on both Dell machines, independent backups on the SATA HDD and BRAINY3, and never commit keystores, passwords, service-role keys or production signing secrets.
