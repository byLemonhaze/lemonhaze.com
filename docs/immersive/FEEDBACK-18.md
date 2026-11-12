# Native pixels, mobile camera isolation and quieter field physics

Twenty-six native pixel PNGs are served unchanged from a small local cache of the artist's CDN originals. Tad Small and the other native pixel works use nearest-neighbor presentation in Explore, Gallery, detail and collection covers. Their large presentation no longer enlarges a blurred derivative. Blocked static chain images also fall back to the artist-owned CDN before retaining a small poster. Original PNG dimensions are recorded and verified; the distant Explore atlas is unchanged.

Provenance is no longer a collection in All Works, the Gallery picker, collection resolution or the sitemap. Its old public collection paths redirect to All Works. Parent inscriptions and lineage records remain intact, with standalone parent details labeled “Parent inscription.” Ma ville en quatre temps now leads with L’Hiver, la nuit, retaining Un Été à Montréal and L’Automne s’envole as its other covers.

Gentleman Nº1 has the artist-voice note: “The core of my on-chain practice. Gentleman Nº1 is the master parent at the root of my parent–child inscription tree.” The split/mobile detail displays it before the collection description; Gallery and the conventional collection card carry shorter master-parent labels. Full metadata includes the same note.

The document declares its paper default before loading the application. Early theme selection retains saved night mode and remains paper when storage is unavailable. No black inline body default remains.

Touch pinch on Explore changes its camera rather than the browser viewport. Its non-passive two-touch handlers prevent page zoom, suspend one-finger drag, and share the zoom constraints used by the controls. Opening detail after pinch does not inherit field scale. Native browser zoom outside the field remains available. Mobile close and appearance controls have separate touch targets.

Desktop movement now catches the visible field when re-grabbing. Throw velocity is smoothed, release strength is moderated, and collision uses stable resting bounds instead of feeding animated squash bounds back into velocity. The rendered outline remains constrained separately. Corner pressure blends continuously across axes rather than flipping deformation signs. Spring oscillation settles sooner while sustained wall pressure still squeezes the lemon.

On desktop, clicking the artwork in detail opens a near-full-screen solo stage. The collection rail and metadata are hidden; aspect ratio and framing are preserved. The unobtrusive close control or Escape restores the same split view without changing the URL, selection or remounting live media. The entry overlay is absent on mobile.

Review images: `output/playwright/feedback-18/index.html`. Checks include native PNG dimensions, pre-application colors with fresh/saved/unavailable storage, actual two-touch browser input followed by detail opening, mobile control separation, corner-pressure continuity, and desktop held-wall/rebound containment. Browser emulation does not substitute for physical iPhone confirmation.

Verification completed: `npm run verify` passed with 1,704 prerendered routes and 246 tests. The final production build also passed the separate WebKit mobile regression; desktop solo entry/return passed in Chromium and WebKit. Desktop wall-pressure stability and rebound containment were checked in the review browser.
