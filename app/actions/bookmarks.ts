import {
  getUserBookmarks,
  addBookmark,
  updateBookmark as dbUpdateBookmark,
  deleteBookmark as dbDeleteBookmark,
  getAllTags,
  findBookmarkByUrl,
  bulkAddBookmarks,
  getUserCollections,
  addCollection as dbAddCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
  getUserCreatedAt,
} from '@/lib/bookmarks-db'
import type { Bookmark, BookmarkInput, Collection, ServerActionResult } from '@/lib/types'

export async function getBookmarks(username: string): Promise<ServerActionResult<Bookmark[]>> {
  try {
    const bookmarks = await getUserBookmarks(username)
    return { success: true, data: bookmarks }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTags(username: string): Promise<ServerActionResult<string[]>> {
  try {
    const tags = await getAllTags(username)
    return { success: true, data: tags }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createBookmark(username: string, data: BookmarkInput): Promise<ServerActionResult<Bookmark>> {
  try {
    // Validate URL
    let url: URL
    try {
      url = new URL(data.url)
    } catch {
      return { success: false, error: 'Invalid URL format' }
    }

    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      ...data,
      favicon: `${url.origin}/favicon.ico`,
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await addBookmark(username, bookmark)
    return { success: true, data: bookmark }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateBookmark(username: string, id: string, data: Partial<BookmarkInput>): Promise<ServerActionResult<void>> {
  try {
    const updates: Partial<Bookmark> = { ...data }

    // Validate URL if provided and update favicon
    if (data.url) {
      try {
        const url = new URL(data.url)
        updates.favicon = `${url.origin}/favicon.ico`
      } catch {
        return { success: false, error: 'Invalid URL format' }
      }
    }

    await dbUpdateBookmark(username, id, updates)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteBookmark(username: string, id: string): Promise<ServerActionResult<void>> {
  try {
    await dbDeleteBookmark(username, id)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleFavorite(username: string, id: string, currentState: boolean): Promise<ServerActionResult<void>> {
  try {
    await dbUpdateBookmark(username, id, { isFavorite: !currentState })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Duplicate detection
export async function checkDuplicateUrl(username: string, url: string): Promise<ServerActionResult<Bookmark | null>> {
  try {
    const existing = await findBookmarkByUrl(username, url)
    return { success: true, data: existing }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function checkDuplicateUrls(username: string, urls: string[]): Promise<ServerActionResult<Set<string>>> {
  try {
    const bookmarks = await getUserBookmarks(username)
    const existingUrls = new Set<string>()
    bookmarks.forEach((b) => {
      try {
        existingUrls.add(new URL(b.url).href)
      } catch {
        existingUrls.add(b.url)
      }
    })

    const duplicates = new Set<string>()
    urls.forEach((url) => {
      try {
        if (existingUrls.has(new URL(url).href)) {
          duplicates.add(url)
        }
      } catch {
        if (existingUrls.has(url)) {
          duplicates.add(url)
        }
      }
    })

    return { success: true, data: duplicates }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Import
export async function importBookmarks(username: string, inputs: BookmarkInput[]): Promise<ServerActionResult<{ imported: number; skipped: number }>> {
  try {
    const bookmarks = await getUserBookmarks(username)
    const existingUrls = new Set<string>()
    bookmarks.forEach((b) => {
      try {
        existingUrls.add(new URL(b.url).href)
      } catch {
        existingUrls.add(b.url)
      }
    })

    const newBookmarks: Bookmark[] = []
    let skipped = 0

    for (const input of inputs) {
      let normalizedUrl: string
      try {
        normalizedUrl = new URL(input.url).href
      } catch {
        skipped++
        continue
      }

      if (existingUrls.has(normalizedUrl)) {
        skipped++
        continue
      }

      existingUrls.add(normalizedUrl)

      const url = new URL(input.url)
      newBookmarks.push({
        id: crypto.randomUUID(),
        ...input,
        favicon: `${url.origin}/favicon.ico`,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    if (newBookmarks.length > 0) {
      await bulkAddBookmarks(username, newBookmarks)
    }

    return { success: true, data: { imported: newBookmarks.length, skipped } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Collections
export async function getCollections(username: string): Promise<ServerActionResult<Collection[]>> {
  try {
    const collections = await getUserCollections(username)
    return { success: true, data: collections }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createCollection(username: string, data: { name: string; description?: string; color: string }): Promise<ServerActionResult<Collection>> {
  try {
    const collection: Collection = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      color: data.color,
      createdAt: new Date().toISOString(),
    }

    await dbAddCollection(username, collection)
    return { success: true, data: collection }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateCollection(username: string, id: string, data: { name?: string; description?: string; color?: string }): Promise<ServerActionResult<void>> {
  try {
    await dbUpdateCollection(username, id, data)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteCollection(username: string, id: string): Promise<ServerActionResult<void>> {
  try {
    await dbDeleteCollection(username, id)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Dashboard
export async function getDashboardStats(username: string): Promise<ServerActionResult<{
  totalBookmarks: number
  favoritesCount: number
  tagsCount: number
  collectionsCount: number
  collections: Collection[]
  recentBookmarks: Bookmark[]
  topTags: { tag: string; count: number }[]
}>> {
  try {
    const [bookmarks, collections] = await Promise.all([
      getUserBookmarks(username),
      getUserCollections(username),
    ])

    const favoritesCount = bookmarks.filter((b) => b.isFavorite).length

    const tagCounts: Record<string, number> = {}
    bookmarks.forEach((b) => {
      b.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))

    const recentBookmarks = [...bookmarks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    return {
      success: true,
      data: {
        totalBookmarks: bookmarks.length,
        favoritesCount,
        tagsCount: Object.keys(tagCounts).length,
        collectionsCount: collections.length,
        collections,
        recentBookmarks,
        topTags,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getVisitorMetadata(username: string): Promise<ServerActionResult<{ createdAt: string | null }>> {
  try {
    const createdAt = await getUserCreatedAt(username)
    return { success: true, data: { createdAt } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
