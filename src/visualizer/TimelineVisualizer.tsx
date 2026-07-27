"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POSTER_WIDTH = 7680;
const POSTER_HEIGHT = 4320;
const POSTER_BORDER_X = 200;
const POSTER_CONTENT_SCALE =
  (POSTER_WIDTH - POSTER_BORDER_X * 2) / POSTER_WIDTH;
const POSTER_CONTENT_LEFT = 70;
const POSTER_CONTENT_TOP = 40;
const POSTER_CONTENT_RIGHT = 7500;
const POSTER_CONTENT_BOTTOM = 4160;
const POSTER_CONTENT_OFFSET_X =
  (POSTER_WIDTH -
    (POSTER_CONTENT_RIGHT - POSTER_CONTENT_LEFT) * POSTER_CONTENT_SCALE) /
    2 -
  POSTER_CONTENT_LEFT * POSTER_CONTENT_SCALE;
const POSTER_CONTENT_OFFSET_Y =
  (POSTER_HEIGHT -
    (POSTER_CONTENT_BOTTOM - POSTER_CONTENT_TOP) * POSTER_CONTENT_SCALE) /
    2 -
  POSTER_CONTENT_TOP * POSTER_CONTENT_SCALE;
const CHRONOLOGY_STROKE = "rgba(241,241,237,0.48)";
const ROOT_CHRONOLOGY_STROKE = "rgba(241,241,237,0.62)";
const CHRONOLOGY_TEXT = "#d0d0ca";
const CHRONOLOGY_LINE_WIDTH = 2.5;
const ROOT_CHRONOLOGY_LINE_WIDTH = 3;
const TIMELINE_DATE_FONT_SIZE = 38;
const PRE_ERA_HEADER_Y = 545;
const PRE_ERA_HEADER_SIZE = 38;
const GRAND_ERA_HEADER_Y = 1590;
const GRAND_ERA_HEADER_SIZE = 54;
const ERA_HEADER_OPTICAL_CENTER = 0.34;
const ROOT_X = 70;
const ROOT_Y = 40;
const ROOT_SIZE = 400;
const CDN_BASE = "https://cdn.lemonhaze.com/assets/assets";
const LIVE_SITE = "https://lemonhaze.com";
const PROVENANCE_URL = `${CDN_BASE}/provenance.json`;
const THUMBNAIL_PROXY = "https://wsrv.nl/";
const GENTLEMAN_ONE_ID =
  "757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0";
const SATOSHI_ORIGINAL_ID =
  "88050d79df061385765faefd8b24b4c3103720c86a5b30bf8f2e8fe2b41ec87ei0";
const MINUTE_PAPILLON_PARENT_ID =
  "611fad09e407fe63e70c54ee853e755f92cb4d69049eff21f31d3d414a2db74di0";
const ECLOSION_ID =
  "aaf0e314aab67783d7e92b0987b0c34ae610b41f64aa1ff7cae8c4fbeebf9029i0";
const HOSOI_ID =
  "3966f90bf371dbc520bfebed868fd30adc574f60e900118308587001cb27514bi0";
const COMME_DU_BONBON_ID =
  "d05d91a7772095204e3f6b8fa1ffaf8cc0f4f8f38a4d354cb6cedb654a1d76fai0";
const UNREGULATED_MINDS_PARENT_ID =
  "d00a09f392051642d736b0a9126828bf8eb5b4a4877feb63446f503e93cf07e9i0";
const STUNTMAN_ID =
  "05c2bd3924695dde46d417cdbe30aad5980cefdbf587e2d7a1f93b017a9284abi0";
const ORDINALLY_PUNCH_CARD_ID =
  "a19e210c94fe5716b2877ca3d5afee9ed248b6a8ed549ff2186dd3170f191961i0";
const BEST_BEFORE_ENGINE_ID =
  "bcf16735647186ef853dedd820c9319e9895f99bfddedcfb782ace38093bb8fbi0";
const BEST_BEFORE_PARENT_SPECS = [
  {
    id: STUNTMAN_ID,
    name: "Stuntman",
    timestamp: "2025-08-18 11:22:08 UTC",
  },
  {
    id: ORDINALLY_PUNCH_CARD_ID,
    name: "ORDINALLY's Punch Card",
    timestamp: "2025-09-16 06:03:57 UTC",
  },
  {
    id: BEST_BEFORE_ENGINE_ID,
    name: "BEST BEFORE (Engine and Diary)",
    timestamp: "2025-09-23 22:47:44 UTC",
  },
] as const;

const DEPRIVATION_MASTER =
  "9a4f72cb41ca2c4d5c591224bf02fe1fc3b977e4231042ccb45b9026c814b475i0";
const MIRAGE_MASTER =
  "18328c7aeb829846f0c20d5786a2a383b1b546c985681382cd5f073cfa4e3e15i0";
const TRILOGY_MASTERS: Record<string, string> = {
  "Glass Breaker":
    "58d21c5f1bbc25932fe1cc784ac47baf8b0ed9241ea989ad2a47b41839d132e7i0",
  "Mending Out":
    "a75945e142877ade9392a0855ef0fdab215af10a7f3e4381d31697c706836228i0",
  "Off-Kilter":
    "15ed0a345c10cb0b26fad820f364898f355924dbf0ce5527dd5d7237e0a25964i0",
};

const MINUTE_PAPILLON_EDITION_IDS = [
  "cd3daa466ec8c9ee1316c0bd50969669a5d4e1df4dad32d4292a3f8c69184d12i0",
  "563b4c4b52b38adbdcf7cba00e53e52932d2a1d890a6a66f05d7281eec7c2349i0",
  "19fc30231abc4d4b4e2888674eb6ddc33d0d332518d9e3e17351ae96300e252ci0",
  "16388f2ca78685b99a5e71ee4f6763a3ddd5e7746c3839c364adfaa28682619ei0",
  "c1ba5348888d35647e69dc697f26eb062004aab6f7f4f05a3584916c775c7541i0",
  "ae9ffc6fe4f4474bb464dfc730e18189f38e0a155a756694d00c76ebd8a062eci0",
  "b004638d1ea44a29fb27ab53a8949071a8cd4dcc284060c21bf38bd59bc16a5ei0",
  "a144d317648489b4924483b5083c76cdec24ff31f2f123d9133c2cd16a46ac40i0",
  "965db400bd64eb09d2d512505e3a4ee3e4b95fb7a867e6be3447bc1406338b46i0",
  "25c0add4c269f30c2f0e99963e83565f5d9d83844f7b279073889d41a8bef9c4i0",
  "2122a17bb5768eeb32dec11845f6b08de276477c84a114380fba9ca88678d835i0",
  "9169ffc9670d00bf28b9d4cd18f48191c961e62492b8eafad7e95612ad6a9255i0",
  "09e834fd2f45e751406b4794e5e13b4f1b3d9973f92f034eb2a35030f8f99cfai0",
  "419ee8f1d7c9ed49288c5fcb70629f32fa00334f6246834cca540c8c9d3d823ai0",
  "5550049587b7faf8c84c255794bd79535e6dcb64bf7c87ca753c6604f5c66c50i0",
  "4814f02cd1cb822a08481aa514c0bef1d014fedb160682fe4a499f036932cf3ai0",
  "de1150ea25a1f174967fb78b68855611edc4e1ebb3d212db39c755f1f55fefffi0",
  "b343c7414d2a7d74c1cfeca165a92153c2365f938a0df55ad26fa2b514ab8d49i0",
  "3bb05fd22ec8ec323faf7647cf9500e0b72fe9783dc84109ecade7c603d3beabi0",
  "e2321737a42e788372b152cf165b4e69e8617514582892add06674e721a8a7afi0",
  "d3f75d593ce98fa30fce2ef9063c4e40cbb8b1fc274dffa637bc2d9b39fb7b5ai0",
] as const;

const ENCRYPTED_ARTWORK_IDS = new Set([
  "41bd86ca3414a204bf5bd735f79f57219db5113a4655d46613d27c1218606638i0",
  "773bcd4be1b8a4a9f3e9c427fb4264066e2043b56a9ecb22c8ebcf2192fda561i0",
]);

type Artwork = {
  id: string;
  name: string;
  collection: string;
  artwork_type?: string;
  content_type?: string;
  timestamp?: string;
  provenance?: string;
  role?: string;
  grid_preview?: string;
  preview?: string;
  _imgSrc?: string;
};

