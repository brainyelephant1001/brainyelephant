# Brainy Elephant ESOL - independent learning and practice, revision 3

Five levels, each with 21 core teaching units (seven Reading, seven Writing and seven Speaking & Listening units). Each unit has ten contextual practice activities: 105 teaching units and 1,050 activities across the programme. Repeated context variants are deliberate practice, not a claim of 1,050 separately authored teaching topics.

The revision replaces the earlier appointment-template bank. It adds explicit explanations, worked answers, guided feedback and supplied independent reading sources; different reading genres; signs, compass grids and tables; contextual glossaries; grammar, spelling, punctuation and pronunciation practice; developed level-specific writing examples; 50 interactive forms with conditional fields; multi-speaker listening scripts; response and follow-up speaking prompts; and review rubrics/feedback notes.

Each practice assessment has eight reading, eight listening and eight language questions, plus written and spoken practice responses. Checked components have separate scores; writing and speaking use examples and self/partner/tutor review, not automatic proficiency grades. Fifteen repeatable sets are provided.

The planning map links activities to all 126 Gateway unit criteria used as a reference during development. This is a map of intended practice opportunities, not awarding-body approval or evidence of learner attainment. This independent programme does not award a recognised qualification or claim verified guided learning hours.

Earlier browser work remains under its original storage key and can be exported separately. Revision 3 uses new activity IDs so old completions do not mark the replacement content complete. Browser drafts, notes and recordings have the save/export behaviour described in the course guide. The private account service can sync completed activity IDs; live cross-device accounts are not included in the anonymous browser regression suite.

Rebuild content: `npm run build:curriculum`. Rebuild audio: `python3 tools/esol/build_audio.py` (FFmpeg with Flite required). The compatibility builder points to the same current curriculum implementation.

Validate: `npm run test:esol`, `node tests/esol-audio.js`, `npm run test:browser`. Content checks independently verify source evidence for relevant keys, required form facts, planned criterion links, reading transfer sources, level differentiation and assessment balance. Browser tests include a complete activity sweep on desktop and learner flows on desktop/mobile emulation. These are content/behaviour guardrails; they are not independent teacher calibration or guarantees of learning outcomes.
