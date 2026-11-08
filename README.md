# Light Years Learning — Android 1.0.0

First installable Android test edition of the existing Beta 3 challenge. It has not yet been assigned a Level 2 label. It retains all 30 questions, answers and explanations from `brainyelephant1001/johnsmythe-archive`, `beta-public/learn.html`, blob `cd5e1cda13559ea680246c1428b1ed4c45cac7af`.

## Use
Install Light-Years-Learning-1.0.0.apk on the A14. The questions, scoring and explanations work offline. The blue LY launcher icon is a temporary text icon. No Render connection, account, ads, payments, analytics or Internet permission is included. Feedback is saved locally, never sent. Leaving/restarting the app can restart the challenge; rotation retains the open screen. This is a test build, not a Play Store release.

## Verification
The APK builds against Android API 35, requires Android 6 or later, and passes APK signature verification. Automated DOM checks completed all 30 correct and all 30 incorrect paths, checked explanations, Next, score totals, feedback validation, local feedback saving and skipping. No network calls occurred. A real Android device/emulator and visual layout were not available for testing. The bundled Playwright layout test is supplied but did not run in this environment because launching Chromium is restricted. Subject-content accuracy has not been independently re-reviewed.

## Source and future updates
The app source is under `app/`. The question bank is in `app/src/main/assets/index.html`. Update its Q array to expand the challenge. Keep the application ID and signing key for updates to this test app; increment versionCode. The original disposable test signing key is retained in the private backup package, not in GitHub. The build script generates a new test key if none is provided. Never use this disposable key for production publishing.

Open this directory as an Android Studio project for a standard Gradle build (AGP 8.9.2, Gradle 8.11.1, JDK 17 or later). No Gradle wrapper is bundled. Alternatively on Linux with Java, Python, curl and unzip: run `bash setup-tools.sh`, then `bash build.sh`. This reproduces the standalone test APK using the included test key.

To run logic tests: `npm install --prefix tools/testdom jsdom@26.1.0`, then `node test-logic.cjs`.

This branch contains source and the test APK under downloads/. SDK downloads, caches and signing keys are excluded.
