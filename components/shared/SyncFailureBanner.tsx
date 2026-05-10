"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSyncStatus } from "@/contexts/SyncStatusContext"

export function SyncFailureBanner() {
  const { hasSyncError, syncIssueFingerprint, retrySync } = useSyncStatus()
  const [dismissedFingerprint, setDismissedFingerprint] = React.useState("")

  const visible = hasSyncError && dismissedFingerprint !== syncIssueFingerprint

  if (!visible) {
    return null
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-3 text-sm text-foreground"
    >
      <p className="min-w-0 flex-1 leading-snug">
        Sync issue — changes stay on this device. Check your connection, then retry sync or dismiss this
        message.
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px] shrink-0"
          onClick={() => {
            void retrySync()
          }}
        >
          Retry sync
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] shrink-0"
          aria-label="Dismiss sync warning"
          onClick={() => setDismissedFingerprint(syncIssueFingerprint)}
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

SyncFailureBanner.displayName = "SyncFailureBanner"