type CollectionGroup = {
  year: string;
  name: string;
  allItems: Artwork[];
  parents: Artwork[];
  works: Artwork[];
  relationship: "direct" | "parent-child" | "recursive-edition";
  referenceLabel?: string;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GroupLayout = {
  group: CollectionGroup;
  rect: Rect;
};

const CHRONOLOGY = {
  "2023": [
    "Cypherville",
    "Portrait 2490",
    "Miscellaneous",
    "Gentlemen",
    "Tad Small",
    "Le Bar a Tapas",
    "The Artifacts",
    "Framed",
    "Ordinals Summer",
    "Polaroid",
    "Mending Fragments",
    "Dark Days",
    "Fading",
    "Berlin",
    "Lotus",
    "Jardin Secret",
    "World Tour",
    "Discography",
    "Generative Composition",
    "Volatility",
    "Orphelinat",
    "Deprivation (Prints)",
    "Old-Fashioned",
    "Satoshi (Original & Editions)",
    "Oaxaca",
    "Downtown",
    "Untitled",
    "Eclosion",
    "Candidly Yours",
    "Bento Box",
  ],
  "2024": [
    "1 of 1s (2024)",
    "Unregulated Minds",
    "Mirage (Prints)",
    "DeVille",
    "La Tentation",
    "Montreal",
    "Little Get Away",
    "Manufactured",
    "Games",
  ],
  "2025": [
    "1 of 1s (2025)",
    "Tori no Roji",
    "Minute, papillon! Edition",
    "Ma ville en quatre temps",
    "Trilogy (Prints)",
    "BEST BEFORE",
  ],
  "2026": ["1 of 1s (2026)", "Into The Wild", "Liminality"],
} as const;

const PRE_PARENT_COLLECTIONS = CHRONOLOGY["2023"].slice(0, 26);
const GRAND_PERIODS = [
  {
    label: "2023",
    year: "2023",
    names: CHRONOLOGY["2023"].slice(26),
    rect: { x: 210, y: 1870, width: 900, height: 2260 },
  },
  {
    label: "2024",
    year: "2024",
    names: CHRONOLOGY["2024"],
    rect: { x: 1140, y: 1870, width: 2700, height: 2260 },
  },
  {
    label: "2025",
    year: "2025",
    names: CHRONOLOGY["2025"],
    rect: { x: 3870, y: 1870, width: 2700, height: 2260 },
  },
  {
    label: "2026",
    year: "2026",
    names: CHRONOLOGY["2026"],
    rect: { x: 6600, y: 1870, width: 870, height: 2260 },
  },
] as const;

const PRINT_COLLECTIONS = new Set([
  "Deprivation (Prints)",
  "Mirage (Prints)",
  "Trilogy (Prints)",
]);

const RECURSIVE_COLLECTIONS = new Set([
  ...PRINT_COLLECTIONS,
  "Satoshi (Original & Editions)",
]);

const TIERED_PARENT_COLLECTIONS = new Set([
  "Manufactured",
  "BEST BEFORE",
]);

const COLLECTION_DATE_OVERRIDES: Record<string, string> = {
  "Deprivation (Prints)": "2023-08-25T12:00:00.000Z",
  "Satoshi (Original & Editions)": "2023-08-27T19:26:28.000Z",
  Eclosion: "2023-10-13T10:10:01.000Z",
  "Mirage (Prints)": "2024-01-05T18:25:33.000Z",
  "Minute, papillon! Edition": "2025-02-15T15:14:46.000Z",
  "Trilogy (Prints)": "2025-04-22T11:16:57.000Z",
};

const RECURSIVE_REFERENCE_LABELS: Record<string, string> = {
  "Deprivation (Prints)": "DEPRIVATION ORIGINAL REFERENCED",
  "Mirage (Prints)": "MIRAGE ORIGINAL REFERENCED",
  "Trilogy (Prints)": "3 ORIGINALS REFERENCED · SHOWN IN 1 OF 1S",
  "Satoshi (Original & Editions)": "ORIGINAL REFERENCED RECURSIVELY",
};

function normalizeArtwork(
  raw: Partial<Artwork>,
  forcedCollection?: string,
): Artwork {
  return {
    id: String(raw.id || "").trim(),
    name: String(raw.name || "Untitled").trim(),
    collection:
      forcedCollection || String(raw.collection || "Unclassified").trim(),
    artwork_type: raw.artwork_type,
    content_type: raw.content_type,
    timestamp: raw.timestamp,
    provenance: raw.provenance,
    role: raw.role,
    grid_preview: raw.grid_preview,
    preview: raw.preview,
    _imgSrc: raw._imgSrc,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json() as Promise<T>;
}

function getMetaName(item: unknown): string {
  const candidate = item as { name?: string; meta?: { name?: string } };
  return String(candidate?.meta?.name || candidate?.name || "Untitled");
}

function syntheticParent(
  id: string,
  name: string,
  collection: string,
  timestamp?: string,
): Artwork {
  return {
    id,
    name,
    collection,
    artwork_type: "PNG",
    preview: `${CDN_BASE}/${id}.png`,
    role: "parent",
    timestamp,
  };
}

function resolveTrilogyPreview(name: string): string | undefined {
  const match = Object.entries(TRILOGY_MASTERS).find(([title]) =>
    name.startsWith(title),
  );
  return match ? `${CDN_BASE}/${match[1]}.png` : undefined;
}

async function loadCatalogue(): Promise<Artwork[]> {
  const [
    provenanceResult,
    liminalityResult,
    satoshiResult,
    deprivationResult,
    mirageResult,
    trilogyResult,
    bestBeforeResult,
  ] = await Promise.allSettled([
    fetchJson<Artwork[]>(PROVENANCE_URL),
    fetchJson<
      Array<
        Artwork & {
          meta?: { name?: string };
        }
      >
    >(`${LIVE_SITE}/data/collections/liminality.json`),
    fetchJson<Array<{ id: string; meta?: { name?: string } }>>(
      `${LIVE_SITE}/data/collections/satoshi.json`,
    ),
    fetchJson<Array<{ id: string; meta?: { name?: string } }>>(
      `${LIVE_SITE}/data/collections/deprivation.json`,
    ),
    fetchJson<Array<{ id: string; meta?: { name?: string } }>>(
      `${LIVE_SITE}/data/collections/mirage.json`,
    ),
    fetchJson<Array<{ id: string; meta?: { name?: string } }>>(
      `${LIVE_SITE}/data/collections/trilogy.json`,
    ),
    fetchJson<
      Array<{ id?: string; meta?: { high_res_img_url?: string } }>
    >("https://bestbefore.space/magic_eden_collection.json"),
  ]);

  if (provenanceResult.status !== "fulfilled") {
    throw new Error("The live provenance catalogue could not be loaded.");
  }

  const bestBeforeImages = new Map<string, string>();
  if (bestBeforeResult.status === "fulfilled") {
    bestBeforeResult.value.forEach((item) => {
      if (item.id && item.meta?.high_res_img_url) {
        bestBeforeImages.set(item.id, item.meta.high_res_img_url);
      }
    });
  }

  const provenance = provenanceResult.value
    .map((item) =>
      normalizeArtwork({
        ...item,
        _imgSrc: bestBeforeImages.get(item.id) || item._imgSrc,
      }),
    )
    .filter((item) => item.id);

  const supplements: Artwork[] = [];

  if (liminalityResult.status === "fulfilled") {
    supplements.push(
      ...liminalityResult.value.map((item) =>
        normalizeArtwork(
          {
            ...item,
            name: getMetaName(item),
            preview: item.grid_preview
              ? `${LIVE_SITE}${item.grid_preview}`
              : undefined,
          },
          "Liminality",
        ),
      ),
    );
  }

  if (satoshiResult.status === "fulfilled") {
    supplements.push(
      ...satoshiResult.value.map((item) =>
        normalizeArtwork(
          {
            id: item.id,
            name: getMetaName(item),
            artwork_type:
              getMetaName(item) === "Satoshi (Original)" ? "WEBP" : "SVG",
            preview: `https://ordinals.com/content/${SATOSHI_ORIGINAL_ID}`,
            role:
              getMetaName(item) === "Satoshi (Original)"
                ? "original"
                : undefined,
          },
          "Satoshi (Original & Editions)",
        ),
      ),
    );
  }

  if (deprivationResult.status === "fulfilled") {
    supplements.push(
      ...deprivationResult.value.map((item) =>
        normalizeArtwork(
          {
            id: item.id,
            name: getMetaName(item),
            preview: `${CDN_BASE}/${DEPRIVATION_MASTER}.png`,
          },
          "Deprivation (Prints)",
        ),
      ),
    );
  }

  if (mirageResult.status === "fulfilled") {
    supplements.push(
      ...mirageResult.value.map((item) =>
        normalizeArtwork(
          {
            id: item.id,
            name: getMetaName(item),
            preview: `${CDN_BASE}/${MIRAGE_MASTER}.png`,
          },
          "Mirage (Prints)",
        ),
      ),
    );
  }

  if (trilogyResult.status === "fulfilled") {
    supplements.push(
      ...trilogyResult.value.map((item) => {
        const name = getMetaName(item);
        return normalizeArtwork(
          {
            id: item.id,
            name,
            preview: resolveTrilogyPreview(name),
          },
          "Trilogy (Prints)",
        );
      }),
    );
  }

  supplements.push(
    ...MINUTE_PAPILLON_EDITION_IDS.map((id, index) =>
      normalizeArtwork(
        {
          id,
          name: `Minute, papillon! Edition ${index + 1} of 21`,
          artwork_type: "PNG",
          content_type: "text/html;charset=utf-8",
          provenance: MINUTE_PAPILLON_PARENT_ID,
          preview: `${CDN_BASE}/${MINUTE_PAPILLON_PARENT_ID}.png`,
        },
        "Minute, papillon! Edition",
      ),
    ),
    normalizeArtwork(
      {
        id: ECLOSION_ID,
        name: "Eclosion",
        artwork_type: "HTML",
        content_type: "text/html;charset=utf-8",
        timestamp: "2023-10-13 10:10:01 UTC",
        preview: `https://render.ord.net/v5/snapshots/${ECLOSION_ID}/512.webp`,
      },
      "Eclosion",
    ),
  );

  return [...provenance, ...supplements].filter((item) => item.id);
}

function provenanceIds(item: Artwork): string[] {
  return String(item.provenance || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function splitLineage(
  name: string,
  year: string,
  items: Artwork[],
  catalogueById: Map<string, Artwork>,
): CollectionGroup {
  if (RECURSIVE_COLLECTIONS.has(name)) {
    return {
      year,
      name,
      allItems: items,
      parents: [],
      works: items.filter((item) => item.role !== "original"),
      relationship: "recursive-edition",
      referenceLabel: RECURSIVE_REFERENCE_LABELS[name],
    };
  }

  const itemIds = new Set(items.map((item) => item.id));
  const referencedParentIds = new Set<string>();
  items.forEach((item) => {
    provenanceIds(item).forEach((id) => {
      if (itemIds.has(id)) referencedParentIds.add(id);
    });
    if (item.role === "parent") referencedParentIds.add(item.id);
  });

  const parents = items.filter((item) => referencedParentIds.has(item.id));
  if (name === "Unregulated Minds") {
    const parent = items.find(
      (item) => item.id === UNREGULATED_MINDS_PARENT_ID,
    );
    if (parent && !parents.some((item) => item.id === parent.id)) {
      parents.unshift(parent);
    }
  }
  if (name === "Minute, papillon! Edition") {
    const original = catalogueById.get(MINUTE_PAPILLON_PARENT_ID);
    parents.unshift(
      original
        ? { ...original, collection: name, role: "parent" }
        : syntheticParent(
            MINUTE_PAPILLON_PARENT_ID,
            "Minute, papillon!",
            name,
            "2025-02-15 15:14:46 UTC",
          ),
    );
  }
  if (name === "BEST BEFORE") {
    const orderedParents = BEST_BEFORE_PARENT_SPECS.map((spec) => {
      const source = catalogueById.get(spec.id);
      return source
        ? { ...source, collection: name, role: "parent" }
        : syntheticParent(
            spec.id,
            spec.name,
            name,
            spec.timestamp,
          );
    });
    parents.splice(0, parents.length, ...orderedParents);
  }
  const parentIds = new Set(
    parents
      .filter((item) => itemIds.has(item.id))
      .map((item) => item.id),
  );
  const works = items.filter((item) => !parentIds.has(item.id));

  return {
    year,
    name,
    allItems: items,
    parents,
    works,
    relationship: parents.length > 0 ? "parent-child" : "direct",
  };
}

function buildGroups(artworks: Artwork[]): CollectionGroup[] {
  const byCollection = new Map<string, Artwork[]>();
  const catalogueById = new Map(artworks.map((item) => [item.id, item]));
  artworks.forEach((item) => {
    const current = byCollection.get(item.collection) || [];
    current.push(item);
    byCollection.set(item.collection, current);
  });

  return Object.entries(CHRONOLOGY).flatMap(([year, names]) =>
    names.map((name) => {
      const items = (byCollection.get(name) || []).sort((left, right) =>
        String(left.timestamp || "").localeCompare(
          String(right.timestamp || ""),
        ),
      );
      return splitLineage(name, year, items, catalogueById);
    }),
  );
}

function getPreferredExtension(item: Artwork): string {
  if (
    item.id ===
    "6f4dee1d7fb56cb3f6655f343d3824e0694f1932d20e41b0abe982cae958ae21i0"
  ) {
    return "png";
  }

  const artworkType = String(item.artwork_type || "").toLowerCase();
  const contentType = String(item.content_type || "").toLowerCase();
  if (artworkType.includes("jpeg") || artworkType === "jpg") return "jpg";
  if (artworkType === "webp" || contentType.includes("webp")) return "webp";
  if (artworkType === "gif" || contentType.includes("gif")) return "gif";
  if (artworkType === "svg" || contentType.includes("svg")) return "svg";
  return "png";
}

function getMediaCandidates(item: Artwork): string[] {
  const preferred = getPreferredExtension(item);
  const candidates = [
    item.preview,
    item._imgSrc,
    `${CDN_BASE}/${item.id}.${preferred}`,
    preferred !== "png" ? `${CDN_BASE}/${item.id}.png` : undefined,
    `https://ordinals.com/content/${item.id}`,
  ].filter(Boolean) as string[];
  return [...new Set(candidates)];
}

function resizedPreviewUrl(source: string, size = 160): string {
  const params = new URLSearchParams({
    url: source,
    w: String(size),
    h: String(size),
    fit: "contain",
    output: "webp",
    q: "72",
  });
  return `${THUMBNAIL_PROXY}?${params.toString()}`;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(value);
    };
    const timeout = window.setTimeout(() => {
      image.src = "";
      finish(null);
    }, 30000);
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.src = url;
  });
}

async function loadArtworkImage(
  item: Artwork,
  promiseCache: Map<string, Promise<HTMLImageElement | null>>,
): Promise<HTMLImageElement | null> {
  for (const candidate of getMediaCandidates(item)) {
    const proxied = resizedPreviewUrl(candidate);
    let promise = promiseCache.get(proxied);
    if (!promise) {
      promise = loadImage(proxied);
      promiseCache.set(proxied, promise);
    }
    const loaded = await promise;
    if (loaded) return loaded;
  }
  return null;
}

async function preloadArtworkImages(
  items: Artwork[],
  onProgress: (loaded: number, total: number) => void,
): Promise<Map<string, HTMLImageElement>> {
  const loadedImages = new Map<string, HTMLImageElement>();
  const promiseCache = new Map<string, Promise<HTMLImageElement | null>>();
  const uniqueItems = [
    ...new Map(items.map((item) => [itemKey(item), item])).values(),
  ];
  let cursor = 0;
  let complete = 0;
  const workerCount = Math.min(32, Math.max(1, uniqueItems.length));

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < uniqueItems.length) {
      const item = uniqueItems[cursor];
      cursor += 1;
      const image = await loadArtworkImage(item, promiseCache);
      if (image) loadedImages.set(itemKey(item), image);
      complete += 1;
      if (complete % 10 === 0 || complete === uniqueItems.length) {
        onProgress(complete, uniqueItems.length);
      }
    }
  });

  await Promise.all(workers);
  return loadedImages;
}

