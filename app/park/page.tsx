"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { operatorNavigate } from "@/hooks/useOperatorNavigate"

import { BlankEntryForm } from "@/components/park/BlankEntryForm"
import { PathwaySelector } from "@/components/park/PathwaySelector"
import { PreRegisteredList } from "@/components/park/PreRegisteredList"
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
import type { DropOffPathway } from "@/lib/types/dropOff"
import type { DropOffBlankEntryFormState } from "@/lib/types/dropOffForm"

export default function ParkPage() {
  const router = useRouter()
  const [formTouched, setFormTouched] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pathway, setPathway] = React.useState<DropOffPathway>("blank")
  const [formKey, setFormKey] = React.useState(0)
  const [blankInitialState, setBlankInitialState] = React.useState<DropOffBlankEntryFormState | undefined>(undefined)

  const onBack = React.useCallback(() => {
    if (!formTouched) {
      operatorNavigate(router, "/")
      return
    }
    setConfirmOpen(true)
  }, [formTouched, router])

  const onPathwayChange = React.useCallback((next: DropOffPathway) => {
    setPathway(next)
    setFormTouched(false)
    setBlankInitialState(undefined)
    setFormKey((k) => k + 1)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[44px] w-fit"
          onClick={onBack}
        >
          ← Back
        </Button>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Drop-Off</h2>
          <p className="text-sm text-muted-foreground">Placeholder page</p>
        </div>

        <PathwaySelector value={pathway} onChange={onPathwayChange} />

        <div key={formKey} className="max-h-[calc(100dvh-260px)] overflow-y-auto">
          {pathway === "blank" ? (
            <BlankEntryForm onTouched={setFormTouched} initialState={blankInitialState} />
          ) : (
            <PreRegisteredList
              onSelect={(prefill) => {
                setBlankInitialState(prefill)
                setPathway("blank")
                setFormTouched(false)
                setFormKey((k) => k + 1)
              }}
            />
          )}
        </div>

        {process.env.NODE_ENV === "development" ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <div className="mb-2 font-medium">Dev helper</div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px]"
                onClick={() => setFormTouched(true)}
              >
                Mark form touched
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setFormTouched(false)}
              >
                Clear touched
              </Button>
              <div className="text-muted-foreground">
                touched: <span className="font-medium text-foreground">{String(formTouched)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes will be lost if you go back.
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
                operatorNavigate(router, "/")
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

