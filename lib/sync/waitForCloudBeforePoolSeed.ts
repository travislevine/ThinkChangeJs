import type { AbstractPowerSyncDatabase } from "@powersync/common"

import {
  FIRST_SYNC_WAIT_MS,
  PRE_SEED_POOL_MAX_WAIT_MS,
  PRE_SEED_POOL_POLL_INTERVAL_MS,
} from "@/lib/constants/sync"

async function getLocalTicketNumberCount(database: AbstractPowerSyncDatabase): Promise<number> {
  const row = await database.getOptional<{ c: number }>("SELECT COUNT(*) as c FROM ticket_numbers")
  return Number(row?.c ?? 0)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Wait for cloud data before `seedTicketPoolIfEmpty` so iOS/WebKit does not insert 1,500 rows
 * while the server pool is still downloading (duplicate uploads + long "Syncing…").
 */
export async function waitForCloudBeforePoolSeed(
  database: AbstractPowerSyncDatabase
): Promise<void> {
  if (!database.connected) {
    return
  }

  const firstSync = new AbortController()
  const timeout = window.setTimeout(() => firstSync.abort(), FIRST_SYNC_WAIT_MS)
  try {
    await database.waitForFirstSync(firstSync.signal)
  } catch {
    // Download may still be in progress; poll below.
  } finally {
    window.clearTimeout(timeout)
  }

  const deadline = Date.now() + PRE_SEED_POOL_MAX_WAIT_MS
  while (Date.now() < deadline) {
    if ((await getLocalTicketNumberCount(database)) > 0) {
      return
    }

    const { hasSynced, dataFlowStatus } = database.currentStatus
    const downloading = dataFlowStatus.downloading ?? false
    if (hasSynced === true && !downloading) {
      return
    }

    await sleep(PRE_SEED_POOL_POLL_INTERVAL_MS)
  }
}
