export const CONNECTIVITY_PROBE_INTERVAL_MS = 5_000
export const CONNECTIVITY_PROBE_TIMEOUT_MS = 1_500
export const CONNECTIVITY_PROBE_URL = "/api/ping"

/** Max wait for PowerSync initial download before considering local pool seed (all platforms). */
export const FIRST_SYNC_WAIT_MS = 30_000

/** Poll interval while waiting for server `ticket_numbers` rows to land locally. */
export const PRE_SEED_POOL_POLL_INTERVAL_MS = 250

/** Extra time after `waitForFirstSync` to avoid seeding before the server pool is applied. */
export const PRE_SEED_POOL_MAX_WAIT_MS = 15_000
