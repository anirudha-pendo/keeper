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

  const loadBookmarks = async () => {
    if (!username) return
    setIsLoading(true)
    const result = await getBookmarks(username)
    if (result.success && result.data) {
      setBookmarks(result.data)
    }
    setIsLoading(false)
  }

  const handleCloseForm = () => {
    setShowBookmarkForm(false)
    setEditingBookmark(undefined)
    loadBookmarks()
  }

  const handleEdit = (bookmark: Bookmark) => {
    pendo.track('bookmark_form_opened', {
      form_mode: 'edit',
      bookmark_id: bookmark.id,
    })
    setEditingBookmark(bookmark)
    setShowBookmarkForm(true)
  }

  const handleAddNew = () => {
    pendo.track('bookmark_form_opened', {
      form_mode: 'create',
    })
    setEditingBookmark(undefined)
    setShowBookmarkForm(true)
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
            />
            <FilterControls
              filters={filters}
              onChange={updateFilters}
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
