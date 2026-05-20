/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache, PAGES_CACHE_NAME } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import {
  CacheFirst,
  ExpirationPlugin,
  Serwist,
  Strategy,
  type StrategyHandler,
} from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const OPERATOR_DOCUMENT_PATHS = ["/", "/park", "/pickup", "/pin", "/check-ticket"] as const

const PAGE_CACHE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

/** Avoid `no-response` rejections when the connectivity probe runs offline. */
class OfflineAwarePing extends Strategy {
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    try {
      return await handler.fetch(request)
    } catch {
      return new Response(null, {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      })
    }
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting()
  }
})

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? []), ...OPERATOR_DOCUMENT_PATHS],
  precacheOptions: {
    navigateFallback: "/",
    navigateFallbackDenylist: [/^\/api\//, /^\/_next\//, /^\/sw\.js$/],
    ignoreURLParametersMatching: [/^_rsc$/],
  },
  runtimeCaching: [
    {
      matcher: ({ url: { pathname }, sameOrigin }) => sameOrigin && pathname === "/api/ping",
      handler: new OfflineAwarePing(),
    },
    {
      matcher: /\/_next\/static.+\.wasm$/i,
      handler: new CacheFirst({
        cacheName: "next-static-wasm-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 8,
            maxAgeSeconds: PAGE_CACHE_MAX_AGE_SECONDS,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }) =>
        request.mode === "navigate" && sameOrigin && !pathname.startsWith("/api/"),
      handler: new CacheFirst({
        cacheName: PAGES_CACHE_NAME.html,
        matchOptions: { ignoreSearch: true },
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: PAGE_CACHE_MAX_AGE_SECONDS,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }) =>
        request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"),
      handler: new CacheFirst({
        cacheName: PAGES_CACHE_NAME.rsc,
        matchOptions: { ignoreSearch: true },
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: PAGE_CACHE_MAX_AGE_SECONDS,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
