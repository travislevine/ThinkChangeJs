/** App routes operators use — warmed for offline client navigation (Phase 7 / 9). */
export const OPERATOR_ROUTES = ["/", "/park", "/pickup", "/pin", "/check-ticket"] as const

export type OperatorRoute = (typeof OPERATOR_ROUTES)[number]
