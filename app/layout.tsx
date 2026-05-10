import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { ClientProviders } from "@/components/shared/ClientProviders"
import { ToastMount } from "@/components/shared/ToastMount"
import "./globals.css"

export const viewport: Viewport = {
  themeColor: "#0d9488",
}

export const metadata: Metadata = {
  title: "BikePark",
  description: "Offline-first bike park ticketing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BikePark",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ClientProviders toast={<ToastMount />}>{children}</ClientProviders>
      </body>
    </html>
  );
}
