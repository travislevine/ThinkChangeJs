"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBreakpoint } from "@/hooks/useBreakpoint"
import { useOrientation } from "@/hooks/useOrientation"
import { GRID_COLUMNS_BY_BREAKPOINT } from "@/lib/constants/layout"

export default function Home() {
  const breakpoint = useBreakpoint()
  const orientation = useOrientation()
  const gridCols = GRID_COLUMNS_BY_BREAKPOINT[breakpoint]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">BikePark</h1>
          <p className="text-sm text-muted-foreground">Dashboard (placeholder)</p>
          {process.env.NODE_ENV === "development" ? (
            <p className="text-xs text-muted-foreground">
              Layout: {breakpoint} · {orientation} · grid cols {gridCols}
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Primary actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild size="lg" className="min-h-[44px]">
                <Link href="/park">Park</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[44px]">
                <Link href="/pickup">Pick Up</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="min-h-[44px]">
                <Link href="/check-ticket">Check Ticket</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild size="lg" variant="ghost" className="min-h-[44px] justify-start">
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
    </div>
  )
}
