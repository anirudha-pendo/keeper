'use client'

import { useEffect } from 'react'

interface PendoInitProps {
  username: string
}

declare global {
  interface Window {
    pendo: any
  }
}

export function PendoInit({ username }: PendoInitProps) {
  useEffect(() => {
    if (username && typeof window !== 'undefined' && window.pendo) {
      // Initialize Pendo with visitor data
      window.pendo.identify({
        visitor: {
          id: username, // Using username as the unique visitor ID
          username: username, // Additional metadata field
        },
      })
    }
  }, [username])

  return null
}
