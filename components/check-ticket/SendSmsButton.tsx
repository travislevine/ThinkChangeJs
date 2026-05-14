"use client"

import * as React from "react"
import { CheckIcon, Loader2Icon, MessageSquareIcon } from "lucide-react"

import { SendSmsDialog } from "@/components/check-ticket/SendSmsDialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSendSms } from "@/hooks/useSendSms"
import type { SendSmsButtonProps } from "@/lib/types/sendSms"

export function SendSmsButton({
  ticketId,
  ticketNumber,
  patronName,
  mobile,
  isOffline,
}: SendSmsButtonProps): React.ReactElement {
  const { sendSms, status } = useSendSms(ticketId)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const dialogPresentationOpen =
    dialogOpen && status !== "sending" && status !== "sent"

  const canOpenDialog =
    !isOffline && (status === "idle" || status === "error")

  const openDialog = React.useCallback(() => {
    if (!canOpenDialog) {
      return
    }
    setDialogOpen(true)
  }, [canOpenDialog])

  const closeDialog = React.useCallback(() => {
    setDialogOpen(false)
  }, [])

  const confirmSend = React.useCallback(() => {
    setDialogOpen(false)
    void sendSms(mobile, ticketNumber, patronName)
  }, [mobile, patronName, sendSms, ticketNumber])

  const showOfflineUi = isOffline
  const effectiveStatus = showOfflineUi ? "idle" : status

  let label = "Send SMS"
  let icon: React.ReactNode = <MessageSquareIcon className="h-5 w-5" aria-hidden />
  let variant: React.ComponentProps<typeof Button>["variant"] = "outline"
  let isDisabled = false
  let sentGreen = false

  if (!showOfflineUi) {
    if (effectiveStatus === "sending") {
      label = "Sending..."
      icon = <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden />
      isDisabled = true
    } else if (effectiveStatus === "sent") {
      label = "Sent ✓"
      icon = <CheckIcon className="h-5 w-5" aria-hidden />
      variant = "default"
      sentGreen = true
      isDisabled = true
    } else if (effectiveStatus === "error") {
      label = "Send SMS"
      icon = <MessageSquareIcon className="h-5 w-5" aria-hidden />
    }
  }

  const nativeDisabled = !showOfflineUi && isDisabled

  const button = (
    <Button
      type="button"
      variant={variant}
      disabled={nativeDisabled}
      aria-disabled={showOfflineUi ? true : undefined}
      aria-label={label}
      aria-busy={effectiveStatus === "sending"}
      className={
        sentGreen
          ? "min-h-[44px] min-w-[44px] border-green-600 bg-green-600 text-white hover:bg-green-600 focus-visible:border-green-600 focus-visible:ring-green-600/40 dark:bg-green-600 dark:hover:bg-green-600 sm:px-3"
          : showOfflineUi
            ? "min-h-[44px] min-w-[44px] cursor-not-allowed opacity-60 sm:px-3"
            : "min-h-[44px] min-w-[44px] sm:px-3"
      }
      onKeyDown={(e) => {
        if (showOfflineUi && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
        }
      }}
      onClick={() => {
        if (showOfflineUi) {
          return
        }
        openDialog()
      }}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </Button>
  )

  return (
    <>
      {showOfflineUi ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>SMS requires an internet connection</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      <SendSmsDialog
        open={dialogPresentationOpen}
        onConfirm={confirmSend}
        onCancel={closeDialog}
        mobile={mobile}
        patronName={patronName}
        ticketNumber={ticketNumber}
      />
    </>
  )
}

SendSmsButton.displayName = "SendSmsButton"
