"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useAddCheckTicketNote } from "@/hooks/useAddCheckTicketNote"

export interface AddCheckTicketNoteSheetProps {
  controller?: ReturnType<typeof useAddCheckTicketNote>
}

export function AddCheckTicketNoteSheet({ controller }: AddCheckTicketNoteSheetProps) {
  const fallback = useAddCheckTicketNote()
  const [state, actions] = controller ?? fallback

  return (
    <Sheet open={state.open} onOpenChange={actions.onOpenChange}>
      <SheetContent side="bottom" className="max-h-[min(42dvh,420px)] p-0">
        <SheetHeader>
          <SheetTitle>Add note</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-2">
          {state.error ? (
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {state.error}
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="check-ticket-add-note" className="sr-only">
              Note
            </Label>
            <Textarea
              id="check-ticket-add-note"
              placeholder="Add a note..."
              className="min-h-[120px] resize-none"
              value={state.content}
              onChange={(e) => actions.setContent(e.target.value)}
              disabled={state.isSaving}
            />
          </div>
        </div>

        <SheetFooter className="border-t border-border bg-muted/30">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={actions.close}
              disabled={state.isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-[44px]"
              onClick={() => void actions.save()}
              disabled={state.isSaving}
            >
              Save note
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

AddCheckTicketNoteSheet.displayName = "AddCheckTicketNoteSheet"
