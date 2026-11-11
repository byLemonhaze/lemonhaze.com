# Reference inspection — 11 November 2026

These are direct browser observations, separate from the implementation decisions below. Desktop Chrome was inspected at its 1512px viewport; mobile observations use a 390 × 844 responsive viewport, reloaded at that size. This is not physical-device testing.

## Palmer — https://www.palmer-dinnerware.com/

- Arrival: pale, nearly white full-viewport field; objects appear at different scales, with broad negative space and cropped objects at the edges. Small brand upper left, view control upper centre, menu/filter controls low in the viewport, circular zoom controls lower right on desktop.
- Dragging empty space moves the field in both axes. The field continues briefly after release, then settles. Hover names are secondary. A click opens an object; dragging does not open it.
- Opening: a pale panel advances from the left, occupying approximately 60% of the desktop viewport. The remaining field moves to the right. A fine divider and a square close control sit at its boundary.
- Settled desktop detail: large object beside a narrow, independently scrollable vertical square-thumbnail rail at the far left. Collection title is oversized above. Clicking another thumbnail moves the displayed object vertically; closing returns to the field.
- Mobile arrival: substantially smaller objects, more vertical composition, cropped neighbouring objects on both sides, compact brand at the top. Bottom menu/filter stack; desktop view/zoom controls are not presented in the same way.
- Mobile detail: the narrow Chrome viewport retained a divider near 60%, the object extended over the divider, close moved to the upper right, and a collection link occupied a fixed bottom strip. The desktop thumbnail rail was not visible. This is the actual observed responsive result; physical-touch behavior and device-specific differences remain unverified.
- Evidence: `output/playwright/reference-palmer-*.jpg` plus in-chat interaction captures.

## Unseen — https://unseen.co/ and /projects/

- Entered through “Enter without audio”. Desktop arrival uses a dimensional pale room: walls, openings, stairs, water and a sphere, with scene-integrated type and sparse overlay navigation.
- Projects: two broad image columns on desktop; wheel scrolling displaces and bends the imagery, then settles. The room remains atmospheric behind it.
- On a fresh 390 × 844 load, Projects becomes a single vertical stack with compact top branding/menu and a Filter control. Scrolling retains deformation and fluid settling. It is not a shrunken desktop two-column grid.
- Evidence: desktop room and mobile Projects captures in `output/playwright/`.

## Games — https://games-by-lemonhaze.pages.dev/

- Inspected live and read `/Users/lemonhaze/Desktop/MERCOR GALLERY/site/app.js` and supporting local reports.
- Scroll advances a dominant piece while neighbours tilt and drift. Artwork shows temporary deformation and settles. The existing pale watery room, large GAMES text, and reflections compete with the art.
- Source uses continuously running animation, a throttled wheel step, CSS artwork planes and water rendering. These were evaluated as reference behavior; none of that implementation or background was copied into the new views.

## Current Lemonhaze

- Live carousel DOM contained exactly eight slides. Names, IDs, order and preview URLs matched `src/curation/selection.js`; the README's older ten-work description was stale.
- Exact selection and complete rail order are recorded in `verified-selection.json`.
- Chrysalis and Liminality each have seven works plus their collection parent. Those parents are filed under Provenance in the original catalogue but deliberately lead their collection galleries. Immersive navigation preserves that membership when the parent itself is selected.

## Implementation decisions

- Follow Palmer's quiet field, original aspect ratios, desktop divider/close placement and left rail closely, with a subtle title/year instead of its oversized collection title.
- Keep a reachable rail on mobile. Use a full-width detail panel so the artwork and rail remain usable; this is an intentional adaptation of the observed narrow reference result.
- Use a newly built dry architectural room with a wall/floor junction, side boundary, ceiling, recess and soft light. CSS 3D positions the camera, room geometry and artwork in the same space. No water, reference background or third-party artwork is bundled.
- Keep transforms and input interruptible, stop frame work at rest, and respect reduced motion. Browser zoom remains available.
