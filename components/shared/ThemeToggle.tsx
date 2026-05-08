"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useIsClient } from "@/hooks/useIsClient"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()
  const isDark = theme !== "light"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="min-h-[44px] min-w-[44px]"
      aria-label={
        !isClient ? "Toggle theme" : isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {!isClient ? null : isDark ? (
        <SunIcon className="size-5" />
      ) : (
        <MoonIcon className="size-5" />
      )}
    </Button>
  )
}

