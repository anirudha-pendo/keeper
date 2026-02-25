'use client'

import { useEffect, useRef } from 'react'

interface PendoInitializerProps {
  username: string | null
}

export function PendoInitializer({ username }: PendoInitializerProps) {
  const initializedRef = useRef(false)
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!initializedRef.current) {
      pendo.initialize({
        visitor: {
          id: 'ANONYMOUS_VISITOR_ID',
        },
      })
      initializedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (username && identifiedRef.current !== username) {
      pendo.identify({
        visitor: {
          id: username,
          email: username,
          full_name: username,
          externalId: username,
          firstName: username,
          lastName: '',
          lastUsed: new Date().toISOString(),
          organizationCount: 1,
          isSuperAdmin: false,
        },
        account: {
          id: username,
          subscriptionId: '',
          isSuperAdmin: false,
          hasPendoAuthToken: false,
          hasGitHubIntegration: false,
        },
      })
      identifiedRef.current = username
    }
  }, [username])

  return null
}
