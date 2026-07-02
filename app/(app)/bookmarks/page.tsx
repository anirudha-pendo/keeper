'use client'

import { useState, useEffect, useRef } from 'react'
import { useUsername } from '@/hooks/use-username'
import { useSearch } from '@/hooks/use-search'
import { BookmarkGrid } from '@/components/bookmark-grid'
import { BookmarkForm } from '@/components/bookmark-form'
import { SearchBar } from '@/components/search-bar'
import { FilterControls } from '@/components/filter-controls'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { getBookmarks, getTags, getCollections } from '@/app/actions/bookmarks'
import type { Bookmark, Collection, FilterOptions } from '@/lib/types'
import { useSearchParams } from 'next/navigation'

export default function BookmarksPage() {
  const { username } = useUsername()
  const searchParams = useSearchParams()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBookmarkForm, setShowBookmarkForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>()

  const [filters, setFilters] = useState<FilterOptions>({
    query: '',
    favoriteOnly: false,
    sortBy: 'recent',
    selectedTags: [],
    collectionId: undefined,
  })

  const filteredBookmarks = useSearch(bookmarks, filters)

  // Debounced search tracking
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const query = filters.query.trim()
    if (!query) return

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      if (typeof pendo !== 'undefined') {
        pendo.track("bookmarks_searched", {
          query,
          query_length: query.length,
          results_count: filteredBookmarks.length,
          total_bookmarks: bookmarks.length,
          sort_by: filters.sortBy,
          favorite_only: filters.favoriteOnly,
          selected_tags_count: filters.selectedTags.length,
          has_collection_filter: Boolean(filters.collectionId),
        })
      }
    }, 500)

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [filters.query, filteredBookmarks.length, bookmarks.length, filters.sortBy, filters.favoriteOnly, filters.selectedTags.length, filters.collectionId])

  // Apply tag from URL query param
  useEffect(() => {
    const tagParam = searchParams.get('tag')
    if (tagParam) {
      setFilters((prev) => ({ ...prev, selectedTags: [tagParam] }))
    }
    const collectionParam = searchParams.get('collection')
    if (collectionParam) {
      setFilters((prev) => ({ ...prev, collectionId: collectionParam }))
    }
  }, [searchParams])

  useEffect(() => {
    if (username) {
      loadData()
    }
  }, [username])

  const loadData = async () => {
    if (!username) return
    setIsLoading(true)
    const [bookmarksResult, tagsResult, collectionsResult] = await Promise.all([
      getBookmarks(username),
      getTags(username),
      getCollections(username),
    ])
    if (bookmarksResult.success && bookmarksResult.data) {
      setBookmarks(bookmarksResult.data)
    }
    if (tagsResult.success && tagsResult.data) {
      setAvailableTags(tagsResult.data)
    }
    if (collectionsResult.success && collectionsResult.data) {
      setCollections(collectionsResult.data)
    }
    setIsLoading(false)
  }

  const handleCloseForm = () => {
    setShowBookmarkForm(false)
    setEditingBookmark(undefined)
    loadData()
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setShowBookmarkForm(true)
  }

  const handleAddNew = () => {
    setEditingBookmark(undefined)
    setShowBookmarkForm(true)
  }

  const updateFilters = (updates: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  if (!username) return null

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleAddNew} size="sm" data-tracking-id="add-new-bookmark-button">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </div>

        {/* Search and filters */}
        <div className="space-y-3">
          <SearchBar
            value={filters.query}
            onChange={(query) => updateFilters({ query })}
            placeholder="Search..."
          />
          <FilterControls
            filters={filters}
            onChange={updateFilters}
            availableTags={availableTags}
            collections={collections}
          />
        </div>
      </div>

      {/* Bookmark grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading bookmarks...</p>
        </div>
      ) : filteredBookmarks.length === 0 && filters.query === '' && !filters.favoriteOnly && (filters.selectedTags || []).length === 0 && !filters.collectionId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg mb-2">No bookmarks yet</p>
          <p className="text-muted-foreground text-sm mb-4">
            Click &quot;New&quot; to create your first bookmark
          </p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg mb-2">No results found</p>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <BookmarkGrid
          bookmarks={filteredBookmarks}
          username={username}
          onEdit={handleEdit}
          onDelete={loadData}
        />
      )}

      {/* Bookmark form dialog */}
      <BookmarkForm
        isOpen={showBookmarkForm}
        onClose={handleCloseForm}
        username={username}
        bookmark={editingBookmark}
        collections={collections}
      />
    </div>
  )
}
