export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  tags: string[]
  isFavorite: boolean
  priority: 0 | 1 | 2 | 3 | 4 | 5
  favicon: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface User {
  username: string
  createdAt: string
  bookmarks: Record<string, Bookmark>
}

export interface BookmarksData {
  users: Record<string, User>
  metadata: {
    version: string
    lastModified: string
  }
}

export interface BookmarkInput {
  url: string
  title: string
  description?: string
  tags: string[]
  isFavorite: boolean
  priority: 0 | 1 | 2 | 3 | 4 | 5
}

export interface FilterOptions {
  query: string
  favoriteOnly: boolean
  sortBy: 'recent' | 'oldest' | 'alphabetical' | 'priority'
}

export interface ServerActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