function itemKey(item: Artwork): string {
  return `${item.collection}|${item.id}|${item.preview || item._imgSrc || ""}`;
}

function hashNumber(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function drawFallback(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  const hue = hashNumber(label) % 360;
  context.fillStyle = `hsl(${hue} 30% 13%)`;
  context.fillRect(x, y, width, height);
  context.save();
  context.globalAlpha = 0.34;
  context.strokeStyle = `hsl(${(hue + 52) % 360} 70% 58%)`;
  context.lineWidth = Math.max(1, width * 0.02);
  const stripe = Math.max(8, width / 6);
  for (let offset = -height; offset < width + height; offset += stripe) {
    context.beginPath();
    context.moveTo(x + offset, y + height);
    context.lineTo(x + offset + height, y);
    context.stroke();
  }
  context.restore();
  if (width > 24 && height > 24) {
    context.fillStyle = "rgba(255,255,255,0.74)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${Math.max(8, Math.min(18, width * 0.13))}px Arial`;
    context.fillText(
      label.slice(0, 2).toUpperCase(),
      x + width / 2,
      y + height / 2,
    );
  }
}

function fitAspectRect(
  aspectRatio: number,
  x: number,
  y: number,
  width: number,
  height: number,
): Rect {
  const boxRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (aspectRatio > boxRatio) drawHeight = width / aspectRatio;
  else drawWidth = height * aspectRatio;
  return {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): Rect {
  const destination = fitAspectRect(
    image.naturalWidth / image.naturalHeight,
    x,
    y,
    width,
    height,
  );
  context.drawImage(
    image,
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
  return destination;
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: Rect,
): Rect {
  const sourceAspect = image.naturalWidth / image.naturalHeight;
  const destinationAspect = rect.width / rect.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (sourceAspect > destinationAspect) {
    sourceWidth = image.naturalHeight * destinationAspect;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / destinationAspect;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
  return rect;
}

function drawArtworkImage(
  context: CanvasRenderingContext2D,
  item: Artwork,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): Rect {
  const crop = item.id === ECLOSION_ID
    ? {
        x: image.naturalWidth * (12 / 512),
        y: image.naturalHeight * (124 / 512),
        width: image.naturalWidth * (488 / 512),
        height: image.naturalHeight * (264 / 512),
      }
    : {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
  const destination = fitAspectRect(
    crop.width / crop.height,
    x,
    y,
    width,
    height,
  );
  context.fillStyle = "#070707";
  context.fillRect(
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
  return destination;
}

function fitFont(
  context: CanvasRenderingContext2D,
  text: string,
  maximumWidth: number,
  startingSize: number,
  minimumSize: number,
  family = "Arial",
): number {
  let size = startingSize;
  while (size > minimumSize) {
    context.font = `700 ${size}px ${family}`;
    if (context.measureText(text).width <= maximumWidth) return size;
    size -= 1;
  }
  return minimumSize;
}

function groupDisplayItems(group: CollectionGroup): Artwork[] {
  if (group.name === "Ma ville en quatre temps") {
    return [
      ...new Map(
        [...group.parents, ...group.works].map((item) => [item.id, item]),
      ).values(),
    ];
  }
  if (TIERED_PARENT_COLLECTIONS.has(group.name)) {
    return [
      ...new Map(
        [...group.parents, ...group.works].map((item) => [item.id, item]),
      ).values(),
    ];
  }
  return [
    ...new Map(
      [...group.parents, ...group.allItems].map((item) => [item.id, item]),
    ).values(),
  ];
}

function preferredGridShape(
  group: CollectionGroup,
  itemCount = groupDisplayItems(group).length,
): { columns: number; rows: number } {
  const overrides: Record<string, [number, number]> = {
    Cypherville: [4, 4],
    "Portrait 2490": [10, 9],
    Miscellaneous: [5, 5],
    Gentlemen: [5, 5],
    Manufactured: [21, 20],
    "BEST BEFORE": [21, 20],
    "Satoshi (Original & Editions)": [12, 10],
    "Minute, papillon! Edition": [5, 5],
    Berlin: [4, 2],
    "Into The Wild": [3, 2],
    Liminality: [4, 2],
    "Ma ville en quatre temps": [2, 2],
    "Tori no Roji": [3, 2],
  };
  const override = overrides[group.name];
  if (override) return { columns: override[0], rows: override[1] };
  if (itemCount === 3) return { columns: 2, rows: 2 };
  if (itemCount === 5) return { columns: 3, rows: 2 };

  let best = {
    columns: Math.max(1, Math.ceil(Math.sqrt(itemCount))),
    rows: Math.max(1, Math.ceil(Math.sqrt(itemCount))),
    score: Number.POSITIVE_INFINITY,
  };
  const maximumColumns = Math.max(1, Math.ceil(Math.sqrt(itemCount) * 1.8));
  for (let columns = 1; columns <= maximumColumns; columns += 1) {
    const rows = Math.ceil(itemCount / columns);
    if (columns < rows) continue;
    const emptyCells = columns * rows - itemCount;
    const aspectPenalty = Math.abs(Math.log(columns / Math.max(1, rows))) * 2;
    const score = emptyCells * 0.35 + aspectPenalty;
    if (score < best.score) best = { columns, rows, score };
  }
  return { columns: best.columns, rows: best.rows };
}

function groupIdealAspect(group: CollectionGroup): number {
  const shape = preferredGridShape(group);
  return Math.max(0.78, Math.min(2.05, shape.columns / shape.rows));
}

function partitionOrdered(
  groups: CollectionGroup[],
  rowCount: number,
): CollectionGroup[][] {
  const rows: CollectionGroup[][] = [];
  let start = 0;
  let remainingWeight = groups.reduce(
    (total, group) => total + groupIdealAspect(group),
    0,
  );

  for (let row = 0; row < rowCount; row += 1) {
    const remainingRows = rowCount - row;
    if (remainingRows === 1) {
      rows.push(groups.slice(start));
      break;
    }
    const target = remainingWeight / remainingRows;
    let currentWeight = 0;
    let end = start;
    while (
      end < groups.length - (remainingRows - 1) &&
      (currentWeight < target || end === start)
    ) {
      currentWeight += groupIdealAspect(groups[end]);
      end += 1;
    }
    rows.push(groups.slice(start, end));
    remainingWeight -= currentWeight;
    start = end;
  }
  return rows;
}

function layoutOrderedRows(
  groups: CollectionGroup[],
  rect: Rect,
  rowCount: number,
  gap: number,
): GroupLayout[] {
  const rows = partitionOrdered(groups, rowCount);
  const rowHeight = (rect.height - gap * (rows.length - 1)) / rows.length;
  return rows.flatMap((rowGroups, rowIndex) => {
    const totalWeight = rowGroups.reduce(
      (total, group) => total + groupIdealAspect(group),
      0,
    );
    const usableWidth = rect.width - gap * Math.max(0, rowGroups.length - 1);
    let cursorX = rect.x;
    return rowGroups.map((group, groupIndex) => {
      const width =
        groupIndex === rowGroups.length - 1
          ? rect.x + rect.width - cursorX
          : (usableWidth * groupIdealAspect(group)) / totalWeight;
      const layout = {
        group,
        rect: {
          x: cursorX,
          y: rect.y + rowIndex * (rowHeight + gap),
          width,
          height: rowHeight,
        },
      };
      cursorX += width + gap;
      return layout;
    });
  });
}

function layoutGrandPeriod(
  groups: CollectionGroup[],
  rect: Rect,
  year: string,
): GroupLayout[] {
  const gap = 18;
  if (year === "2026") {
    const oneOfOnes = groups.find(
      (group) => group.name === "1 of 1s (2026)",
    );
    const intoTheWild = groups.find(
      (group) => group.name === "Into The Wild",
    );
    const liminality = groups.find((group) => group.name === "Liminality");
    if (oneOfOnes && intoTheWild && liminality) {
      const usableHeight = rect.height - gap * 2;
      const oneOfOnesHeight = usableHeight * 0.42;
      const intoTheWildHeight = usableHeight * 0.26;
      const liminalityHeight =
        usableHeight - oneOfOnesHeight - intoTheWildHeight;
      return [
        {
          group: oneOfOnes,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: oneOfOnesHeight,
          },
        },
        {
          group: intoTheWild,
          rect: {
            x: rect.x,
            y: rect.y + oneOfOnesHeight + gap,
            width: rect.width,
            height: intoTheWildHeight,
          },
        },
        {
          group: liminality,
          rect: {
            x: rect.x,
            y:
              rect.y +
              oneOfOnesHeight +
              gap +
              intoTheWildHeight +
              gap,
            width: rect.width,
            height: liminalityHeight,
          },
        },
      ];
    }
  }

  if (year === "2024") {
    const manufactured = groups.find((group) => group.name === "Manufactured");
    const games = groups.find((group) => group.name === "Games");
    const companions = groups.filter(
      (group) => group !== manufactured && group !== games,
    );
    if (manufactured && games) {
      const companionWidth = rect.width * 0.34;
      const focusX = rect.x + companionWidth + gap;
      const focusWidth = rect.width - companionWidth - gap;
      const gamesHeight = rect.height * 0.29;
      return [
        ...layoutOrderedRows(
          companions,
          {
            x: rect.x,
            y: rect.y,
            width: companionWidth,
            height: rect.height,
          },
          3,
          gap,
        ),
        {
          group: manufactured,
          rect: {
            x: focusX,
            y: rect.y,
            width: focusWidth,
            height: rect.height - gamesHeight - gap,
          },
        },
        {
          group: games,
          rect: {
            x: focusX,
            y: rect.y + rect.height - gamesHeight,
            width: focusWidth,
            height: gamesHeight,
          },
        },
      ];
    }
  }

  if (year === "2025") {
    const bestBefore = groups.find((group) => group.name === "BEST BEFORE");
    const companions = groups.filter((group) => group !== bestBefore);
    if (bestBefore) {
      const companionWidth = rect.width * 0.36;
      return [
        ...layoutOrderedRows(
          companions,
          {
            x: rect.x,
            y: rect.y,
            width: companionWidth,
            height: rect.height,
          },
          3,
          gap,
        ),
        {
          group: bestBefore,
          rect: {
            x: rect.x + companionWidth + gap,
            y: rect.y,
            width: rect.width - companionWidth - gap,
            height: rect.height,
          },
        },
      ];
    }
  }

  const rows = year === "2023" || year === "2026" ? 2 : 1;
  return layoutOrderedRows(groups, rect, rows, gap);
}

function parentIdsForGroup(group: CollectionGroup): Set<string> {
  return new Set(group.parents.map((item) => item.id));
}

function isOriginalReference(item: Artwork, group: CollectionGroup): boolean {
  return (
    group.name === "Satoshi (Original & Editions)" &&
    item.id === SATOSHI_ORIGINAL_ID
  );
}

function editionNumberFor(
  items: Artwork[],
  currentIndex: number,
  group: CollectionGroup,
): number | undefined {
  const current = items[currentIndex];
  const parents = parentIdsForGroup(group);
  if (parents.has(current.id) || isOriginalReference(current, group)) {
    return undefined;
  }
  let editionNumber = 0;
  for (let index = 0; index <= currentIndex; index += 1) {
    const item = items[index];
    if (!parents.has(item.id) && !isOriginalReference(item, group)) {
      editionNumber += 1;
    }
  }
  return editionNumber;
}

function collectionCountLabel(group: CollectionGroup): string {
  if (TIERED_PARENT_COLLECTIONS.has(group.name)) {
    return `${group.works.length.toLocaleString()} WORKS · ${
      group.parents.length
    } PARENTS`;
  }
  if (group.name === "Satoshi (Original & Editions)") {
    return `${group.works.length.toLocaleString()} EDITIONS + ORIGINAL`;
  }
  if (PRINT_COLLECTIONS.has(group.name)) {
    return `${group.works.length.toLocaleString()} PRINTS`;
  }
  if (group.name === "Minute, papillon! Edition") {
    return `${group.works.length.toLocaleString()} EDITIONS`;
  }
  if (group.parents.length > 0) {
    return `${group.works.length.toLocaleString()} WORKS · ${group.parents.length} ${
      group.parents.length === 1 ? "PARENT" : "PARENTS"
    }`;
  }
  return `${group.allItems.length.toLocaleString()} ${
    group.allItems.length === 1 ? "WORK" : "WORKS"
  }`;
}

function drawArrowHead(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: "down" | "right",
  color: string,
  size = 8,
) {
  context.fillStyle = color;
  context.beginPath();
  if (direction === "down") {
    context.moveTo(x, y + size);
    context.lineTo(x - size * 0.72, y - size * 0.48);
    context.lineTo(x + size * 0.72, y - size * 0.48);
  } else {
    context.moveTo(x + size, y);
    context.lineTo(x - size * 0.48, y - size * 0.72);
    context.lineTo(x - size * 0.48, y + size * 0.72);
  }
  context.closePath();
  context.fill();
}

function drawDownArrow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  drawArrowHead(context, x, y, "down", color);
}

function drawRightArrow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  drawArrowHead(context, x, y, "right", color);
}

function drawTimelineBranch(
  context: CanvasRenderingContext2D,
  layouts: GroupLayout[],
  y: number,
  color: string,
) {
  if (layouts.length === 0) return;
  const startX = layouts[0].rect.x;
  const endX = layouts[layouts.length - 1].rect.x +
    layouts[layouts.length - 1].rect.width;
  context.strokeStyle = color;
  context.lineWidth = CHRONOLOGY_LINE_WIDTH;
  context.beginPath();
  context.moveTo(startX, y);
  context.lineTo(endX - 20, y);
  context.stroke();
  drawRightArrow(context, endX - 13, y, color);

  layouts.forEach((layout) => {
    const centerX = layout.rect.x + layout.rect.width / 2;
    context.beginPath();
    context.moveTo(centerX, y);
    context.lineTo(centerX, layout.rect.y - 18);
    context.stroke();
    drawDownArrow(context, centerX, layout.rect.y - 14, color);
  });
}

function drawGridFrame(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  context.save();
  context.strokeStyle = "#a8a89f";
  context.lineWidth = Math.max(1.5, Math.min(3, width * 0.025));
  context.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);

  const compact = width < 115;
  const displayLabel = compact
    ? label.startsWith("ORIGINAL")
      ? "ORIGINAL"
      : "PARENT"
    : label;
  const fontSize = Math.max(7, Math.min(12, width * 0.075));
  context.font = `700 ${fontSize}px "Courier New", monospace`;
  const labelWidth = Math.min(
    width - 8,
    context.measureText(displayLabel).width + 12,
  );
  const labelHeight = fontSize + 9;
  const labelX = x + (width - labelWidth) / 2;
  const labelY = y + height - labelHeight - 4;
  context.fillStyle = "rgba(7,7,7,0.92)";
  context.fillRect(labelX, labelY, labelWidth, labelHeight);
  context.fillStyle = "#e9e9e2";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(
    displayLabel,
    x + width / 2,
    labelY + 4,
    labelWidth - 8,
  );
  context.restore();
}

function drawEncryptedArtwork(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillStyle = "#090909";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#30302d";
  context.lineWidth = Math.max(1, Math.min(2, width * 0.018));
  context.strokeRect(x + 4, y + 4, width - 8, height - 8);
  context.fillStyle = "#777770";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${Math.max(8, Math.min(14, width * 0.1))}px "Courier New", monospace`;
  context.fillText("ARTWORK", x + width / 2, y + height / 2 - 8, width - 12);
  context.fillStyle = "#454540";
  context.font = `500 ${Math.max(7, Math.min(11, width * 0.075))}px "Courier New", monospace`;
  context.fillText("ENCRYPTED", x + width / 2, y + height / 2 + 12, width - 12);
}

function drawArtworkNumber(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  editionNumber: number,
) {
  const label = String(editionNumber).padStart(2, "0");
  const labelWidth = Math.min(width, Math.max(20, label.length * 8 + 8));
  context.fillStyle = "rgba(0,0,0,0.72)";
  context.fillRect(x + width - labelWidth, y + height - 18, labelWidth, 18);
  context.fillStyle = "rgba(255,255,255,0.78)";
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.font = '700 10px "Courier New", monospace';
  context.fillText(label, x + width - 4, y + height - 4);
}

function gridBadgeFor(item: Artwork, group: CollectionGroup): string | undefined {
  if (parentIdsForGroup(group).has(item.id)) return "COLLECTION PARENT";
  if (isOriginalReference(item, group)) return undefined;
  return undefined;
}

function drawPeriodBranch(
  context: CanvasRenderingContext2D,
  period: (typeof GRAND_PERIODS)[number],
  layouts: GroupLayout[],
  trunkY: number,
) {
  const anchorX = period.rect.x + period.rect.width / 2;
  const branchY = period.rect.y - 34;
  context.strokeStyle = CHRONOLOGY_STROKE;
  context.lineWidth = CHRONOLOGY_LINE_WIDTH;
  context.beginPath();
  context.moveTo(anchorX, trunkY);
  context.lineTo(anchorX, branchY);
  context.stroke();

  context.beginPath();
  context.moveTo(period.rect.x + 10, branchY);
  context.lineTo(period.rect.x + period.rect.width - 10, branchY);
  context.stroke();

  drawDownArrow(context, anchorX, branchY - 18, CHRONOLOGY_STROKE);

  const topCards = layouts.filter(
    (layout) => Math.abs(layout.rect.y - period.rect.y) < 3,
  );
  topCards.forEach((layout) => {
    const centerX = layout.rect.x + layout.rect.width / 2;
    context.beginPath();
    context.moveTo(centerX, branchY);
    context.lineTo(centerX, layout.rect.y - 18);
    context.stroke();
    drawDownArrow(
      context,
      centerX,
      layout.rect.y - 14,
      CHRONOLOGY_STROKE,
    );
  });
}

function collectionDateValue(group: CollectionGroup): Date | null {
  const override = COLLECTION_DATE_OVERRIDES[group.name];
  if (override) {
    const date = new Date(override);
    if (!Number.isNaN(date.valueOf())) return date;
  }

  const dates = [...group.parents, ...group.allItems]
    .map((item) => String(item.timestamp || ""))
    .filter((timestamp) => /^\d{4}-\d{2}-\d{2}/.test(timestamp))
    .map((timestamp) =>
      new Date(timestamp.replace(" UTC", "Z").replace(" ", "T")),
    )
    .filter((date) => !Number.isNaN(date.valueOf()))
    .sort((left, right) => left.valueOf() - right.valueOf());
  return dates[0] || null;
}

function groupDateLabel(group: CollectionGroup): string {
  const date = collectionDateValue(group);
  if (!date) return group.year;
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ")
    .toUpperCase();
}

function cardHeaderHeight(rect: Rect): number {
  return Math.max(70, Math.min(100, rect.height * 0.16));
}

function drawCardBackground(
  context: CanvasRenderingContext2D,
  rect: Rect,
  headerHeight: number,
) {
  context.fillStyle = "#0c0c0b";
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.fillStyle = "#121210";
  context.fillRect(rect.x, rect.y, rect.width, headerHeight);
}

function drawCardBorder(context: CanvasRenderingContext2D, rect: Rect) {
  context.strokeStyle = "#242420";
  context.lineWidth = 2;
  context.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

function drawCardHeader(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  rect: Rect,
  headerHeight: number,
) {
  const title =
    group.name === "Eclosion"
      ? "ECLOSION (AMSTERDAM BLOOMS)"
      : group.name.toUpperCase();
  const innerWidth = Math.max(24, rect.width - 22);
  context.fillStyle = "#f0f0eb";
  context.textAlign = "left";
  context.textBaseline = "middle";
  const titleSize = fitFont(
    context,
    title,
    innerWidth,
    Math.min(24, headerHeight * 0.31),
    6,
  );
  context.font = `700 ${titleSize}px Arial`;
  context.fillText(title, rect.x + 11, rect.y + headerHeight * 0.31);

  const date = groupDateLabel(group);
  const count = collectionCountLabel(group);
  const dateWidth = Math.max(20, innerWidth * 0.58);
  const countWidth = Math.max(20, innerWidth - dateWidth - 8);
  const dateSize = fitFont(
    context,
    date,
    dateWidth,
    Math.min(18, headerHeight * 0.23),
    7,
    '"Courier New", monospace',
  );
  context.fillStyle = "#f0f0eb";
  context.font = `700 ${dateSize}px "Courier New", monospace`;
  context.fillText(date, rect.x + 11, rect.y + headerHeight * 0.72);

  const countSize = fitFont(
    context,
    count,
    countWidth,
    Math.min(12, headerHeight * 0.16),
    6,
    '"Courier New", monospace',
  );
  context.fillStyle = "#94948d";
  context.font = `700 ${countSize}px "Courier New", monospace`;
  context.textAlign = "right";
  context.fillText(
    count,
    rect.x + rect.width - 11,
    rect.y + headerHeight * 0.72,
  );
}

function cardBody(rect: Rect, headerHeight: number): Rect {
  return {
    x: rect.x + 8,
    y: rect.y + headerHeight + 8,
    width: rect.width - 16,
    height: rect.height - headerHeight - 16,
  };
}

function drawGrandPeriodLabel(
  context: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  width: number,
) {
  const boxWidth = Math.min(width - 40, Math.max(240, label.length * 33));
  context.fillStyle = "#090b08";
  context.fillRect(centerX - boxWidth / 2, 1690, boxWidth, 98);
  context.fillStyle = CHRONOLOGY_TEXT;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${TIMELINE_DATE_FONT_SIZE}px "Courier New", monospace`;
  context.fillText(label, centerX, 1738, boxWidth - 22);
}

function displayCellCount(groups: CollectionGroup[]): number {
  return groups.reduce(
    (total, group) => total + groupDisplayItems(group).length,
    0,
  );
}

function drawRootFrame(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  context.strokeStyle = "#a8a89f";
  context.lineWidth = 3;
  context.strokeRect(x, y, size, size);
}

function drawPreBranchLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
) {
  context.font = `700 ${TIMELINE_DATE_FONT_SIZE}px "Courier New", monospace`;
  const labelWidth = context.measureText(label).width + 24;
  context.fillStyle = "#090a0b";
  context.fillRect(x, y - 29, labelWidth, 58);
  context.fillStyle = CHRONOLOGY_TEXT;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(label, x + 10, y);
}

function drawRootConnection(
  context: CanvasRenderingContext2D,
  rootX: number,
  rootY: number,
  rootSize: number,
  trunkY: number,
) {
  const centerX = rootX + rootSize / 2;
  context.strokeStyle = ROOT_CHRONOLOGY_STROKE;
  context.lineWidth = ROOT_CHRONOLOGY_LINE_WIDTH;
  context.beginPath();
  context.moveTo(centerX, rootY + rootSize);
  context.lineTo(centerX, trunkY);
  context.lineTo(7450, trunkY);
  context.stroke();

  [
    PRE_ERA_HEADER_Y - PRE_ERA_HEADER_SIZE * ERA_HEADER_OPTICAL_CENTER,
    GRAND_ERA_HEADER_Y - GRAND_ERA_HEADER_SIZE * ERA_HEADER_OPTICAL_CENTER,
  ].forEach((sectionY) => {
    context.beginPath();
    context.moveTo(centerX, sectionY);
    context.lineTo(318, sectionY);
    context.stroke();
    drawRightArrow(context, 326, sectionY, CHRONOLOGY_STROKE);
  });

  drawRightArrow(context, 7458, trunkY, ROOT_CHRONOLOGY_STROKE);
}

function drawRootImage(
  context: CanvasRenderingContext2D,
  gentleman: Artwork | undefined,
  images: Map<string, HTMLImageElement>,
  rootX: number,
  rootY: number,
  rootSize: number,
) {
  context.fillStyle = "#0e0e0d";
  context.fillRect(rootX, rootY, rootSize, rootSize);
  if (gentleman) {
    const rootImage = images.get(itemKey(gentleman));
    if (rootImage) {
      drawContainedImage(context, rootImage, rootX, rootY, rootSize, rootSize);
    } else {
      drawFallback(context, rootX, rootY, rootSize, rootSize, gentleman.name);
    }
  }
  drawRootFrame(context, rootX, rootY, rootSize);
  context.fillStyle = "#f1f1ed";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = '700 36px "Courier New", monospace';
  context.fillText("GENTLEMAN Nº1", 520, 310);
  context.fillStyle = "#94948d";
  context.font = '700 24px "Courier New", monospace';
  context.fillText("INSCRIPTION #329,714", 520, 354);
}

function drawCollectionGrid(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  images: Map<string, HTMLImageElement>,
  rect: Rect,
) {
  const items = groupDisplayItems(group);
  if (items.length === 0) {
    context.fillStyle = "#080808";
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    return;
  }

  if (
    TIERED_PARENT_COLLECTIONS.has(group.name) &&
    drawTieredParentGrid(context, group, images, rect)
  ) {
    return;
  }

  if (
    group.name === "Orphelinat" &&
    drawOrphelinatGrid(context, items, images, rect)
  ) {
    return;
  }

  if (
    group.name === "Ma ville en quatre temps" &&
    drawMaVilleGrid(context, group, images, rect)
  ) {
    return;
  }

  if (
    group.name === "Unregulated Minds" &&
    drawUnregulatedMindsGrid(context, group, items, images, rect)
  ) {
    return;
  }

  if (
    group.name === "Liminality" &&
    drawLiminalityGrid(context, group, items, images, rect)
  ) {
    return;
  }

  if (
    items.length === 3 &&
    drawThreeItemGrid(context, group, items, images, rect)
  ) {
    return;
  }

  const shape = preferredGridShape(group, items.length);
  const columns = shape.columns;
  const rows = shape.rows;
  const estimatedCell = Math.min(rect.width / columns, rect.height / rows);
  const gap = estimatedCell > 82 ? 5 : estimatedCell > 38 ? 3 : 1.5;
  const cellWidth = (rect.width - gap * (columns - 1)) / columns;
  const cellHeight = (rect.height - gap * (rows - 1)) / rows;
  const gridWidth = columns * cellWidth + gap * (columns - 1);
  const gridHeight = rows * cellHeight + gap * (rows - 1);
  const originX = rect.x + (rect.width - gridWidth) / 2;
  const originY = rect.y + (rect.height - gridHeight) / 2;
  const showEditionIndex = showsEditionNumbers(group);

  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const rowItemCount = Math.min(columns, items.length - row * columns);
    const rowWidth =
      rowItemCount * cellWidth + gap * Math.max(0, rowItemCount - 1);
    const rowOffset =
      rowItemCount < columns
        ? (gridWidth - rowWidth) / 2
        : 0;
    const x = originX + rowOffset + column * (cellWidth + gap);
    const y = originY + row * (cellHeight + gap);
    const editionNumber = editionNumberFor(items, index, group);
    drawArtworkTile(
      context,
      item,
      images.get(itemKey(item)),
      x,
      y,
      cellWidth,
      cellHeight,
      showEditionIndex ? editionNumber : undefined,
      gridBadgeFor(item, group),
    );
  });
}

