'use client'

import { useEffect, useRef } from 'react'
import { useUsername } from '@/hooks/use-username'
import { useTheme } from '@/hooks/use-theme'
import { getDashboardStats, getVisitorMetadata } from '@/app/actions/bookmarks'

export function PendoInitializer() {
  const { username, isLoading } = useUsername()
  const { theme } = useTheme()
  const pendoInitializedRef = useRef(false)
  const identifiedUsernameRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (!username) {
      if (!pendoInitializedRef.current) {
        pendo.initialize({
          visitor: {
            id: 'ANONYMOUS_VISITOR_ID',
          },
        })
        pendoInitializedRef.current = true
      }
      return
    }

    if (identifiedUsernameRef.current === username) return

    async function identifyVisitor() {
      const [statsResult, metadataResult] = await Promise.all([
        getDashboardStats(username!),
        getVisitorMetadata(username!),
      ])

      const stats = statsResult.success ? statsResult.data : null
      const metadata = metadataResult.success ? metadataResult.data : null

      const visitorPayload = {
        visitor: {
          id: username,
          username: username,
          theme: theme,
          createdAt: metadata?.createdAt ?? undefined,
          totalBookmarks: stats?.totalBookmarks ?? 0,
          favoritesCount: stats?.favoritesCount ?? 0,
          tagsCount: stats?.tagsCount ?? 0,
          collectionsCount: stats?.collectionsCount ?? 0,
        },
      }

      if (pendoInitializedRef.current) {
        pendo.identify(visitorPayload)
      } else {
        pendo.initialize(visitorPayload)
        pendoInitializedRef.current = true
      }

      identifiedUsernameRef.current = username
    }

    identifyVisitor()
  }, [isLoading, username, theme])

  return null
}
