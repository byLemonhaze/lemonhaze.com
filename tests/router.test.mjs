import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanonicalPath,
  parseRouteUrl,
  sanitizePathname,
  stripRouteSearchParams,
} from "../src/router/path-state.js";

const sectionKeys = new Set(["about", "highlights", "supply", "media", "lab"]);
const collectionSlugToName = new Map([
  ["best-before", "BEST BEFORE"],
  ["portrait-2490", "Portrait 2490"],
]);
const collectionNameToSlug = new Map(
  [...collectionSlugToName.entries()].map(([slug, name]) => [name, slug]),
);

const helpers = {
  normalizeSectionKey(value) {
    const key = String(value || "").trim().toLowerCase();
    return sectionKeys.has(key) ? key : null;
  },
  resolveCollectionParam(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const slugMatch = collectionSlugToName.get(raw.toLowerCase());
    if (slugMatch) return slugMatch;
    return [...collectionNameToSlug.keys()].find(
      (name) => name.toLowerCase() === raw.toLowerCase(),
    ) || null;
  },
  resolveCollectionPathToken(value) {
    return collectionSlugToName.get(String(value || "").trim().toLowerCase()) || null;
  },
  toCollectionSlug(value) {
    return collectionNameToSlug.get(value) || null;
  },
};

test("buildCanonicalPath prioritizes artwork, then section, then collection", () => {
  assert.equal(buildCanonicalPath({
    collection: "BEST BEFORE",
    section: "about",
    artwork: "abc123i0",
    toCollectionSlug: helpers.toCollectionSlug,
  }), "/abc123i0");

  assert.equal(buildCanonicalPath({
    collection: "BEST BEFORE",
    section: "about",
    artwork: null,
    toCollectionSlug: helpers.toCollectionSlug,
  }), "/about");

  assert.equal(buildCanonicalPath({
    collection: "BEST BEFORE",
    section: null,
    artwork: null,
    toCollectionSlug: helpers.toCollectionSlug,
  }), "/best-before");

  assert.equal(buildCanonicalPath({
    collection: null,
    section: null,
    artwork: null,
    toCollectionSlug: helpers.toCollectionSlug,
  }), "/");
});

test("parseRouteUrl resolves canonical single-segment paths", () => {
  const sectionRoute = parseRouteUrl(new URL("https://lemonhaze.com/about"), helpers);
  assert.equal(sectionRoute.section, "about");
  assert.equal(sectionRoute.collection, null);
  assert.equal(sectionRoute.artwork, null);
  assert.equal(sectionRoute.hasNonCanonicalPath, false);

  const collectionRoute = parseRouteUrl(new URL("https://lemonhaze.com/best-before"), helpers);
  assert.equal(collectionRoute.collection, "BEST BEFORE");
  assert.equal(collectionRoute.section, null);
  assert.equal(collectionRoute.artwork, null);

  const artworkRoute = parseRouteUrl(new URL("https://lemonhaze.com/abc123i0"), helpers);
  assert.equal(artworkRoute.artwork, "abc123i0");
  assert.equal(artworkRoute.collection, null);
  assert.equal(artworkRoute.section, null);
});

test("parseRouteUrl normalizes trailing slashes, index aliases, and legacy query params", () => {
  const sectionRoute = parseRouteUrl(new URL("https://lemonhaze.com/About/?utm=1"), helpers);
  assert.equal(sectionRoute.section, "about");
  assert.equal(sectionRoute.hasNonCanonicalPath, true);
  assert.equal(sectionRoute.canonicalPath, "/about");

  const collectionRoute = parseRouteUrl(new URL("https://lemonhaze.com/index.html?name=Portrait%202490"), helpers);
  assert.equal(collectionRoute.collection, "Portrait 2490");
  assert.equal(collectionRoute.hasQueryRouteParams, true);
  assert.equal(collectionRoute.canonicalPath, "/portrait-2490");

  const artworkRoute = parseRouteUrl(new URL("https://lemonhaze.com/?id=abc123i0"), helpers);
  assert.equal(artworkRoute.artwork, "abc123i0");
  assert.equal(artworkRoute.canonicalPath, "/abc123i0");
});

test("parseRouteUrl rejects unknown collection queries and unsupported nested paths", () => {
  const unknownCollection = parseRouteUrl(new URL("https://lemonhaze.com/?collection=unknown"), helpers);
  assert.equal(unknownCollection.collection, null);
  assert.equal(unknownCollection.section, null);
  assert.equal(unknownCollection.artwork, null);
  assert.equal(unknownCollection.canonicalPath, "/");

  const nestedPath = parseRouteUrl(new URL("https://lemonhaze.com/foo/bar"), helpers);
  assert.equal(nestedPath.hasUnsupportedPath, true);
  assert.equal(nestedPath.canonicalPath, "/");
});

test("route search cleanup preserves unrelated params", () => {
  const params = new URLSearchParams("utm=1&c=best-before&section=about&id=abc123i0");
  stripRouteSearchParams(params);
  assert.equal(params.toString(), "utm=1");
});

test("sanitizePathname keeps root clean and collapses duplicate separators", () => {
  assert.equal(sanitizePathname("/"), "/");
  assert.equal(sanitizePathname("about"), "/about");
  assert.equal(sanitizePathname("//about///"), "/about");
});
