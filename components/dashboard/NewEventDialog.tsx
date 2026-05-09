"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
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
import { useToast } from "@/hooks/useToast"

export interface NewEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewEventDialog({ open, onOpenChange }: NewEventDialogProps) {
  const { toast } = useToast()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start new event</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive all current data and start a new event.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="destructive" className="min-h-[44px]">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="min-h-[44px]"
              onClick={() => toast("New event dialog is not implemented yet")}
            >
              Continue
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

NewEventDialog.displayName = "NewEventDialog"

