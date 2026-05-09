"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">BikePark</h1>
          <p className="text-sm text-muted-foreground">Dashboard (placeholder)</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  )
}