function showsEditionNumbers(group: CollectionGroup): boolean {
  if (group.name === "Satoshi (Original & Editions)") return false;
  return (
    PRINT_COLLECTIONS.has(group.name) ||
    group.name === "Minute, papillon! Edition" ||
    group.name === "Manufactured" ||
    group.name === "BEST BEFORE"
  );
}

function drawTieredParentGrid(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  images: Map<string, HTMLImageElement>,
  rect: Rect,
): boolean {
  if (group.parents.length === 0 || group.works.length !== 420) return false;

  const parentGap = Math.max(10, Math.min(22, rect.width * 0.014));
  const parentSize = Math.min(
    180,
    rect.height * 0.15,
    (rect.width - parentGap * (group.parents.length - 1)) /
      group.parents.length,
  );
  const parentRowWidth =
    parentSize * group.parents.length +
    parentGap * (group.parents.length - 1);
  const parentOriginX = rect.x + (rect.width - parentRowWidth) / 2;

  group.parents.forEach((parent, index) => {
    drawArtworkTile(
      context,
      parent,
      images.get(itemKey(parent)),
      parentOriginX + index * (parentSize + parentGap),
      rect.y,
      parentSize,
      parentSize,
      undefined,
      "COLLECTION PARENT",
    );
  });

  const tierGap = Math.max(10, Math.min(20, rect.height * 0.018));
  const workRect: Rect = {
    x: rect.x,
    y: rect.y + parentSize + tierGap,
    width: rect.width,
    height: rect.height - parentSize - tierGap,
  };
  const columns = 21;
  const rows = 20;
  const estimatedCell = Math.min(
    workRect.width / columns,
    workRect.height / rows,
  );
  const gap = estimatedCell > 38 ? 3 : 1.5;
  const cellWidth = (workRect.width - gap * (columns - 1)) / columns;
  const cellHeight = (workRect.height - gap * (rows - 1)) / rows;

  group.works.forEach((work, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawArtworkTile(
      context,
      work,
      images.get(itemKey(work)),
      workRect.x + column * (cellWidth + gap),
      workRect.y + row * (cellHeight + gap),
      cellWidth,
      cellHeight,
      index + 1,
    );
  });
  return true;
}

