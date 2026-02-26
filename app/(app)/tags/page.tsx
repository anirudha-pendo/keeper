'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'
import { getBookmarks } from '@/app/actions/bookmarks'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Bookmark } from '@/lib/types'

export default function TagsPage() {
  const { username } = useUsername()
  const router = useRouter()
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (username) {
      loadTags()
    }
  }, [username])

  const loadTags = async () => {
    if (!username) return
    setIsLoading(true)
    const result = await getBookmarks(username)
    if (result.success && result.data) {
      const counts: Record<string, number> = {}
      result.data.forEach((bookmark: Bookmark) => {
        bookmark.tags.forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1
        })
      })
      setTagCounts(counts)
    }
    setIsLoading(false)
  }

  const handleTagClick = (tag: string) => {
    router.push(`/bookmarks?tag=${encodeURIComponent(tag)}`)
  }

  if (!username) return null

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Tags</h1>
        <p className="text-xs text-muted-foreground">
          {sortedTags.length} tag{sortedTags.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading tags...</p>
        </div>
      ) : sortedTags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg mb-2">No tags yet</p>
          <p className="text-muted-foreground text-sm">
            Add tags to your bookmarks to organize them
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedTags.map(([tag, count]) => (
            <Card
              key={tag}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleTagClick(tag)}
              data-tracking-id="tag-card"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium truncate">{tag}</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-2 ml-2 shrink-0">
                  {count}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
