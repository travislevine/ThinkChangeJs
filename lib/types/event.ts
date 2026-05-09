export interface EventSummary {
  id: string
  name: string
  /** Unix timestamp in seconds */
  startedAt: number
}

export interface StartNewEventParams {
  name: string
  /** Unix timestamp in seconds */
  startedAt: number
  /** Unix timestamp in seconds */
  endedAt: number | null
}

export interface ArchivedEventSnapshot {
  event: {
    id: string
    name: string
    started_at: number
    ended_at: number | null
  }
  ticket_numbers: Array<{
    id: string
    number: number
    status: string
    event_id: string
  }>
  tickets: Array<{
    id: string
    event_id: string
    ticket_number: number
    patron_name: string | null
    mobile: string | null
    email: string | null
    total_devices: number
    devices_remaining: number
    status: string
    deleted_at: number | null
    device_id: string | null
  }>
  devices: Array<{
    id: string
    ticket_id: string
    device_type: string
    quantity: number
    colour: string | null
  }>
  pickup_events: Array<{
    id: string
    ticket_id: string
    devices_picked_up: number
    picked_up_at: number
  }>
  pickup_event_devices: Array<{
    id: string
    pickup_event_id: string
    device_type: string
    quantity: number
  }>
  notes: Array<{
    id: string
    ticket_id: string
    content: string
    recorded_at: number
  }>
}
