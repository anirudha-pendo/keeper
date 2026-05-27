'use client'

import { useEffect, useRef } from 'react'

export function PendoInitializer() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && typeof pendo !== 'undefined') {
      pendo.initialize({
        visitor: {
          id: '',
        },
      })
      initialized.current = true
    }
  }, [])

  return null
}
