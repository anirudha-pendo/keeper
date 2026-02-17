'use client'

import { useEffect, useRef } from 'react'
import type { Bookmark } from '@/lib/types'

interface PendoOptions {
  username: string | null
  bookmarks: Bookmark[]
  sortBy: string
}

export function usePendo({ username, bookmarks, sortBy }: PendoOptions) {
  const initializedRef = useRef(false)
  const identifiedRef = useRef(false)

  // Initialize Pendo with anonymous visitor on first load
  useEffect(() => {
    if (initializedRef.current) return
    if (typeof pendo === 'undefined') return
    initializedRef.current = true

    pendo.initialize({
      visitor: {
        id: 'ANONYMOUS_VISITOR_ID',
      },
    })
  }, [])

  // Identify with actual visitor data once username and bookmarks are available
  useEffect(() => {
    if (!username) return
    if (typeof pendo === 'undefined') return

    const bookmarkCount = bookmarks.length
    const favoriteCount = bookmarks.filter((b) => b.isFavorite).length
    const hasFavorites = favoriteCount > 0
    const usesPriority = bookmarks.some((b) => b.priority > 0)

    const allTags = new Set<string>()
    bookmarks.forEach((b) => b.tags.forEach((t) => allTags.add(t)))
    const tags = Array.from(allTags).sort()
    const tagCount = tags.length

    // Find most recent createdAt and updatedAt across all bookmarks
    let lastBookmarkCreatedAt: string | undefined
    let lastBookmarkUpdatedAt: string | undefined
    for (const b of bookmarks) {
      if (!lastBookmarkCreatedAt || b.createdAt > lastBookmarkCreatedAt) {
        lastBookmarkCreatedAt = b.createdAt
      }
      if (!lastBookmarkUpdatedAt || b.updatedAt > lastBookmarkUpdatedAt) {
        lastBookmarkUpdatedAt = b.updatedAt
      }
    }

    pendo.identify({
      visitor: {
        id: username,
        bookmarkCount,
        tagCount,
        favoriteCount,
        hasFavorites,
        usesPriority,
        lastBookmarkCreatedAt: lastBookmarkCreatedAt || '',
        lastBookmarkUpdatedAt: lastBookmarkUpdatedAt || '',
        tags,
        preferredSortBy: sortBy,
      },
    })

    identifiedRef.current = true
  }, [username, bookmarks, sortBy])
}
