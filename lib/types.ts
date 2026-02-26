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
  collectionId?: string
  createdAt: string
  updatedAt: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  color: string
  createdAt: string
}

export interface User {
  username: string
  createdAt: string
  bookmarks: Record<string, Bookmark>
  collections: Record<string, Collection>
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
  collectionId?: string
}

export interface FilterOptions {
  query: string
  favoriteOnly: boolean
  sortBy: 'recent' | 'oldest' | 'alphabetical' | 'priority'
  selectedTags: string[]
  collectionId?: string
}

export interface ServerActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
