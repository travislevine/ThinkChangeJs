"use client"

import * as React from "react"
import { PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSyncStatus } from "@/contexts/SyncStatusContext"
import { useToast } from "@/hooks/useToast"
import { usePreRegisteredPatrons } from "@/hooks/usePreRegisteredPatrons"
import { useSeedDummyPreRegistered } from "@/hooks/useSeedDummyPreRegistered"
import { db } from "@/lib/db/powersync"
import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import type { DropOffBlankEntryFormState } from "@/lib/types/dropOffForm"
import { EditPatronSheet, useEditPatronSheetController } from "@/components/park/EditPatronSheet"

type DeviceRow = {
  device_type: string | null
  quantity: number | string | null
  colour: string | null
}

type NoteRow = {
  content: string | null
}

export interface PreRegisteredListProps {
  onSelect: (prefill: DropOffBlankEntryFormState) => void
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function toDeviceType(v: string | null): (typeof DEVICE_CATEGORIES)[number] {
  const s = String(v ?? "Other")
  if ((DEVICE_CATEGORIES as readonly string[]).includes(s)) {
    return s as (typeof DEVICE_CATEGORIES)[number]
  }
  return "Other"
}

function toColour(v: string | null): (typeof COLOURS)[number] {
  const s = String(v ?? "Other")
  if ((COLOURS as readonly string[]).includes(s)) {
    return s as (typeof COLOURS)[number]
  }
  return "Other"
}

function defaultPrefill(): DropOffBlankEntryFormState {
  return {
    ticketNumber: "",
    patronName: "",
    mobile: "",
    email: "",
    deviceCountMode: "preset",
    deviceCountPreset: "1",
    deviceCountCustom: "",
    devices: [
      {
        id: crypto.randomUUID(),
        deviceType: DEVICE_CATEGORIES[0],
        quantity: 1,
        colour: COLOURS[0],
      },
    ],
    notes: "",
  }
}

export function PreRegisteredList({ onSelect }: PreRegisteredListProps) {
  useSeedDummyPreRegistered()

  const { requestSync } = useSyncStatus()
  const { error: toastError, success } = useToast()
  const editController = useEditPatronSheetController()
  const [, editActions] = editController
  const [query, setQuery] = React.useState("")
  const [refreshing, setRefreshing] = React.useState(false)
  const [selectingId, setSelectingId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)

  const { patrons, isLoading, error } = usePreRegisteredPatrons(query)

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return
    try {
      setRefreshing(true)
      await requestSync()
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, requestSync])

  const selectPatron = React.useCallback(
    async (ticketId: string, base: Omit<DropOffBlankEntryFormState, "devices" | "notes"> & { ticketNumber: string }) => {
      if (selectingId) return
      setSelectingId(ticketId)
      try {
        const devices = await db.getAll<DeviceRow>(
          "SELECT device_type, quantity, colour FROM devices WHERE ticket_id = ?",
          [ticketId]
        )
        const note = await db.getOptional<NoteRow>(
          "SELECT content FROM notes WHERE ticket_id = ? ORDER BY recorded_at DESC LIMIT 1",
          [ticketId]
        )

        const prefill: DropOffBlankEntryFormState = {
          ...defaultPrefill(),
          ...base,
          devices:
            devices.length > 0
              ? devices.map((d) => ({
                  id: crypto.randomUUID(),
                  deviceType: toDeviceType(d.device_type),
                  quantity: Math.max(1, asInt(d.quantity)),
                  colour: toColour(d.colour),
                }))
              : defaultPrefill().devices,
          notes: String(note?.content ?? "").trim(),
        }

        onSelect(prefill)
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Failed to load pre-registered patron")
      } finally {
        setSelectingId(null)
      }
    },
    [onSelect, selectingId, toastError]
  )

  const confirmDelete = React.useCallback(async (): Promise<void> => {
    if (!deleteTarget) return
    const target = deleteTarget
    try {
      await db.writeTransaction(async (tx) => {
        const now = Math.floor(Date.now() / 1000)
        await tx.execute("UPDATE tickets SET deleted_at = ? WHERE id = ?", [now, target.id])
      })
      success(`${target.name} removed`)
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to remove patron")
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, toastError, success])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search name or mobile…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[44px]"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={onRefresh}
          aria-label="Refresh pre-registered patrons"
          disabled={refreshing}
        >
          <RefreshCwIcon className={"h-5 w-5" + (refreshing ? " animate-spin" : "")} />
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
          Failed to load pre-registered patrons.
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : patrons.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          No pre-registered patrons found.
          {process.env.NODE_ENV !== "development" &&
          process.env.NEXT_PUBLIC_ENABLE_DUMMY_DATA !== "true" ? (
            <div className="mt-2 text-xs">
              To seed dummy patrons for testing in production mode, set{" "}
              <span className="font-medium">NEXT_PUBLIC_ENABLE_DUMMY_DATA=true</span> in
              <span className="font-medium"> .env.local</span>, then rebuild.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {patrons.map((p) => (
            <Card key={p.ticketId} size="sm">
              <CardHeader>
                <CardTitle className="text-sm">{p.patronName}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {p.mobile ? p.mobile : "No mobile"}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => editActions.openFor(p.ticketId)}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget({ id: p.ticketId, name: p.patronName })}
                  aria-label={`Delete ${p.patronName}`}
                >
                  <Trash2Icon className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  className="min-h-[44px]"
                  disabled={selectingId === p.ticketId}
                  onClick={() =>
                    void selectPatron(p.ticketId, {
                      ticketNumber: String(p.ticketNumber || ""),
                      patronName: p.patronName === "Anonymous" ? "" : p.patronName,
                      mobile: p.mobile ?? "",
                      email: p.email ?? "",
                      deviceCountMode: "preset",
                      deviceCountPreset: "1",
                      deviceCountCustom: "",
                    })
                  }
                >
                  Select
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <EditPatronSheet controller={editController} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (open ? null : setDeleteTarget(null))}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget ? `Remove ${deleteTarget.name} from pre-registered list?` : "Remove patron?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This patron will be removed from the pre-registered list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="destructive" className="min-h-[44px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px]" onClick={(e) => { e.preventDefault(); void confirmDelete() }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

PreRegisteredList.displayName = "PreRegisteredList"

