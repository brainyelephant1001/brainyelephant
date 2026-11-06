# Paid ESOL release — £9.99 per month

Approved scope: one monthly GBP 9.99 subscription covering the current five-level course, cancellable through Stripe's hosted Customer Portal. Existing private tester access and browser progress IDs are preserved. Paid mode is a separate server setting; the private static Sites edition does not run billing.

## Implemented

- Confirmed-email registration and sign-in, password reset and sign-out.
- Server-side Checkout with a fixed GBP 999 minor-unit monthly Price. Customer input cannot change the price.
- Required signed webhooks for Checkout, asynchronous payments, subscriptions, invoice payment success/failure, full refunds, disputes and early fraud warnings.
- Access based on current Stripe subscription state and paid period. A success URL does not grant access.
- Cancellation at period end retains access through the paid period; expired/failed subscriptions lose access.
- Payment-risk holds are durable. The owner can review Stripe and restore the hold through /admin/billing; an active paid subscription is still required.
- Isolated billing database records: RLS enabled, no anon/authenticated table privileges; server service-role access only.
- Synthetic audio is generated inside the Docker build; no audio is silently omitted from the customer server.

## Runtime configuration — secrets stay in Render's Environment settings

ESOL_PUBLIC_CUSTOMERS=true
ESOL_CUSTOMER_ORIGIN=<exact customer-service HTTPS origin, no trailing slash>
SUPABASE_URL=https://lovvxmlcpsbvmlxezora.supabase.co
SUPABASE_PUBLISHABLE_KEY=<project publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service-role key>
STRIPE_RESTRICTED_KEY=<restricted key for the matching Stripe environment>
ESOL_STRIPE_PRICE_ID=price_1UYpVUAQt0bBQzeujRnhZQC9
STRIPE_WEBHOOK_SECRET=<signing secret for this endpoint>
ESOL_TERMS_URL=<published, approved seller/refund/cancellation terms>
ESOL_PRIVACY_URL=<published, approved privacy information>
ESOL_SUPPORT_EMAIL=<business support email>
ESOL_OWNER_EMAIL=brainyelephant1001@gmail.com
ESOL_TESTER_EMAILS=<existing private testers, if retained>

Do not put secret values in Git, a ZIP, chat, or browser-side code. Restricted Stripe credentials should allow the customers, Prices, Checkout Sessions, Subscriptions, Charges and Billing Portal operations used in billing.js. Use separate sandbox credentials for provider end-to-end testing before live activation. No live charge has been used as a test.

Configure Supabase Auth's site URL and allowed redirect URLs for the customer service's /login and /reset-password routes. Keep email confirmation enabled. Configure a reliable production email provider before launch; current sign-in tests do not prove email delivery. Review the existing [compromised-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), which the project's advisor reports as disabled.

In Stripe Checkout settings, set the approved terms-of-service and privacy URLs to match the customer site.

Register /billing/webhook with the exact events exported as EVENTS in billing.js. Verify a sandbox lifecycle including first purchase, renewal, failed payment, cancellation, refund, dispute and duplicate delivery. The tests in this package exercise those behaviours with simulated provider/storage responses; they are not a provider-certified live integration test.

The paid registration and checkout controls remain unavailable while any required key, Price or approved policy URL is missing. This is intentional: incomplete payment configuration must not create accounts that can pay without getting access.

## Tax and commercial information

Stripe Tax is not enabled automatically. Confirm the seller's applicable tax registration and tax treatment before activation; enabling automatic_tax without an active registration does not establish compliant collection. The advertised price is GBP 9.99 per month. Seller identity, contact details, cancellation/refund terms and privacy information must be supplied and approved by the owner; this package does not invent those business/legal facts.

## Deployment

Use private-esol/Dockerfile with repository root as context. The Docker build installs pinned npm dependencies, Python and FFmpeg/Flite, then generates all listening assets. Runtime listens on 0.0.0.0:$PORT. /health reports process readiness; it does not claim that payment configuration is ready.

The default start mode remains the existing private tester service unless ESOL_PUBLIC_CUSTOMERS=true is explicitly set. Do not replace the existing public main branch or expose the owner-private review Site to launch customers. A separate customer service should use the reviewed ESOL feature branch.

## Data and verification limits

Only completed activity IDs sync through the existing account API. Draft answers, assessment history and portfolio backups retain the existing browser-storage behaviour. Learners must export backups before moving browser/device. An authenticated account should retain an export path even after a subscription ends.

A full browser run before the new content fixes passed 61 tests. A new run is required for the release commit. Educational content checks are safeguards, not independent tutor approval or proof of proficiency.
