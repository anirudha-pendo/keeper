'use client'

import { useMemo, useEffect, useRef } from 'react'
import type { Bookmark, FilterOptions } from '@/lib/types'

export function useSearch(bookmarks: Bookmark[], filters: FilterOptions): Bookmark[] {
  const prevQueryRef = useRef<string>('')

  const results = useMemo(() => {
    let filtered = [...bookmarks]

    // Text search
    if (filters.query) {
      const q = filters.query.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Favorites only
    if (filters.favoriteOnly) {
      filtered = filtered.filter((b) => b.isFavorite)
    }

    // Tag filter
    if (filters.selectedTags && filters.selectedTags.length > 0) {
      filtered = filtered.filter((b) =>
        filters.selectedTags.every((tag) => b.tags.includes(tag))
      )
    }

    // Collection filter
    if (filters.collectionId) {
      filtered = filtered.filter((b) => b.collectionId === filters.collectionId)
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

  useEffect(() => {
    const query = filters.query || ''
    if (query && query !== prevQueryRef.current) {
      if (typeof pendo !== 'undefined') {
        pendo.track('bookmarks_searched', {
          query: query,
          queryLength: query.length,
          resultsCount: results.length,
          totalBookmarks: bookmarks.length,
          hasActiveFilters: Boolean(filters.favoriteOnly || (filters.selectedTags && filters.selectedTags.length > 0) || filters.collectionId),
        })
      }
    }
    prevQueryRef.current = query
  }, [filters.query, results.length, bookmarks.length, filters.favoriteOnly, filters.selectedTags, filters.collectionId])

  return results
}
