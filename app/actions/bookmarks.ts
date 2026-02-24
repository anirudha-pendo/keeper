'use server'

import { revalidatePath } from 'next/cache'
import { getUserBookmarks, addBookmark, updateBookmark as dbUpdateBookmark, deleteBookmark as dbDeleteBookmark, getAllTags, getUser } from '@/lib/bookmarks-db'
import type { Bookmark, BookmarkInput, ServerActionResult } from '@/lib/types'

export interface VisitorMetadata {
  createdAt: string | null
  bookmarkCount: number
  favoriteBookmarkCount: number
  uniqueTagCount: number
  tags: string[]
  highestPriorityUsed: number
  lastBookmarkCreatedAt: string | null
  lastBookmarkUpdatedAt: string | null
}

export async function getVisitorMetadata(username: string): Promise<ServerActionResult<VisitorMetadata>> {
  try {
    const user = await getUser(username)
    const bookmarks = user ? Object.values(user.bookmarks) : []
    const tags = await getAllTags(username)

    const metadata: VisitorMetadata = {
      createdAt: user?.createdAt ?? null,
      bookmarkCount: bookmarks.length,
      favoriteBookmarkCount: bookmarks.filter(b => b.isFavorite).length,
      uniqueTagCount: tags.length,
      tags,
      highestPriorityUsed: bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.priority)) : 0,
      lastBookmarkCreatedAt: bookmarks.length > 0
        ? bookmarks.reduce((latest, b) => b.createdAt > latest ? b.createdAt : latest, bookmarks[0].createdAt)
        : null,
      lastBookmarkUpdatedAt: bookmarks.length > 0
        ? bookmarks.reduce((latest, b) => b.updatedAt > latest ? b.updatedAt : latest, bookmarks[0].updatedAt)
        : null,
    }

    return { success: true, data: metadata }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

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
    revalidatePath('/')
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
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteBookmark(username: string, id: string): Promise<ServerActionResult<void>> {
  try {
    await dbDeleteBookmark(username, id)
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleFavorite(username: string, id: string, currentState: boolean): Promise<ServerActionResult<void>> {
  try {
    await dbUpdateBookmark(username, id, { isFavorite: !currentState })
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
