"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useBreakpoint } from "@/hooks/useBreakpoint"
import { useOrientation } from "@/hooks/useOrientation"
import { GRID_COLUMNS_BY_BREAKPOINT } from "@/lib/constants/layout"

export default function Home() {
  const breakpoint = useBreakpoint()
  const orientation = useOrientation()
  const gridCols = GRID_COLUMNS_BY_BREAKPOINT[breakpoint]

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 py-6">
        <DashboardHeader />
        {process.env.NODE_ENV === "development" ? (
          <p className="pt-3 text-xs text-muted-foreground">
            Layout: {breakpoint} · {orientation} · grid cols {gridCols}
          </p>
        ) : null}

        <main className="flex-1 overflow-y-auto py-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Access</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="min-h-[44px] justify-start"
                  >
                    <Link href="/pin">PIN entry</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Responsive grid check</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border bg-muted/40 px-2 py-3 text-center text-xs text-muted-foreground"
                    >
                      Column {i}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="border-t border-border pt-4">
          <Button asChild size="lg" variant="secondary" className="min-h-[44px] w-full">
            <Link href="/check-ticket">Check Ticket</Link>
          </Button>
        </footer>
      </div>
    </div>
  )
}
