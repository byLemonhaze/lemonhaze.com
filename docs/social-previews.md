# Social previews

Sharing images are independent of the images displayed in the gallery and artwork modal. Full-resolution artwork, native rendering, PNG saves and MP4 exports are unchanged.

`src/seo/social-images.js` maps the generated sharing images. The initial set covers the selected homepage works, BEST BEFORE Nº290, Confabulation and Chrysalis. Other artwork pages retain their existing image source; informational pages receive the default cover. The two featured collection routes use a representative artwork card.

The images are 1200 × 630 JPEGs, composed from original artwork sources without cropping the artwork. Content-hashed filenames let social platforms discover a changed image without overwriting an old URL. They will be hosted with the site on Cloudflare Pages after approval; no external image-resizing service or new paid service is involved.

To rebuild the initial set, run `node scripts/build_social_previews.mjs`. Supply inscription IDs as arguments to generate a custom set. The script uses a temporary original-image cache and requires network access and Playwright Chromium. It is intentionally separate from the normal offline site build. Review generated previews before committing; extend the set after visual approval.

Open Graph and Twitter metadata use absolute production URLs. Locally, inspect the corresponding `/social/` assets. The normal prerender step includes the sharing tags in the initial HTML, so crawlers do not need JavaScript.
