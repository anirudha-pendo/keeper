'use client'

import { useState, useEffect } from 'react'
import { useUsername } from '@/hooks/use-username'
import { useSearch } from '@/hooks/use-search'
import { UsernamePrompt } from '@/components/username-prompt'
import { BookmarkGrid } from '@/components/bookmark-grid'
import { BookmarkForm } from '@/components/bookmark-form'
import { SearchBar } from '@/components/search-bar'
import { FilterControls } from '@/components/filter-controls'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { getBookmarks } from '@/app/actions/bookmarks'
import type { Bookmark, FilterOptions } from '@/lib/types'

export default function Page() {
  const { username, setUsername, isLoading: isUsernameLoading } = useUsername()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBookmarkForm, setShowBookmarkForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>()

  const [filters, setFilters] = useState<FilterOptions>({
    query: '',
    favoriteOnly: false,
    sortBy: 'recent',
  })

  const filteredBookmarks = useSearch(bookmarks, filters)

  useEffect(() => {
    if (username) {
      loadBookmarks()
    }
  }, [username])

  // Track session_started (Event 25) when username is available
  useEffect(() => {
    if (username && bookmarks.length > 0) {
      if (typeof window !== 'undefined' && (window as any).pendo) {
        ;(window as any).pendo.track('session_started', {
          username: username,
          bookmarks_count: bookmarks.length,
          last_session_timestamp: new Date().toISOString()
        })
      }
    }
  }, [username])

  // Track empty_state_viewed (Event 20) and no_results_found (Event 21)
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined' && (window as any).pendo) {
      if (filteredBookmarks.length === 0 && filters.query === '' && !filters.favoriteOnly && bookmarks.length === 0) {
        // Track empty_state_viewed (Event 20)
        const userAgeSeconds = 0 // Would need to track when user was created to calculate this
        ;(window as any).pendo.track('empty_state_viewed', {
          username: username || 'unknown',
          user_age_seconds: userAgeSeconds,
          is_new_user: true
        })
      } else if (filteredBookmarks.length === 0 && (filters.query !== '' || filters.favoriteOnly)) {
        // Track no_results_found (Event 21)
        ;(window as any).pendo.track('no_results_found', {
          search_query: filters.query,
          favorites_only: filters.favoriteOnly,
          sort_by: filters.sortBy,
          total_bookmarks: bookmarks.length
        })
      }
    }
  }, [filteredBookmarks.length, filters, isLoading, bookmarks.length, username])

  const loadBookmarks = async () => {
    if (!username) return
    setIsLoading(true)
    const startTime = Date.now()
    const result = await getBookmarks(username)
    if (result.success && result.data) {
      setBookmarks(result.data)
      const loadTime = Date.now() - startTime
      // Track bookmarks_loaded (Event 19)
      if (typeof window !== 'undefined' && (window as any).pendo) {
        const hasFavorites = result.data.some((b: Bookmark) => b.isFavorite)
        const hasPriorityBookmarks = result.data.some((b: Bookmark) => b.priority > 0)
        ;(window as any).pendo.track('bookmarks_loaded', {
          username: username,
          bookmarks_count: result.data.length,
          load_time_ms: loadTime,
          has_favorites: hasFavorites,
          has_priority_bookmarks: hasPriorityBookmarks
        })
      }
    } else {
      // Track server_action_error (Event 22)
      if (typeof window !== 'undefined' && (window as any).pendo) {
        ;(window as any).pendo.track('server_action_error', {
          action_type: 'getBookmarks',
          error_message: result.error || 'Unknown error',
          username: username,
          bookmark_id: 'N/A'
        })
      }
    }
    setIsLoading(false)
  }

  const handleCloseForm = () => {
    setShowBookmarkForm(false)
    setEditingBookmark(undefined)
    loadBookmarks()
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setShowBookmarkForm(true)
    // Track bookmark_edit_opened (Event 11)
    if (typeof window !== 'undefined' && (window as any).pendo) {
      const bookmarkAge = Math.floor(
        (new Date().getTime() - new Date(bookmark.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      ;(window as any).pendo.track('bookmark_edit_opened', {
        bookmark_id: bookmark.id,
        bookmark_age_days: bookmarkAge,
        priority_level: bookmark.priority,
        is_favorite: bookmark.isFavorite
      })
    }
  }

  const handleAddNew = () => {
    setEditingBookmark(undefined)
    setShowBookmarkForm(true)
    // Track bookmark_form_opened (Event 10)
    if (typeof window !== 'undefined' && (window as any).pendo) {
      ;(window as any).pendo.track('bookmark_form_opened', {
        form_mode: 'create',
        total_bookmarks_count: bookmarks.length
      })
    }
  }

  const updateFilters = (updates: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  if (isUsernameLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!username) {
    return <UsernamePrompt isOpen={true} onSubmit={setUsername} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-0.5">keeper</h1>
              <p className="text-xs text-muted-foreground">
                @{username} · {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleAddNew} size="sm">
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
              resultsCount={filteredBookmarks.length}
              totalBookmarks={bookmarks.length}
            />
            <FilterControls
              filters={filters}
              onChange={updateFilters}
              totalBookmarks={bookmarks.length}
              filteredCount={filteredBookmarks.length}
              favoriteBookmarksCount={bookmarks.filter(b => b.isFavorite).length}
            />
          </div>
        </div>

        {/* Bookmark grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading bookmarks...</p>
          </div>
        ) : filteredBookmarks.length === 0 && filters.query === '' && !filters.favoriteOnly ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-lg mb-2">No bookmarks yet</p>
            <p className="text-muted-foreground text-sm mb-4">
              Click "Add Bookmark" to create your first bookmark
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
            onDelete={loadBookmarks}
          />
        )}

        {/* Bookmark form dialog */}
        <BookmarkForm
          isOpen={showBookmarkForm}
          onClose={handleCloseForm}
          username={username}
          bookmark={editingBookmark}
        />
      </div>
    </div>
  )
}
