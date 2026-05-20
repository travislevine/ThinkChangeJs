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

export interface BlankEntryNoMobileDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function BlankEntryNoMobileDialog({
  open,
  onConfirm,
  onCancel,
}: BlankEntryNoMobileDialogProps): React.ReactElement {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Proceed without a mobile number?</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to proceed without a patron&apos;s number? No SMS will be sent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive" className="min-h-[44px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px]"
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

BlankEntryNoMobileDialog.displayName = "BlankEntryNoMobileDialog"
