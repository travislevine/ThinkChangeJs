"use client"

import * as React from "react"

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
import type { SendSmsDialogProps } from "@/lib/types/sendSms"
import { buildBikeParkReadySmsBody } from "@/lib/utils/smsMessageBody"

export function SendSmsDialog({
  open,
  onConfirm,
  onCancel,
  mobile,
  patronName,
  ticketNumber,
}: SendSmsDialogProps): React.ReactElement {
  const preview = buildBikeParkReadySmsBody(ticketNumber, patronName)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent size="default" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Send SMS notification?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-foreground">
              <p>A message will be sent to:</p>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 font-normal text-foreground">
                &quot;{preview}&quot;
              </p>
              <p className="text-xs text-muted-foreground">{mobile}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive" className="min-h-[44px] w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px] w-full bg-green-600 text-white hover:bg-green-600/90 focus-visible:border-green-600 focus-visible:ring-green-600/40 sm:w-auto dark:bg-green-600 dark:hover:bg-green-600/90"
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            Yes, Send
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

SendSmsDialog.displayName = "SendSmsDialog"
