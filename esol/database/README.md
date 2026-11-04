# Brainy Elephant ESOL — Supabase integration status (4 November 2026)

**Dedicated project deployed:** `brainy-elephant-esol` (London, EU West 2)
Project reference: `lovvxmlcpsbvmlxezora`

The database schema in `schema.sql` has been installed with four tables:
`be_esol_learners`, `be_esol_progress`, `be_esol_assessment_attempts`, and `be_esol_entitlements`.
All four use row-level security. The learner account and ESOL 2–5 learning pages now contain **development-preview** code to use this project.

## Implemented
- Email/password sign-in and account-creation frontend (requires redirect configuration before public testing)
- Chosen certificate display name stored per user
- Lesson completion synced for signed-in users in ESOL levels 2–5
- Learner dashboard listing course progress
- Learners can only read their own profile, progress, scored attempts and entitlements
- Unauthenticated users receive no table privileges
- No client insert/update rights for assessed scores or subscription entitlements

## IMPORTANT: Not ready for public enrolment or charging
1. Configure **Supabase Auth → URL Configuration**:
   Site URL: `https://brainyelephant.com`
   Allowed redirect URL: `https://brainyelephant.com/esol/account/`
2. Verify domain publishing and confirmation emails from two separate test accounts.
3. Test row-level security across different actual learners, including denial of access to other users' records.
4. Verify the pinned Supabase JS library loads on devices and browsers; validate account creation, sign-in, sign-out and course sync.
5. Add privacy notice, deletion/export mechanism, retention schedule and a suitable transactional email service before public launch.
6. Google and Apple providers need their own OAuth configuration; not enabled.
7. Secure server-side assessment grading and separate questions are essential for credible certificates. The current practice-test scores are **not stored as authoritative assessment attempts**.
8. Stripe integration, webhooks, subscription cancellation and entitlement grants remain pending.
9. Publish paid-access safeguards with a server-side gate. GitHub Pages public HTML cannot safely restrict access just with frontend JS.

## Security notes
- `supabase-config.js` holds only a public project URL and a publishable API key; never publish a secret/service-role key.
- Every learner-facing table has RLS policies restricting rows by `auth.uid()`.
- Learners may record their **own practice lesson completions**; they cannot grant themselves a subscription or verified exam score.
- Site is a **free development preview**. No certificates are issued.

This document supersedes the earlier draft checklist.
