interface Pendo {
  track(eventName: string, metadata?: Record<string, string | number | boolean>): void
}

interface Window {
  pendo?: Pendo
}
