'use client'

import { useEffect, useRef } from 'react'

interface PendoInitializerProps {
  username: string | null
}

export function PendoInitializer({ username }: PendoInitializerProps) {
  const initializedRef = useRef(false)
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof pendo === 'undefined') return

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
    if (typeof pendo === 'undefined') return
    if (!username || identifiedRef.current === username) return

    pendo.identify({
      visitor: {
        id: username,
        full_name: username,
        firstName: username,
        lastName: '',
        email: '',
        externalId: '',
        accountId: '',
        lastUsed: new Date().toISOString(),
        organizationCount: 0,
        hasGithubAccount: false,
        githubLogin: '',
      },
      account: {
        id: username,
        subscriptionId: '',
        isSuperAdmin: false,
        hasGithubIntegration: false,
        hasSlackIntegration: false,
        hasPendoAuthToken: false,
        userCount: 1,
        repositoryCount: 0,
        workflowCount: 0,
        pullRequestCount: 0,
      },
    })
    identifiedRef.current = username
  }, [username])

  return null
}
