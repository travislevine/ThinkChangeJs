export const CONNECTIVITY_PROBE_INTERVAL_MS = 5_000
export const CONNECTIVITY_PROBE_TIMEOUT_MS = 1_500
export const CONNECTIVITY_PROBE_URL = "/api/ping"

/** Max wait for PowerSync initial download before considering local pool seed (all platforms). */
export const FIRST_SYNC_WAIT_MS = 20_000

/** Quick polls before / after `waitForFirstSync` for server pool rows (early exit). */
export const PRE_SEED_POOL_POLL_INTERVAL_MS = 150

export const PRE_SEED_POOL_FAST_POLL_ATTEMPTS = 30

/** Extra time after `waitForFirstSync` to avoid seeding before the server pool is applied. */
export const PRE_SEED_POOL_MAX_WAIT_MS = 8_000

/** Defer offline HTML/RSC warming until first sync completes (fallback if sync hangs). */
export const OFFLINE_ROUTE_WARM_DEFER_MS = 90_000
