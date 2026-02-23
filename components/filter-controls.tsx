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
  return (
    <div className="flex items-center gap-2">
      {/* Sort */}
      <Select
        value={filters.sortBy}
        onValueChange={(value) => {
          pendo.track('sort_changed', {
            sort_by: value,
            previous_sort_by: filters.sortBy,
          })
          onChange({ sortBy: value as FilterOptions['sortBy'] })
        }}
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
        onClick={() => {
          pendo.track('favorites_filter_toggled', {
            new_filter_state: !filters.favoriteOnly,
          })
          onChange({ favoriteOnly: !filters.favoriteOnly })
        }}
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
