import { column, Schema, Table } from "@powersync/web"

const events = new Table(
  {
    name: column.text,
    started_at: column.integer,
    ended_at: column.integer,
    is_active: column.integer,
  },
  { indexes: { events_active: ["is_active"] } }
)

const ticket_numbers = new Table(
  {
    number: column.integer,
    status: column.text,
    event_id: column.text,
  },
  { indexes: { ticket_numbers_event: ["event_id"] } }
)

const tickets = new Table(
  {
    event_id: column.text,
    ticket_number: column.integer,
    patron_name: column.text,
    mobile: column.text,
    email: column.text,
    total_devices: column.integer,
    devices_remaining: column.integer,
    status: column.text,
    deleted_at: column.integer,
    device_id: column.text,
  },
  { indexes: { tickets_event: ["event_id"], tickets_deleted: ["deleted_at"] } }
)

const devices = new Table(
  {
    ticket_id: column.text,
    device_type: column.text,
    quantity: column.integer,
    colour: column.text,
  },
  { indexes: { devices_ticket: ["ticket_id"] } }
)

const pickup_events = new Table(
  {
    ticket_id: column.text,
    devices_picked_up: column.integer,
    picked_up_at: column.integer,
  },
  { indexes: { pickup_events_ticket: ["ticket_id"] } }
)

const pickup_event_devices = new Table(
  {
    pickup_event_id: column.text,
    device_type: column.text,
    quantity: column.integer,
  },
  { indexes: { pickup_event_devices_parent: ["pickup_event_id"] } }
)

const notes = new Table(
  {
    ticket_id: column.text,
    content: column.text,
    recorded_at: column.integer,
  },
  { indexes: { notes_ticket: ["ticket_id"] } }
)

const archived_events = new Table(
  {
    event_id: column.text,
    snapshot_json: column.text,
    archived_at: column.integer,
  },
  { indexes: { archived_events_event: ["event_id"] } }
)

export const bikeParkSchema = new Schema({
  events,
  ticket_numbers,
  tickets,
  devices,
  pickup_events,
  pickup_event_devices,
  notes,
  archived_events,
})
