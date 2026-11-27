# Light Years Learning — ad-supported freemium test build

**Not published or payment-ready.** Android package `com.brainyelephant.lightyears`. Version `1.1.0-test` (versionCode 2). All 30 questions remain available to free users. The banner is a **Google sample TEST ad**, not a revenue-producing ad. No live purchases can succeed until an in-app product is created and activated in Google Play Console.

## Intended business model
- Free Google Play download.
- One small, anchored `AdSize.BANNER` banner, below the WebView and outside question controls.
- One-time **non-consumable** Google Play product with ID **`remove_ads`**, US base price **$1.99**, local prices configured by Google Play Console. No subscription.
- Product price in UI is taken from Google Play's returned formatted price; a purchase button is disabled if the product is unavailable.
- On successful PURCHASED entitlement, hides banner; checks purchases on launch/resume; restores across Play installs; acknowledges purchase; pending purchases do not remove ads. Cached entitlement is used before Play is reachable. **Production must add trusted server-side verification**, refund/revocation handling, and test license accounts.

## External setup still required
1. Wait for Brainy Elephant Ltd organisation verification and D-U-N-S requirements; keep current personal Play account unmodified until migration is approved.
2. Create/activate product `remove_ads` in Play Console at $1.99; configure billing test users and internal testing release. Billing does not work on an arbitrary sideloaded debug APK.
3. Create the company AdMob application and banner ad unit; replace **both** Google SAMPLE App ID and sample banner unit ID **only after** consent and policies have been reviewed.
4. Configure AdMob's GDPR/UK consent messages and any required privacy options in Funding Choices; UMP consent code is included but sample app ID cannot be used for production consent.
5. Publish a truthful privacy policy at an accessible URL; Google Mobile Ads and billing SDKs involve network/data processing, so do **not** reuse the original offline-only privacy claim or original Data Safety answers. Identify the SDK data categories and sharing accurately. Set advertising=Yes and the app's age/target audience appropriately.
6. Create and securely store Play upload signing key outside public GitHub. Produce a signed AAB with the final IDs only after policies and tests pass.
7. Verify Play purchase/restore/refund scenarios, screen readers, small screen layouts, connection loss, consent form, device rotations, and Android back navigation.
8. Set the Play store listing FREE on first publication; Play will reject attempts to change a published free app to paid. The in-app ad removal is still separately priced.

## Test limitations
- Test banner may show Google's `Test Ad` badge when network/consent allow; without AdMob service connection the reserved space may be empty.
- Existing quiz functionality remains fully offline; ads and billing are optional network functions.
- No real charge, revenue, or production ad delivery has been enabled.
- Client-only purchase token handling is provided for test builds, **not production-level fraud resistance**.

Sources: https://developer.android.com/google/play/billing/integrate ; https://developers.google.com/admob/android/banner ; https://developers.google.com/admob/android/privacy
