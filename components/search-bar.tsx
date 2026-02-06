'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultsCount?: number
  totalBookmarks?: number
}

export function SearchBar({ value, onChange, placeholder = 'Search bookmarks...', resultsCount = 0, totalBookmarks = 0 }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue)

      // Track search_performed (Event 14) and search_cleared (Event 15)
      if (typeof window !== 'undefined' && (window as any).pendo) {
        if (inputValue.trim() !== '' && previousValue !== inputValue) {
          // Track search_performed when user types a query
          ;(window as any).pendo.track('search_performed', {
            query_length: inputValue.trim().length,
            results_count: resultsCount,
            has_results: resultsCount > 0,
            total_bookmarks: totalBookmarks
          })
        } else if (inputValue.trim() === '' && previousValue.trim() !== '') {
          // Track search_cleared when user clears search
          ;(window as any).pendo.track('search_cleared', {
            previous_query_length: previousValue.length,
            had_results: resultsCount > 0
          })
        }
      }

      setPreviousValue(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, onChange, previousValue])

  return (
    <div className="relative">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4"
      />
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}
