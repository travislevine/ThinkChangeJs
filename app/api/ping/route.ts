export async function GET(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}

