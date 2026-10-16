const PENDO_TRACK_URL = 'https://data.pendo-dev.pendo-dev.com/data/track'

interface PendoTrackPayload {
  type: 'track'
  event: string
  visitorId: string
  accountId: string
  timestamp: number
  properties?: Record<string, string | number | boolean>
}

/**
 * Send a server-side Pendo Track Event via the Track API.
 *
 * Requires the PENDO_INTEGRATION_KEY environment variable to be set.
 * Failures are logged but never break application flow.
 */
export async function pendoTrack(
  event: string,
  visitorId: string,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  const integrationKey = process.env.PENDO_INTEGRATION_KEY
  if (!integrationKey) {
    return
  }

  const payload: PendoTrackPayload = {
    type: 'track',
    event,
    visitorId,
    accountId: visitorId,
    timestamp: Date.now(),
    ...(properties ? { properties } : {}),
  }

  try {
    await fetch(PENDO_TRACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pendo-integration-key': integrationKey,
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // Tracking failures must not break application flow
  }
}
