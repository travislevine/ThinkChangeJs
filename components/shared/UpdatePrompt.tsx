"use client"

import * as React from "react"
import { toast } from "sonner"

const UPDATE_TOAST_ID = "update-available"

function postSkipWaiting(registration: ServiceWorkerRegistration) {
  const waiting = registration.waiting
  if (!waiting) return

  waiting.postMessage({ type: "SKIP_WAITING" })
}

export function UpdatePrompt() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const onControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    const showUpdateToast = (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting) return

      // Persistent update prompt (Phase 5.1): do not auto-dismiss.
      toast("A new version is available", {
        id: UPDATE_TOAST_ID,
        duration: Infinity,
        action: {
          label: "Update Now",
          onClick: () => postSkipWaiting(registration),
        },
      })
    }

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const installing = registration.installing
      if (!installing) return

      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && registration.waiting) {
          showUpdateToast(registration)
        }
      })
    }

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return

      if (registration.waiting) {
        showUpdateToast(registration)
      }

      registration.addEventListener("updatefound", () => onUpdateFound(registration))
    })

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  return null
}

