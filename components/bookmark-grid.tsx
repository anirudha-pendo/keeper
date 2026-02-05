'use client'

import type { Bookmark } from '@/lib/types'
import { BookmarkCard } from './bookmark-card'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  username: string
  onEdit: (bookmark: Bookmark) => void
  onDelete: () => void
}

export function BookmarkGrid({ bookmarks, username, onEdit, onDelete }: BookmarkGridProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg mb-2">No bookmarks found</p>
        <p className="text-muted-foreground text-sm">
          Click "Add Bookmark" to create your first bookmark
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          username={username}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
