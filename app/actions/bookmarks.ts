'use server'

import { revalidatePath } from 'next/cache'
import { getUserBookmarks, addBookmark, updateBookmark as dbUpdateBookmark, deleteBookmark as dbDeleteBookmark, getAllTags, getUserMetadata } from '@/lib/bookmarks-db'
import type { Bookmark, BookmarkInput, ServerActionResult } from '@/lib/types'

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

export async function getVisitorMetadata(username: string): Promise<ServerActionResult<{
  createdAt: string | null
  bookmarkCount: number
  tagCount: number
  favoriteCount: number
  tags: string[]
}>> {
  try {
    const metadata = await getUserMetadata(username)
    return { success: true, data: metadata }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