function drawLiminalityGrid(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  items: Artwork[],
  images: Map<string, HTMLImageElement>,
  rect: Rect,
): boolean {
  if (items.length !== 8) return false;

  const columns = 4;
  const rows = 2;
  const gapX = Math.max(5, Math.min(10, rect.width * 0.012));
  const gapY = Math.max(10, Math.min(18, rect.height * 0.025));
  const cellWidth = (rect.width - gapX * (columns - 1)) / columns;
  const cellHeight = Math.min(
    (rect.height - gapY) / rows,
    cellWidth / 1.55,
  );
  const gridHeight = cellHeight * rows + gapY;
  const originY = rect.y + (rect.height - gridHeight) / 2;

  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawArtworkTile(
      context,
      item,
      images.get(itemKey(item)),
      rect.x + column * (cellWidth + gapX),
      originY + row * (cellHeight + gapY),
      cellWidth,
      cellHeight,
      undefined,
      gridBadgeFor(item, group),
    );
  });
  return true;
}

function drawThreeItemGrid(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  items: Artwork[],
  images: Map<string, HTMLImageElement>,
  rect: Rect,
): boolean {
  if (items.length !== 3) return false;

  const insetX = rect.width * 0.07;
  const insetY = rect.height * 0.07;
  const innerWidth = rect.width - insetX * 2;
  const innerHeight = rect.height - insetY * 2;
  const gapX = Math.max(12, Math.min(24, rect.width * 0.045));
  const gapY = Math.max(10, Math.min(20, rect.height * 0.055));
  const cellWidth = (innerWidth - gapX) / 2;
  const cellHeight = Math.min(
    (innerHeight - gapY) / 2,
    cellWidth * 0.95,
  );
  const compactGridHeight = cellHeight * 2 + gapY;
  const originY = rect.y + (rect.height - compactGridHeight) / 2;
  const positions = [
    { x: rect.x + insetX, y: originY },
    { x: rect.x + insetX + cellWidth + gapX, y: originY },
    {
      x: rect.x + (rect.width - cellWidth) / 2,
      y: originY + cellHeight + gapY,
    },
  ];

  items.forEach((item, index) => {
    const position = positions[index];
    drawArtworkTile(
      context,
      item,
      images.get(itemKey(item)),
      position.x,
      position.y,
      cellWidth,
      cellHeight,
      undefined,
      gridBadgeFor(item, group),
    );
  });
  return true;
}

