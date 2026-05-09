import type { NextConfig } from "next"
import withSerwist from "@serwist/next"

const withPWA = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
})

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.20"],
}

export default withPWA(nextConfig)