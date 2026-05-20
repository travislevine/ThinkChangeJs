import type { NextConfig } from "next"
import withSerwist from "@serwist/next"

const withPWA = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  /** Cache each visited route for offline navigation (required for iOS WebKit). */
  cacheOnNavigation: true,
  /** PowerSync ships ~2.5 MB WASM bundles that must be available offline on iPad. */
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
})

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.20"],
}

export default withPWA(nextConfig)