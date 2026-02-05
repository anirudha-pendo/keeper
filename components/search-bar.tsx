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

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue)

      // Track search performed event (only if there's a query)
      if (inputValue.trim().length > 0 && typeof window !== 'undefined' && (window as any).pendo) {
        // Note: We can't determine results_count here since filtering happens in parent
        // This will be tracked with available data
        (window as any).pendo.track('search_performed', {
          query_length: inputValue.trim().length
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, onChange])

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
