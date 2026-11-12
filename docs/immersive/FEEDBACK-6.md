# Feedback pass 6 — contextual Gallery navigation

November 11, 2026. Local only; no deployment.

The Gallery mode tab now closes an open artwork split and enters the carousel at that work in its own collection. It does not reuse an unrelated collection or reopen the artwork modal. This also works when Gallery is already the active mode.

“View collection in Gallery” follows the same selected-work rule. Choosing another collection from the chooser retains midpoint/remembered entry. Existing original-only edition handling is preserved. Website still explicitly returns to its home entry.

The carousel route uses `series` plus `at`, without a detail `work` parameter. Back restores the artwork split; Forward restores its carousel position. Moving to adjacent works updates the current artwork without adding history entries.

The browser regression starts from Explore, Website and a Gallery detail with an intentionally unrelated prior collection. It verifies the selected work, collection name, previous/next neighbours, active-Gallery-tab behavior, collection link and Back/Forward restoration. It also checks that the selected artwork is visually centered.

Screenshot: `output/playwright/feedback-6/gallery-context.png` — Porcelain Sunset centered in Liminality, entry 07 / 08.

Final Node 22 `npm run verify` passed: production build, all 1,704 prerendered routes and 225 tests with zero failures. `git diff --check` passed. Log: `/tmp/lemonhaze-feedback6-final.log`. The existing large-bundle advisory remains.
