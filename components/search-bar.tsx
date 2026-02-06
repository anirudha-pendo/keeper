'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search bookmarks...' }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedInput = inputValue.trim()
      const trimmedPrevious = previousValue.trim()

      onChange(inputValue)

      // Track search performed event (only if there's a query)
      if (trimmedInput.length > 0 && typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('search_performed', {
          search_query: trimmedInput,
          query_length: trimmedInput.length,
          results_count: -1, // Would need parent context
          total_bookmarks: -1, // Would need parent context
          has_active_filters: false // Would need parent context
        })
      }

      // Track search cleared event (when query goes from having content to empty)
      if (trimmedPrevious.length > 0 && trimmedInput.length === 0 && typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('search_cleared', {
          previous_query_length: trimmedPrevious.length,
          time_searching_seconds: 0 // Would need to track search start time
        })
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
