# Reusable browser checks

`npm ci` and `npx playwright install --with-deps chromium` install the pinned test runner and browser. Install FFmpeg with the Flite filter, then run `python3 tools/esol/build_audio.py` to generate the listening assets.

- `npm run test:browser:quick`: learner-flow tests on desktop Chrome and an emulated Pixel 7 viewport/touch environment.
- `npm run test:browser:lessons`: open and complete all 1,050 lessons through actual UI controls on desktop Chrome.
- `npm run test:browser`: both groups, with a local preview server started automatically.
- `npm run test:browser:report`: open the last HTML report.

The full suite has 35 stage sweeps (30 lessons each) plus 26 desktop/mobile learner-flow tests. It covers the current task interactions, correct/wrong/blank answers, completion without mandatory reflection checkboxes, next-lesson navigation, saved completion, saved writing drafts, search, horizontal overflow, audio playback and speed, transcripts, all 15 reading/listening/language assessment variants, assessment resume/scoring/history, and backup download/import/rejection. It checks page JavaScript errors during the sweep.

GitHub Actions runs the suite on matching pushes and pull requests, and supports manual runs. Failure evidence is retained as screenshots, videos, traces and an HTML/JSON report for 14 days. Retries are disabled so a flaky failure is reported instead of silently hidden. Four isolated browser workers run concurrently. Actions fail after 10 seconds if a control cannot be found, rather than waiting for the full test timeout. There is a 20-minute test-suite limit. Actual timing depends on the runner and is not guaranteed to be a few minutes.

Tests run against a disposable local copy, not real learner accounts or personal data. They do not log into the private published ChatGPT Site, test live Supabase accounts, verify microphone hardware, prove compatibility with every browser, or establish independent ESOL curriculum coverage. Correct answers in the sweep come from the lesson bank; a separate content audit must verify those keys and educational substance.

The framework can be reused for other websites: keep the Playwright configuration and report workflow, replace the ESOL helpers/scenarios, and adjust the preview-server command. Add each new feature's regression test before declaring that feature checked.

For an existing authorised local test server, set `PLAYWRIGHT_BASE_URL`. An optional `PLAYWRIGHT_EXECUTABLE_PATH` can select an installed Chromium executable. Leave both unset in GitHub Actions. Do not put credentials or personal data in tests, traces or screenshots.
