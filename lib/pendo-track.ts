// Server-side Pendo Track Events.
// Server Actions run in Node.js, where the browser `pendo` agent is not available,
// so events are sent directly to Pendo's Track API instead.
//
// Configuration (environment variables, never commit the values):
// - PENDO_TRACK_EVENT_SECRET: Pendo Track Event shared secret (integration key). Required.
// - PENDO_DATA_HOST: Pendo data host. Defaults to the dev data host below.

const DEFAULT_PENDO_DATA_HOST = 'data.pendo-dev.pendo-dev.com'

// Properties left undefined are omitted from the request body by JSON.stringify.
type PendoTrackProperties = Record<string, string | number | boolean | string[] | undefined>

export async function trackPendoEvent(
  event: string,
  visitorId: string,
  properties: PendoTrackProperties = {}
): Promise<void> {
  const secret = process.env.PENDO_TRACK_EVENT_SECRET
  if (!secret) {
    // TODO: set PENDO_TRACK_EVENT_SECRET in the server environment to enable server-side Track Events.
    return
  }

  const dataHost = process.env.PENDO_DATA_HOST || DEFAULT_PENDO_DATA_HOST

  try {
    const response = await fetch(`https://${dataHost}/data/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pendo-integration-key': secret,
      },
      body: JSON.stringify({
        type: 'track',
        event,
        // Matches the visitor id set by pendo.identify() on the auth page.
        // The app has no account concept, so no accountId is sent.
        visitorId,
        timestamp: Date.now(),
        properties,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error(`Pendo track "${event}" failed with status ${response.status}`)
    }
  } catch (error) {
    // Tracking must never break the application flow.
    console.error(`Pendo track "${event}" failed:`, error)
  }
}
