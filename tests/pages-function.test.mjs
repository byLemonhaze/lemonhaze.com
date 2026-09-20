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

test("/supply preserves a missing static page as 404", async () => {
  const { context, calls } = createContext("/supply", {
    nextResponse: new Response("Not found", { status: 404 }),
  });
  const response = await onRequest(context);
  assert.equal(response.status, 404);
  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 0);
});

test("/supply/ preserves a missing static page as 404", async () => {
  const { context, calls } = createContext("/supply/", {
    nextResponse: new Response("Not found", { status: 404 }),
  });
  const response = await onRequest(context);
  assert.equal(response.status, 404);
  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 0);
});

test("/about preserves a missing static page as 404", async () => {
  const { context, calls } = createContext("/about", {
    nextResponse: new Response("Not found", { status: 404 }),
  });
  const response = await onRequest(context);
  assert.equal(response.status, 404);
  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 0);
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

test("/lab/design-bank redirects to /lab", async () => {
  const { context, calls } = createContext("/lab/design-bank", {
    nextResponse: new Response("<title>Design Bank — Lemonhaze</title>", {
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
  assert.equal(response.headers.get("location"), "https://lemonhaze.com/lab");
});

test("/best-before preserves a missing static page as 404", async () => {
  const { context, calls } = createContext("/best-before", {
    nextResponse: new Response("Not found", { status: 404 }),
  });
  const response = await onRequest(context);
  assert.equal(response.status, 404);
  assert.equal(calls.next, 1);
  assert.equal(calls.assets.length, 0);
});

test('old Market Watch links resolve directly to its embedded Supply section', async () => {
  for (const path of ['/market-watch', '/market-watch/', '/market-watch/index.html']) {
    const {context,calls}=createContext(path+'?ref=bookmark',{nextResponse:new Response('Old standalone page')});
    const response=await onRequest(context);
    assert.equal(response.status,307);
    assert.equal(response.headers.get('location'),'https://lemonhaze.com/supply?ref=bookmark#market-watch');
    assert.equal(calls.next,0);
  }
});
