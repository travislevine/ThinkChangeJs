/**
 * Server route diagnostics (Vercel / Node logs). Do not log secrets or full PII.
 */
export function logRouteHandlerError(scope: string, error: unknown): void {
  console.error(`[BikePark:${scope}]`, error)
}
