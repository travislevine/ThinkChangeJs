"use client"

import Link from "next/link"

import {
  DASHBOARD_ACCENT_BUTTON_CLASS,
  DASHBOARD_ACCENT_CARD_CLASS,
  DASHBOARD_ACCENT_TITLE_CLASS,
  DASHBOARD_FOOTER_BORDER_CLASS,
} from "@/components/dashboard/dashboardSurfaceStyles"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { StatsSection } from "@/components/dashboard/StatsSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full min-w-0 max-w-3xl flex-col px-4 py-6">
        <DashboardHeader />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-6">
          <div className="flex flex-col gap-6">
            <StatsSection />

            <div className="grid w-full min-w-0 grid-cols-1 gap-4 p-1 md:grid-cols-2 lg:grid-cols-4">
              <Card className={DASHBOARD_ACCENT_CARD_CLASS}>
                <CardHeader>
                  <CardTitle className={DASHBOARD_ACCENT_TITLE_CLASS}>Access</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button asChild size="lg" variant="ghost" className={DASHBOARD_ACCENT_BUTTON_CLASS}>
                    <Link href="/pin">PIN entry</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <footer className={DASHBOARD_FOOTER_BORDER_CLASS}>
          <Button asChild size="lg" variant="secondary" className="min-h-[44px] w-full">
            <Link href="/check-ticket">Check Ticket</Link>
          </Button>
        </footer>
      </div>
    </div>
  )
}
