'use server'

import { revalidatePath } from 'next/cache'
import { getUserBookmarks, addBookmark, updateBookmark as dbUpdateBookmark, deleteBookmark as dbDeleteBookmark, getAllTags } from '@/lib/bookmarks-db'
import type { Bookmark, BookmarkInput, ServerActionResult } from '@/lib/types'

export async function getBookmarks(username: string): Promise<ServerActionResult<Bookmark[]>> {
  try {
    const startTime = Date.now()
    const bookmarks = await getUserBookmarks(username)
    const loadTime = Date.now() - startTime

    return { success: true, data: bookmarks, trackingData: {
      bookmarks_count: bookmarks.length,
      load_time_ms: loadTime,
      username: username
    }}
  } catch (error: any) {
    return { success: false, error: error.message, trackingData: {
      error_message: error.message,
      error_type: error.name || 'unknown',
      username: username
    }}
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

    // Return bookmark data with tracking metadata
    return { success: true, data: bookmark, trackingData: {
      bookmark_id: bookmark.id,
      has_description: !!bookmark.description,
      has_tags: bookmark.tags.length > 0,
      tags_count: bookmark.tags.length,
      priority: bookmark.priority,
      is_favorite: bookmark.isFavorite,
      url_domain: url.hostname
    }}
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

    // Return tracking metadata
    const fieldsUpdated = Object.keys(data).filter(key => data[key as keyof BookmarkInput] !== undefined)
    return { success: true, trackingData: {
      bookmark_id: id,
      fields_updated: fieldsUpdated,
      has_description: data.description !== undefined ? !!data.description : undefined,
      has_tags: data.tags !== undefined ? data.tags.length > 0 : undefined,
      tags_count: data.tags?.length,
      priority: data.priority,
      is_favorite: data.isFavorite
    }}
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
