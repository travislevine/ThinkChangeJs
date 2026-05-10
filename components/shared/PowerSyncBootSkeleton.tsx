"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Shown only until local PowerSync DB + seed finish; remote sync continues in the background. */
export function PowerSyncBootSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground" aria-busy="true">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
            <Skeleton className="h-9 w-full max-w-[280px] rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

PowerSyncBootSkeleton.displayName = "PowerSyncBootSkeleton"
