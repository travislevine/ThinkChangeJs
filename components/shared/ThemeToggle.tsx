"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme !== "light"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="min-h-[44px] min-w-[44px]"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </Button>
  )
}

