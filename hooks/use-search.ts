'use client'

import { useMemo } from 'react'
import type { Bookmark, FilterOptions } from '@/lib/types'

export function useSearch(bookmarks: Bookmark[], filters: FilterOptions): Bookmark[] {
  return useMemo(() => {
    let results = [...bookmarks]

    // Text search
    if (filters.query) {
      const q = filters.query.toLowerCase()
      results = results.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Favorites only
    if (filters.favoriteOnly) {
      results = results.filter((b) => b.isFavorite)
    }

    // Tag filter
    if (filters.selectedTags && filters.selectedTags.length > 0) {
      results = results.filter((b) =>
        filters.selectedTags.every((tag) => b.tags.includes(tag))
      )
    }

    // Collection filter
    if (filters.collectionId) {
      results = results.filter((b) => b.collectionId === filters.collectionId)
    }

    // Sort
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'priority':
          if (b.priority !== a.priority) {
            return b.priority - a.priority
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return results
  }, [bookmarks, filters])
}
