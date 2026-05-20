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

const OPERATOR_PAGE_CACHE = "bikepark-operator-pages"

const OPERATOR_PATH_SET = new Set<string>(OPERATOR_DOCUMENT_PATHS)

const PAGE_CACHE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

function isOperatorDocumentPath(pathname: string): boolean {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  return OPERATOR_PATH_SET.has(normalized)
}

function createOperatorPageRequest(path: string): Request {
  const url = new URL(path, self.location.origin)
  return new Request(url.href, {
    credentials: "same-origin",
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  })
}

async function populateOperatorPageCache(): Promise<void> {
  const cache = await caches.open(OPERATOR_PAGE_CACHE)

  await Promise.all(
    OPERATOR_DOCUMENT_PATHS.map(async (path) => {
      try {
        const request = createOperatorPageRequest(path)
        const response = await fetch(request)
        if (response.ok && !response.redirected) {
          await cache.put(request, response)
        }
      } catch {
        // Offline activate/install — keep any entries already in the cache.
      }
    })
  )
}

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

/** Document navigations for operator routes — used after PWA cold start offline. */
class OperatorNavigateHandler extends Strategy {
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    const pathname = new URL(request.url).pathname

    if (!isOperatorDocumentPath(pathname)) {
      return handler.fetch(request)
    }

    const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
    const operatorRequest = createOperatorPageRequest(normalized)

    const operatorCache = await caches.open(OPERATOR_PAGE_CACHE)
    const fromOperatorCache =
      (await operatorCache.match(operatorRequest, { ignoreSearch: true })) ??
      (await operatorCache.match(request, { ignoreSearch: true }))

    if (fromOperatorCache) {
      return fromOperatorCache
    }

    const pagesCache = await caches.open(PAGES_CACHE_NAME.html)
    const fromPagesCache = await pagesCache.match(request, { ignoreSearch: true })
    if (fromPagesCache) {
      return fromPagesCache
    }

    try {
      return await handler.fetch(request)
    } catch {
      const offlineBody =
        "<!doctype html><html><body><p>BikePark: this page is not available offline yet. Open the app online once while on the dashboard, then try again.</p></body></html>"
      return new Response(offlineBody, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
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
    ignoreURLParametersMatching: [/^_rsc$/],
  },
  clientsClaim: true,
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
        request.mode === "navigate" &&
        sameOrigin &&
        !pathname.startsWith("/api/") &&
        isOperatorDocumentPath(pathname),
      handler: new OperatorNavigateHandler(),
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

self.addEventListener("install", (event) => {
  event.waitUntil(populateOperatorPageCache())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(populateOperatorPageCache())
})
