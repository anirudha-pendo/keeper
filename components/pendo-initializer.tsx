'use client'

import { useEffect, useRef } from 'react'

interface PendoInitializerProps {
  username: string
}

export function PendoInitializer({ username }: PendoInitializerProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (typeof pendo === 'undefined' || initialized.current) {
      return
    }

    initialized.current = true

    pendo.initialize({
      visitor: {
        id: username,
      },
      account: {
        id: username,
      },
    })
  }, [username])

  return null
}
