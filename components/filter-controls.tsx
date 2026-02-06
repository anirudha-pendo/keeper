'use client'

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@hugeicons/core-free-icons'
import type { FilterOptions } from '@/lib/types'

interface FilterControlsProps {
  filters: FilterOptions
  onChange: (filters: Partial<FilterOptions>) => void
}

export function FilterControls({ filters, onChange }: FilterControlsProps) {
  const handleSortChange = (value: string) => {
    const previousSortMethod = filters.sortBy
    const newSortMethod = value as FilterOptions['sortBy']

    // Track sort changed
    if (typeof window !== 'undefined' && (window as any).pendo) {
      (window as any).pendo.track('filter_sort_changed', {
        sort_type: newSortMethod,
        previous_sort_type: previousSortMethod,
        total_bookmarks: -1, // Would need parent context
        has_search_query: filters.query.length > 0,
        favorites_only_active: filters.favoriteOnly
      })
    }

    onChange({ sortBy: newSortMethod })
  }

  const handleFavoritesToggle = () => {
    const newState = !filters.favoriteOnly

    // Track favorites filter toggled
    if (typeof window !== 'undefined' && (window as any).pendo) {
      (window as any).pendo.track('favorites_filter_toggled', {
        filter_state: newState ? 'enabled' : 'disabled',
        total_favorites: -1, // Would need parent context
        total_bookmarks: -1, // Would need parent context
        has_search_query: filters.query.length > 0,
        current_sort: filters.sortBy
      })
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
