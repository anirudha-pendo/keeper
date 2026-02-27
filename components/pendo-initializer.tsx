'use client'

import { useEffect, useRef } from 'react'
import { fetchUserCreatedAt } from '@/app/actions/user'

interface PendoInitializerProps {
  username: string
}

export function PendoInitializer({ username }: PendoInitializerProps) {
  const identifiedRef = useRef(false)

  useEffect(() => {
    if (identifiedRef.current) return
    identifiedRef.current = true

    async function identifyUser() {
      const createdAt = await fetchUserCreatedAt(username)

      pendo.identify({
        visitor: {
          id: username,
          createdAt: createdAt ?? undefined,
        },
      })
    }

    identifyUser()
  }, [username])

  return null
}