function drawUnregulatedMindsGrid(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  items: Artwork[],
  images: Map<string, HTMLImageElement>,
  rect: Rect,
): boolean {
  if (items.length !== 7) return false;

  const rowCounts = [3, 2, 2];
  const gap = Math.max(6, Math.min(13, rect.width * 0.035));
  const cellWidth = (rect.width - gap * 2) / 3;
  const cellHeight = (rect.height - gap * 2) / 3;
  let itemIndex = 0;

  rowCounts.forEach((rowItemCount, row) => {
    const rowWidth =
      rowItemCount * cellWidth + gap * Math.max(0, rowItemCount - 1);
    const rowX = rect.x + (rect.width - rowWidth) / 2;
    for (let column = 0; column < rowItemCount; column += 1) {
      const item = items[itemIndex];
      drawArtworkTile(
        context,
        item,
        images.get(itemKey(item)),
        rowX + column * (cellWidth + gap),
        rect.y + row * (cellHeight + gap),
        cellWidth,
        cellHeight,
        undefined,
        gridBadgeFor(item, group),
      );
      itemIndex += 1;
    }
  });
  return true;
}

function drawMaVilleGrid(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  images: Map<string, HTMLImageElement>,
  rect: Rect,
): boolean {
  const parent = group.parents[0];
  const works = group.works;
  if (!parent || works.length !== 4) return false;

  const parentBandHeight = rect.height * 0.18;
  const tierGap = Math.max(7, Math.min(13, rect.height * 0.025));
  const parentSlotWidth = Math.min(
    rect.width * 0.25,
    parentBandHeight * 1.85,
  );
  const parentSlotHeight = parentBandHeight * 0.92;
  drawArtworkTile(
    context,
    parent,
    images.get(itemKey(parent)),
    rect.x + (rect.width - parentSlotWidth) / 2,
    rect.y,
    parentSlotWidth,
    parentSlotHeight,
    undefined,
    gridBadgeFor(parent, group),
  );

  const worksRect = {
    x: rect.x,
    y: rect.y + parentBandHeight + tierGap,
    width: rect.width,
    height: rect.height - parentBandHeight - tierGap,
  };
  const insetX = worksRect.width * 0.035;
  const insetY = worksRect.height * 0.035;
  const gapX = Math.max(12, Math.min(24, worksRect.width * 0.035));
  const gapY = Math.max(10, Math.min(20, worksRect.height * 0.055));
  const cellWidth = (worksRect.width - insetX * 2 - gapX) / 2;
  const cellHeight = (worksRect.height - insetY * 2 - gapY) / 2;

  works.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawArtworkTile(
      context,
      item,
      images.get(itemKey(item)),
      worksRect.x + insetX + column * (cellWidth + gapX),
      worksRect.y + insetY + row * (cellHeight + gapY),
      cellWidth,
      cellHeight,
    );
  });
  return true;
}

