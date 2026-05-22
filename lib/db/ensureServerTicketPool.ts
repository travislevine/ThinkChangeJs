import { isSupabaseConfigured, supabase } from "@/lib/db/supabase"

/**
 * Inserts ticket numbers 1–1500 in Postgres for `eventId` when missing.
 * PowerSync downloads them to devices — avoids 1,500 client uploads.
 */
export async function ensureServerTicketPool(eventId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const { error } = await supabase.rpc("bikepark_seed_ticket_pool", {
    p_event_id: eventId,
  })

  if (error) {
    console.warn("[BikePark] server ticket pool seed failed:", error.message)
    return false
  }

  return true
}
