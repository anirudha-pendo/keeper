'use client'

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@hugeicons/core-free-icons'
import type { FilterOptions } from '@/lib/types'

interface FilterControlsProps {
  filters: FilterOptions
  onChange: (filters: Partial<FilterOptions>) => void
  totalBookmarks?: number
  filteredCount?: number
  favoriteBookmarksCount?: number
}

export function FilterControls({ filters, onChange, totalBookmarks = 0, filteredCount = 0, favoriteBookmarksCount = 0 }: FilterControlsProps) {
  const handleSortChange = (value: string) => {
    // Track sort_changed (Event 16)
    if (typeof window !== 'undefined' && (window as any).pendo) {
      ;(window as any).pendo.track('sort_changed', {
        previous_sort: filters.sortBy,
        new_sort: value,
        total_bookmarks: totalBookmarks,
        filtered_count: filteredCount
      })
    }
    onChange({ sortBy: value as FilterOptions['sortBy'] })
  }

  const handleFavoritesToggle = () => {
    const newState = !filters.favoriteOnly
    // Track favorites_filter_enabled (Event 17) or favorites_filter_disabled (Event 18)
    if (typeof window !== 'undefined' && (window as any).pendo) {
      if (newState) {
        ;(window as any).pendo.track('favorites_filter_enabled', {
          total_bookmarks: totalBookmarks,
          favorite_bookmarks_count: favoriteBookmarksCount,
          current_sort: filters.sortBy
        })
      } else {
        ;(window as any).pendo.track('favorites_filter_disabled', {
          total_bookmarks: totalBookmarks,
          favorite_bookmarks_count: favoriteBookmarksCount,
          current_sort: filters.sortBy
        })
      }
    }
    onChange({ favoriteOnly: newState })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sort */}
      <Select
        value={filters.sortBy}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="alphabetical">Alphabetical</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      {/* Favorites toggle */}
      <Button
        variant={filters.favoriteOnly ? 'default' : 'outline'}
        onClick={handleFavoritesToggle}
      > 
        <HugeiconsIcon
          icon={StarIcon}
          strokeWidth={2}
          className={filters.favoriteOnly ? 'fill-current mr-2' : 'mr-2'}
        />
        Favorites
      </Button>
    </div>
  )
}
