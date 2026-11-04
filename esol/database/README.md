# Brainy Elephant ESOL — Account and results infrastructure (draft)

Status: **Design committed; NOT deployed.** Existing ESOL pages remain free development previews.

## Why a separate project?
The connected Supabase account currently has a **word-master** project and a **john-smythe-feedback** project. Neither is an appropriate destination for ESOL learners' names, subscription status or results. A dedicated Supabase project is needed before enabling registration.

## Proposed data model
- `be_esol_learners`: authenticated learner ID and chosen name for future certificates.
- `be_esol_progress`: lesson completions by user, level and lesson ID.
- `be_esol_assessment_attempts`: read-only to learners; future server-verified scores.
- `be_esol_entitlements`: read-only to learners; future paid-access grants.

Security uses row-level policies to restrict each learner to their own records. Client browsers cannot create scores, payment entitlements or certificates.

## Deployment checklist
1. Create a **dedicated Brainy Elephant ESOL** project and confirm the cost first.
2. Apply `database/schema.sql` to that project's database after checking migrations and table-name conflicts.
3. Check policies using two distinct test accounts; ensure one account cannot read or alter the other's records.
4. Configure verified email sign-in and approved redirect URLs under Auth settings.
5. Set up Google and Apple identity providers separately, if desired.
6. Add a secure backend that grades final assessment submissions and keeps question-answer keys server-side.
7. Add Stripe webhooks and payment checks before granting paid access.
8. Update the website only after end-to-end account, cancellation and payment tests.
9. Publish a privacy notice, retention policy, account deletion flow and certificate eligibility criteria.

**No sign-in controls, payment buttons, learner data or certificates have been enabled.**

## Assessment integrity
The current browser-based final test exposes correct answers in its page code. It is a revision tool and cannot establish certificate eligibility or enforce paid access. In a future certified assessment, authorised back-end grading must use protected question banks and issue a unique attempt ID. Never calculate the authoritative score or entitlement solely in client-side JavaScript.
