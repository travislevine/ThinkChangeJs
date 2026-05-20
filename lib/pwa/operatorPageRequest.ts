import { OPERATOR_ROUTES } from "@/lib/constants/operatorRoutes"

const OPERATOR_PATH_SET = new Set<string>(OPERATOR_ROUTES)

export function isOperatorPagePath(path: string): boolean {
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path
  return OPERATOR_PATH_SET.has(normalized)
}

/** Absolute same-origin request for a route HTML document (Cache API + SW). */
export function createOperatorPageRequest(path: string, origin?: string): Request {
  const base = origin ?? (typeof self !== "undefined" && "location" in self ? self.location.origin : "")
  const url = new URL(path, base || "http://localhost")
  return new Request(url.href, {
    credentials: "same-origin",
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  })
}
