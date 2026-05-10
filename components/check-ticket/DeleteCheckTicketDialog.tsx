"use client"

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
import { useDeleteCheckTicketRecord } from "@/hooks/useDeleteCheckTicketRecord"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"

export interface DeleteCheckTicketDialogProps {
  controller?: ReturnType<typeof useDeleteCheckTicketRecord>
}

export function DeleteCheckTicketDialog({ controller }: DeleteCheckTicketDialogProps) {
  const fallback = useDeleteCheckTicketRecord()
  const [state, actions] = controller ?? fallback

  const label = state.target ? formatTicketNumberLabel(state.target.ticketNumber) : "#000"

  return (
    <AlertDialog open={state.open} onOpenChange={actions.onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete ticket record?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove Ticket {label} from the active list. Ticket number {label} will be
            returned to the available pool.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state.error ? (
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            {state.error}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive" className="min-h-[44px]" disabled={state.isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-600/90 focus-visible:ring-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-600/90"
            disabled={state.isDeleting}
            onClick={(e) => {
              e.preventDefault()
              void actions.confirm()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

DeleteCheckTicketDialog.displayName = "DeleteCheckTicketDialog"
