# Brainy Elephant ESOL five-level practice course

This revision replaces the incomplete question extraction interface with explicit tasks in all 1,050 lessons: 210 per level across Reading, Writing, and Speaking & Listening. The scenario generator and its fictional facts are in `tools/esol/build_course.py`.

Implemented: five-level dashboard, seven stages per level, topic search, skill filters, text and downloadable synthetic listening audio, explicit choice keys with explanation and retries, written responses with examples, optional local voice recording, self-review, completion gates, saved drafts, resume, portfolio export/import, three repeatable practice assessment sets per level, and a course/privacy guide. Static review mode uses browser storage. The existing private Node service additionally syncs completed lesson IDs using its existing account database.

All productive responses need human review. The Flite synthetic voice is not a recorded human dialogue. Audio is generated reproducibly with `python tools/esol/build_audio.py` (FFmpeg with Flite required). The repeated fictional scenarios provide practice across different skills and stages; they are not 1,050 independently authored source texts. These materials have not been externally reviewed for complete ESOL curriculum coverage or approved for accreditation. Earlier source qualification codes and planned hours are legacy metadata, not a claim that this build delivers an approved qualification or verified guided learning hours.

Public main-branch closure is preserved. The private static review version requires no additional learner account. The existing Node/Supabase tester service still needs configured tester invitations and live account testing before its cross-device sync can be called verified.

Run `npm run test:esol` for structural, task, completion, backup validation and private access checks. `npm run dev -- --port 4173` serves local static review. `npm start` runs the existing private tester service.
