'use client'

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import type { FilterOptions, Collection } from '@/lib/types'

interface FilterControlsProps {
  filters: FilterOptions
  onChange: (filters: Partial<FilterOptions>) => void
  availableTags?: string[]
  collections?: Collection[]
}

export function FilterControls({ filters, onChange, availableTags = [], collections = [] }: FilterControlsProps) {
  const handleTagToggle = (tag: string) => {
    const current = filters.selectedTags || []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    onChange({ selectedTags: updated })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => {
            onChange({ sortBy: value as FilterOptions['sortBy'] })
          }}
        >
          <SelectTrigger className="w-[180px]" data-tracking-id="sort-bookmarks-select">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>

        {/* Collection filter */}
        {collections.length > 0 && (
          <Select
            value={filters.collectionId || '_all'}
            onValueChange={(value) => {
              onChange({ collectionId: value === '_all' ? undefined : value })
            }}
          >
            <SelectTrigger className="w-[180px]" data-tracking-id="collection-filter-select">
              <SelectValue placeholder="All Collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Collections</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Favorites toggle */}
        <Button
          variant={filters.favoriteOnly ? 'default' : 'outline'}
          onClick={() => {
            onChange({ favoriteOnly: !filters.favoriteOnly })
          }}
          data-tracking-id="favorites-filter-button"
        >
          <HugeiconsIcon
            icon={StarIcon}
            strokeWidth={2}
            className={filters.favoriteOnly ? 'fill-current mr-2' : 'mr-2'}
          />
          Favorites
        </Button>
      </div>

      {/* Tag filter chips */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground mr-1">Tags:</span>
          {availableTags.map((tag) => {
            const isActive = (filters.selectedTags || []).includes(tag)
            return (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className="inline-flex items-center"
                data-tracking-id="tag-filter-chip"
              >
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="text-[10px] h-5 px-2 cursor-pointer hover:bg-accent"
                >
                  {tag}
                  {isActive && (
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="h-2.5 w-2.5 ml-1" />
                  )}
                </Badge>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
