import test from "node:test";
import assert from "node:assert/strict";

import { onRequest } from "../functions/[[path]].ts";

function createContext(pathname, { nextResponse, assetResponse, assetResponses = null }) {
  const request = new Request(`https://lemonhaze.com${pathname}`);
  const calls = {
    next: 0,
    assets: [],
  };

  return {
    context: {
      request,
      env: {
        ASSETS: {
          fetch(requestLike) {
            calls.assets.push(String(requestLike instanceof Request ? requestLike.url : requestLike));
            if (assetResponses) {
              const response = assetResponses[Math.min(calls.assets.length - 1, assetResponses.length - 1)];
              return Promise.resolve(response);
            }
            return Promise.resolve(assetResponse);
          },
        },
      },
      next() {
        calls.next += 1;
        return Promise.resolve(nextResponse);
      },
    },
    calls,
  };
}

async function responseText(response) {
  return await response.text();
}

test("/supply uses the SPA fallback so refreshing preserves the in-app section route", async () => {
  const { context, calls } = createContext("/supply", {
    nextResponse: new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),
    assetResponse: new Response("<title>Lemonhaze</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  });

  const response = await onRequest(context);
  const text = await responseText(response);

  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 1);
  assert.match(text, /<title>Lemonhaze<\/title>/);
});

test("/supply/ still uses the 404 SPA fallback", async () => {
  const { context, calls } = createContext("/supply/", {
    nextResponse: new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),
    assetResponse: new Response("<title>Lemonhaze</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  });

  const response = await onRequest(context);
  const text = await responseText(response);

  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 1);
  assert.match(text, /<title>Lemonhaze<\/title>/);
});

test("/about still uses the 404 SPA fallback", async () => {
  const { context, calls } = createContext("/about", {
    nextResponse: new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),
    assetResponse: new Response("<title>Lemonhaze</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  });

  const response = await onRequest(context);
  const text = await responseText(response);

  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 1);
  assert.match(text, /<title>Lemonhaze<\/title>/);
});

test("/marketplace redirects to /supply", async () => {
  const { context, calls } = createContext("/marketplace", {
    nextResponse: new Response("<title>Marketplace | Lemonhaze</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    assetResponse: new Response("<title>Lemonhaze</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  });

  const response = await onRequest(context);

  assert.equal(calls.next, 0);
  assert.equal(calls.assets.length, 0);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://lemonhaze.com/supply");
});

test("/best-before still falls through and uses the 404 SPA fallback", async () => {
  const { context, calls } = createContext("/best-before", {
    nextResponse: new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),
    assetResponse: new Response("<title>Lemonhaze</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  });

  const response = await onRequest(context);
  const text = await responseText(response);

  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 1);
  assert.match(text, /<title>Lemonhaze<\/title>/);
});