function drawOrphelinatGrid(
  context: CanvasRenderingContext2D,
  items: Artwork[],
  images: Map<string, HTMLImageElement>,
  rect: Rect,
): boolean {
  const hosoi = items.find((item) => item.id === HOSOI_ID);
  if (!hosoi) return false;

  const others = items.filter((item) => item.id !== HOSOI_ID);
  const gap = Math.max(7, Math.min(13, rect.width * 0.018));
  const heroWidth = rect.width * 0.48;
  const companionWidth = rect.width - heroWidth - gap;
  const companionInsetX = companionWidth * 0.07;
  const companionInsetY = rect.height * 0.11;
  const companionInnerWidth = companionWidth - companionInsetX * 2;
  const companionInnerHeight = rect.height - companionInsetY * 2;
  const rowHeight = (companionInnerHeight - gap) / 2;
  const topItems = others.slice(0, 3);
  const bottomItems = others.slice(3);

  [topItems, bottomItems].forEach((rowItems, rowIndex) => {
    const cellWidth =
      (companionInnerWidth - gap * 2) / 3;
    const rowWidth =
      rowItems.length * cellWidth + gap * Math.max(0, rowItems.length - 1);
    const rowOffset = (companionInnerWidth - rowWidth) / 2;
    rowItems.forEach((item, column) => {
      const itemX =
        rect.x +
        companionInsetX +
        rowOffset +
        column * (cellWidth + gap);
      const itemWidth =
        item.id === COMME_DU_BONBON_ID
          ? rect.x + companionInsetX + companionInnerWidth - itemX
          : cellWidth;
      drawArtworkTile(
        context,
        item,
        images.get(itemKey(item)),
        itemX,
        rect.y +
          companionInsetY +
          rowIndex * (rowHeight + gap),
        itemWidth,
        rowHeight,
      );
    });
  });

  const heroInsetY = rect.height * 0.035;
  const heroInsetX = Math.max(10, Math.min(14, rect.width * 0.025));
  const heroSlot = fitAspectRect(
    16 / 9,
    rect.x + companionWidth + gap + heroInsetX,
    rect.y + heroInsetY,
    heroWidth - heroInsetX * 2,
    rect.height - heroInsetY * 2,
  );
  const hosoiImage = images.get(itemKey(hosoi));
  if (hosoiImage) {
    drawCoverImage(context, hosoiImage, heroSlot);
  } else {
    drawFallback(
      context,
      heroSlot.x,
      heroSlot.y,
      heroSlot.width,
      heroSlot.height,
      hosoi.name,
    );
  }
  context.save();
  context.strokeStyle = "rgba(208,208,202,0.58)";
  context.lineWidth = 2;
  context.strokeRect(
    heroSlot.x - 5,
    heroSlot.y - 5,
    heroSlot.width + 10,
    heroSlot.height + 10,
  );
  context.restore();
  return true;
}

