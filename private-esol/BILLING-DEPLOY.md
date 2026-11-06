# Paid ESOL release - GBP 29.99 once

Owner instruction: one GBP 29.99 payment, one final test across all five ESOL levels, and a downloadable results report. Completing the final test uses that paid service. A new paid run costs GBP 29.99 again. There is no subscription and no automatic recurring payment.

## Course and final test

The existing 1,050 activities, 350 MP3s, 15 repeatable practice assessment sets and saved-progress IDs remain. Practice assessments do not consume the paid final attempt. The account's **Final test and results reports** area is the server-controlled final test.

The final contains 130 prompts: eight Reading, eight Listening and eight Language checked questions per level, plus one written response and one spoken-practice response per level. The checked score is out of 120. Writing/speaking responses are explicitly ungraded and do not establish proficiency. A learner may leave a question blank (zero marks), save and resume, or choose Finish after an explicit warning that completion uses the paid attempt.

Each verified paid Checkout Session creates one purchase. Atomic database functions reserve one purchase per attempt, resume an unfinished attempt, save answers, reject stale finalisation, and preserve the completed report. Browser storage cannot create another paid attempt. A completed report remains downloadable from its owner's account after the purchase is used or refunded.

## Implemented checks

- Fixed GBP 2999 minor-unit **payment** Checkout. Recurring Prices are rejected.
- Signed Checkout completed/async-success and refund/dispute/fraud events; an unpaid checkout or return URL grants no access.
- Exact paid amount, currency, selected Price, quantity and customer ownership verified before fulfilment.
- Duplicate and out-of-order payment events cannot grant another purchase or undo a refund.
- Server-side final-test snapshots and marking. Answer keys are not returned in the test API.
- Owner-scoped records, persistent reports, account export, password recovery and receipts.
- Atomic start/save/finish functions tested in the actual database inside a rolled-back transaction; no test purchase or attempt was retained.
- PDF results report labelled as independent practice results, not an accredited certificate or recognised qualification.

## Runtime secrets and configuration

Set these only in the customer Render service's Environment settings; never commit secret values or paste them into chat.

ESOL_PUBLIC_CUSTOMERS=true
ESOL_CUSTOMER_ORIGIN=https://brainy-elephant-esol-customers.onrender.com
SUPABASE_URL=https://lovvxmlcpsbvmlxezora.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SECRET_KEY=<server-only sb_secret_ key>
STRIPE_RESTRICTED_KEY=<restricted key for this payment environment>
ESOL_STRIPE_PRICE_ID=price_1UYpqGAQt0bBQzeuxRovT5e9
STRIPE_WEBHOOK_SECRET=<secret for /billing/webhook>
ESOL_TERMS_URL=<published, approved seller/refund/cancellation terms>
ESOL_PRIVACY_URL=<published, approved privacy information>
ESOL_SUPPORT_EMAIL=brainyelephant1001@gmail.com
ESOL_OWNER_EMAIL=brainyelephant1001@gmail.com
ESOL_TESTER_EMAILS=<optional existing private testers>

Live Product: prod_VZzTdzzHBe0QUL. The earlier monthly Price price_1UYpVUAQt0bBQzeujRnhZQC9 is archived. No subscription or customer charge was started. The live webhook we_1UYpZiAQt0bBQzeukZC6ge6W is deliberately disabled pending secure setup and provider end-to-end testing. Its signing secret is held only in the customer service's environment settings.

Restricted Stripe credentials need the customer, Price, Checkout Session/line-item, Charge, invoice-creation and Billing Portal operations used in billing.js. Use separate sandbox credentials for end-to-end payment testing. Do not test by charging a real customer.

Configure Supabase Auth's site URL and allowed /login and /reset-password redirect URLs for the customer origin. Keep email confirmation enabled and configure production email delivery. Review the [compromised-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), which the project advisor reports as disabled.

In Stripe Checkout settings, set the approved terms/privacy links to match the customer site. The server refuses enrolment/checkout while required credentials or approved policy URLs are missing. Only enable the webhook and accept live payments after sandbox purchase, resume, final completion, PDF download, repeat purchase, delayed payment, duplicate event and refund flows have been verified.

## Commercial information and tax

Seller identity/contact details, approved terms, refund/cancellation policy and privacy information still require the owner's business facts. They are not fabricated in this project. Stripe Tax is not automatically enabled: confirm any applicable registration/tax treatment before activation. The advertised one-off price is GBP 29.99; the Price is tax-inclusive if tax is subsequently configured.

## Deployment and storage

Use private-esol/Dockerfile, repository root context. It builds synthetic audio with FFmpeg/Flite, includes PDF fonts, and runs Node on 0.0.0.0:$PORT. /health proves process readiness only; it does not assert payment readiness. The owner-private static Sites edition remains a separate review site.

Only completed lesson IDs sync through the original progress API. Practice drafts/portfolio backups retain browser storage; use account export before changing devices. Paid final answers, snapshots, purchase consumption and results reports are server-persisted. Billing tables and RPCs are service-role only; public/authenticated clients cannot read answer snapshots, write purchases or start attempts directly.

## Verification limits

Mock transport tests verify payment logic without a live charge. Database transaction tests verify reservation/consumption and permissions. Browser tests exercise the real server/test UI using disposable fake authentication/payment/database transport. These do not replace a real sandbox-provider purchase/email-delivery test and do not establish independent educational approval.

## Approved introductory offer

Display exactly: “Six-month introductory offer: £29.99. Standard price after the offer: £49.99.” The offer starts on the actual paid public launch date, not the preview publication date. Before opening payments, publish its calendar closing date and configure the GBP 49.99 standard Price and the switch after six months. Do not call £49.99 a previous selling price. The current live Price remains GBP 29.99 once. Checkout remains closed pending the required credentials, customer policies and provider sandbox verification above.

Modern Supabase secret keys are supplied only as the apikey header. The server also accepts SUPABASE_SERVICE_ROLE_KEY for existing legacy deployments; never put either server key in browser code.

## Explicit launch gate

ESOL_CHECKOUT_OPEN defaults to false. Credential presence does not open checkout. Only set it to true after approval of seller policies, published six-month offer dates, confirmed Auth redirect/email delivery, sandbox payment/webhook/fulfilment/refund verification and enabling the correct live webhook. Terms and privacy are served locally at /terms and /privacy. Owner-only /admin/setup performs read-only Stripe Price and database permission checks and never displays key values.

## Isolated provider sandbox

ESOL_STRIPE_SANDBOX_KEY must have an rk_test_ or sk_test_ prefix. It is never substituted for STRIPE_RESTRICTED_KEY. Owner-only /admin/sandbox uses the existing billing and final-test engine with REST/RPC calls rewritten exclusively to be_esol_sandbox_ records. Every sandbox table and function is service-role only. Startup creates a GBP 29.99 test product/Price and signed webhook once; only its signing secret is stored in the server-only sandbox config table, never in HTML or logs. /admin/sandbox/webhook verifies test signatures before fulfilment. Test refunds verify that the original Checkout Session is not live before requesting a refund. The provider confirmation, rehearsal and PDF download must be exercised before launch; mocked tests do not establish provider success.
