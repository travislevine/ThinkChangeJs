"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">BikePark UI smoke test</h1>
          <Badge variant="secondary">Phase 0.2</Badge>
        </header>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Light</CardTitle>
            </CardHeader>
            <CardContent>
              <UiSample />
            </CardContent>
          </Card>

          <Card className="dark">
            <CardHeader>
              <CardTitle>Dark</CardTitle>
            </CardHeader>
            <CardContent>
              <UiSample />
            </CardContent>
          </Card>
        </div>
      </div>

      <Toaster richColors position="bottom-center" />
    </div>
  )
}

function UiSample() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Badge>Badge</Badge>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ticket">Ticket number</Label>
        <Input id="ticket" inputMode="numeric" placeholder="047" />
      </div>

      <div className="grid gap-2">
        <Label>Device type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a device type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bike">Bike</SelectItem>
            <SelectItem value="ebike">eBike</SelectItem>
            <SelectItem value="scooter">Scooter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Optional…" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox id="verified" />
          <Label htmlFor="verified">Verified</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="toggle" />
          <Label htmlFor="toggle">Toggle</Label>
        </div>
      </div>
    </div>
  )
}
