'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'

export default function Page() {
  const { username, isLoading } = useUsername()
  const router = useRouter()

  // Pendo Track Event: bookmarks_searched
  useEffect(() => {
    if (filters.query.trim().length > 0 && typeof window !== 'undefined' && window.pendo) {
      window.pendo.track('bookmarks_searched', {
        query_length: filters.query.trim().length,
        results_count: filteredBookmarks.length,
        total_bookmarks: bookmarks.length,
        has_results: filteredBookmarks.length > 0,
      })
    }
  }, [filters.query])

  useEffect(() => {
    if (!isLoading) {
      router.replace(username ? '/dashboard' : '/auth')
    }
  }, [isLoading, username, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  )
}
