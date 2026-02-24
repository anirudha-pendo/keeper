'use client'

import { useMemo, useEffect, useRef } from 'react'
import type { Bookmark, FilterOptions } from '@/lib/types'

export function useSearch(bookmarks: Bookmark[], filters: FilterOptions): Bookmark[] {
  const results = useMemo(() => {
    let filtered = [...bookmarks]

    // Text search
    if (filters.query) {
      const q = filters.query.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q)
      )
    }

    // Favorites only
    if (filters.favoriteOnly) {
      filtered = filtered.filter((b) => b.isFavorite)
    }

    // Sort
    filtered.sort((a, b) => {
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

    return filtered
  }, [bookmarks, filters])

  const prevQueryRef = useRef(filters.query)
  useEffect(() => {
    if (filters.query && filters.query !== prevQueryRef.current) {
      if (typeof window !== 'undefined' && window.pendo) {
        window.pendo.track('bookmark_search_executed', {
          query: filters.query.substring(0, 100),
          query_length: filters.query.length,
          results_count: results.length,
          total_bookmarks_count: bookmarks.length,
          sort_by: filters.sortBy,
          favorite_filter_active: filters.favoriteOnly,
        })
      }
    }
    prevQueryRef.current = filters.query
  }, [filters.query, filters.sortBy, filters.favoriteOnly, results.length, bookmarks.length])

  return results
}
