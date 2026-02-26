interface Pendo {
  track(eventName: string, metadata?: Record<string, string | number | boolean>): void
}

declare const pendo: Pendo