function drawArtworkTile(
  context: CanvasRenderingContext2D,
  item: Artwork,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  editionNumber?: number,
  badge?: string,
): Rect {
  let artworkRect: Rect;
  if (ENCRYPTED_ARTWORK_IDS.has(item.id)) {
    artworkRect = fitAspectRect(1, x, y, width, height);
    drawEncryptedArtwork(
      context,
      artworkRect.x,
      artworkRect.y,
      artworkRect.width,
      artworkRect.height,
    );
  } else if (image) {
    artworkRect = drawArtworkImage(context, item, image, x, y, width, height);
  } else {
    artworkRect = fitAspectRect(1, x, y, width, height);
    drawFallback(
      context,
      artworkRect.x,
      artworkRect.y,
      artworkRect.width,
      artworkRect.height,
      item.name,
    );
  }

  if (
    editionNumber !== undefined &&
    artworkRect.width >= 26 &&
    artworkRect.height >= 22
  ) {
    drawArtworkNumber(
      context,
      artworkRect.x,
      artworkRect.y,
      artworkRect.width,
      artworkRect.height,
      editionNumber,
    );
  }
  if (badge) {
    drawGridFrame(
      context,
      artworkRect.x,
      artworkRect.y,
      artworkRect.width,
      artworkRect.height,
      badge,
    );
  }
  return artworkRect;
}

function drawCollectionCard(
  context: CanvasRenderingContext2D,
  group: CollectionGroup,
  images: Map<string, HTMLImageElement>,
  rect: Rect,
) {
  const headerHeight = cardHeaderHeight(rect);

  context.save();
  context.beginPath();
  context.rect(rect.x, rect.y, rect.width, rect.height);
  context.clip();

  drawCardBackground(context, rect, headerHeight);
  drawCardHeader(context, group, rect, headerHeight);
  drawCollectionGrid(context, group, images, cardBody(rect, headerHeight));

  context.restore();
  drawCardBorder(context, rect);
}

function drawEraHeader(
  context: CanvasRenderingContext2D,
  title: string,
  y: number,
  accent: string,
  x = 210,
  fontSize = 46,
) {
  context.fillStyle = accent;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `700 ${fontSize}px "Courier New", monospace`;
  context.fillText(title, x, y);
}

function drawPreParentEra(
  context: CanvasRenderingContext2D,
  groups: CollectionGroup[],
  images: Map<string, HTMLImageElement>,
) {
  const preGroups = PRE_PARENT_COLLECTIONS.map((name) =>
    groups.find((group) => group.name === name),
  ).filter(Boolean) as CollectionGroup[];
  const layouts = layoutOrderedRows(
    preGroups,
    { x: 340, y: 630, width: 7130, height: 780 },
    2,
    58,
  );

  context.fillStyle = "#090a0b";
  context.fillRect(180, 480, 7320, 950);
  drawEraHeader(
    context,
    "PRE-PARENT-CHILD ERA",
    PRE_ERA_HEADER_Y,
    CHRONOLOGY_TEXT,
    340,
    PRE_ERA_HEADER_SIZE,
  );

  const rowYs = [...new Set(layouts.map((layout) => layout.rect.y))];
  rowYs.forEach((rowY, rowIndex) => {
    const rowLayouts = layouts.filter((layout) => layout.rect.y === rowY);
    drawTimelineBranch(context, rowLayouts, rowY - 28, CHRONOLOGY_STROKE);
    if (rowIndex === 0) {
      drawPreBranchLabel(context, "2023", rowLayouts[0].rect.x + 8, rowY - 28);
    }
  });

  layouts.forEach((layout) =>
    drawCollectionCard(
      context,
      layout.group,
      images,
      layout.rect,
    ),
  );

}

function drawGrandParentEra(
  context: CanvasRenderingContext2D,
  groups: CollectionGroup[],
  images: Map<string, HTMLImageElement>,
) {
  context.fillStyle = "#090b08";
  context.fillRect(180, 1460, 7320, 2700);

  drawEraHeader(
    context,
    "GRAND-PARENT-CHILD PROVENANCE",
    GRAND_ERA_HEADER_Y,
    CHRONOLOGY_TEXT,
    340,
    GRAND_ERA_HEADER_SIZE,
  );

  const trunkY = 1655;
  drawRootConnection(context, ROOT_X, ROOT_Y, ROOT_SIZE, trunkY);

  GRAND_PERIODS.forEach((period) => {
    const periodGroups = period.names.map((name) =>
      groups.find((group) => group.name === name),
    ).filter(Boolean) as CollectionGroup[];
    const centerX = period.rect.x + period.rect.width / 2;
    const layouts = layoutGrandPeriod(periodGroups, period.rect, period.year);
    drawPeriodBranch(context, period, layouts, trunkY);
    drawGrandPeriodLabel(context, period.label, centerX, period.rect.width);
    layouts.forEach((layout) =>
      drawCollectionCard(
        context,
        layout.group,
        images,
        layout.rect,
      ),
    );
  });
}

function drawPoster(
  canvas: HTMLCanvasElement,
  groups: CollectionGroup[],
  images: Map<string, HTMLImageElement>,
) {
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;

  context.fillStyle = "#070707";
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.save();
  context.translate(POSTER_CONTENT_OFFSET_X, POSTER_CONTENT_OFFSET_Y);
  context.scale(POSTER_CONTENT_SCALE, POSTER_CONTENT_SCALE);

  context.save();
  context.globalAlpha = 0.2;
  context.strokeStyle = "#20201d";
  context.lineWidth = 1;
  for (let x = 210; x <= POSTER_WIDTH - 210; x += 210) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, POSTER_HEIGHT);
    context.stroke();
  }
  context.restore();

  context.fillStyle = "#f1f1ed";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = "800 84px Arial";
  context.fillText("LEMONHAZE.com", 520, 120);
  context.fillStyle = "#92928b";
  context.font = '500 25px "Courier New", monospace';
  context.fillText(
    "COMPLETE ORDINALS CHRONOLOGY · FEB 2023 → JUL 2026",
    524,
    171,
  );

  drawPreParentEra(context, groups, images);
  drawGrandParentEra(context, groups, images);

  const gentleman = groups
    .flatMap((group) => group.allItems)
    .find((item) => item.id === GENTLEMAN_ONE_ID);
  drawRootImage(context, gentleman, images, ROOT_X, ROOT_Y, ROOT_SIZE);
  context.restore();
}

export default function TimelineVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Reading the live chronology…");
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setReady(false);
      setStatus("Reading the live chronology…");
      try {
        const artworks = await loadCatalogue();
        if (cancelled) return;
        const groups = buildGroups(artworks);
        const renderItems = groups.flatMap(groupDisplayItems);
        const gentleman = groups
          .flatMap((group) => group.allItems)
          .find((item) => item.id === GENTLEMAN_ONE_ID);
        if (
          gentleman &&
          !renderItems.some(
            (item) =>
              itemKey(item) === itemKey(gentleman),
          )
        ) {
          renderItems.push(gentleman);
        }

        const images = await preloadArtworkImages(
          renderItems,
          (loaded, total) => {
            if (!cancelled) {
              setStatus(`Loading every thumbnail ${loaded}/${total}…`);
            }
          },
        );
        if (cancelled || !canvasRef.current) return;

        drawPoster(canvasRef.current, groups, images);
        setStatus(`Ready · ${displayCellCount(groups).toLocaleString()} cells`);
        setReady(true);
      } catch (error) {
        if (!cancelled) {
          setStatus(
            error instanceof Error
              ? error.message
              : "The live catalogue could not be rendered.",
          );
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [revision]);

  const exportPoster = useCallback(() => {
    if (!ready || !canvasRef.current || exporting) return;
    setExporting(true);
    setStatus("Encoding 8K PNG…");
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          setStatus("The PNG could not be encoded. Please try again.");
          setExporting(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `lemonhaze-complete-chronology-${new Date()
          .toISOString()
          .slice(0, 10)}-8k.png`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus("Saved");
        setExporting(false);
      },
      "image/png",
      1,
    );
  }, [exporting, ready]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "s" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        exportPoster();
      }
      if (
        event.key.toLowerCase() === "r" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setRevision((value) => value + 1);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [exportPoster]);

  return (
    <main className="visualizer-shell">
      <button
        type="button"
        className="visualizer-close"
        aria-label="Close visualizer and return to Lemonhaze"
        onClick={() => window.location.assign("/")}
      >
        ×
      </button>
      <section className="poster-stage" aria-busy={!ready}>
        <div className="poster-frame">
          <canvas
            ref={canvasRef}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
            aria-label="Complete Lemonhaze provenance tree showing every work from 2023 through 2026"
          />
          {!ready && (
            <div className="loading-panel" role="status">
              <span className="loading-pulse" />
              <strong>Building the complete 8K tree</strong>
              <small>{status}</small>
            </div>
          )}
        </div>
      </section>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </main>
  );
}
