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
  const startTime = Date.now()

  try {
    // Validate URL
    let url: URL
    try {
      url = new URL(data.url)
    } catch {
      // Track API validation error
      return {
        success: false,
        error: 'Invalid URL format',
        trackingData: {
          event: 'api_bookmark_create_error',
          username: username,
          error_type: 'validation_error',
          error_message: 'Invalid URL format',
          url_attempted: data.url
        }
      }
    }

    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      ...data,
      favicon: `${url.origin}/favicon.ico`,
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Get current bookmarks to check for milestones
    const existingBookmarks = await getUserBookmarks(username)
    const isFirstBookmark = existingBookmarks.length === 0
    const newTotalCount = existingBookmarks.length + 1

    await addBookmark(username, bookmark)
    revalidatePath('/')

    const responseTime = Date.now() - startTime

    // Check for milestone achievements
    const milestones = [5, 10, 25, 50, 100]
    const milestoneReached = milestones.includes(newTotalCount)

    // Return bookmark data with tracking metadata
    return {
      success: true,
      data: bookmark,
      trackingData: {
        // For bookmark_created event
        username: username,
        bookmark_id: bookmark.id,
        has_description: !!bookmark.description,
        tags_count: bookmark.tags.length,
        is_favorite: bookmark.isFavorite,
        priority: bookmark.priority,
        url_domain: url.hostname,
        creation_source: 'bookmark_form',

        // API success event data
        api_event: 'api_bookmark_create_success',
        api_username: username,
        api_bookmark_id: bookmark.id,
        response_time_ms: responseTime,

        // Milestone data
        is_first_bookmark: isFirstBookmark,
        milestone_reached: milestoneReached,
        milestone_count: milestoneReached ? newTotalCount : undefined,
        new_total_count: newTotalCount
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      error: error.message,
      trackingData: {
        event: 'api_bookmark_create_error',
        username: username,
        error_type: 'system_error',
        error_message: error.message,
        url_attempted: data.url,
        response_time_ms: responseTime
      }
    }
  }
}

export async function updateBookmark(username: string, id: string, data: Partial<BookmarkInput>): Promise<ServerActionResult<void>> {
  const startTime = Date.now()

  try {
    const updates: Partial<Bookmark> = { ...data }

    // Validate URL if provided and update favicon
    if (data.url) {
      try {
        const url = new URL(data.url)
        updates.favicon = `${url.origin}/favicon.ico`
      } catch {
        const responseTime = Date.now() - startTime
        return {
          success: false,
          error: 'Invalid URL format',
          trackingData: {
            event: 'api_bookmark_update_error',
            username: username,
            bookmark_id: id,
            error_type: 'validation_error',
            error_message: 'Invalid URL format',
            response_time_ms: responseTime
          }
        }
      }
    }

    await dbUpdateBookmark(username, id, updates)
    revalidatePath('/')

    const responseTime = Date.now() - startTime

    // Return tracking metadata
    const fieldsUpdated = Object.keys(data).filter(key => data[key as keyof BookmarkInput] !== undefined)
    return {
      success: true,
      trackingData: {
        // For bookmark_updated event
        username: username,
        bookmark_id: id,
        fields_changed: fieldsUpdated.join(','),
        has_description: data.description !== undefined ? !!data.description : undefined,
        tags_count: data.tags?.length,
        is_favorite: data.isFavorite,
        priority: data.priority,
        time_since_creation: undefined, // Would need bookmark creation date

        // API success event data
        api_event: 'api_bookmark_update_success',
        api_username: username,
        api_bookmark_id: id,
        response_time_ms: responseTime
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      error: error.message,
      trackingData: {
        event: 'api_bookmark_update_error',
        username: username,
        bookmark_id: id,
        error_type: 'system_error',
        error_message: error.message,
        response_time_ms: responseTime
      }
    }
  }
}

export async function deleteBookmark(username: string, id: string): Promise<ServerActionResult<void>> {
  const startTime = Date.now()

  try {
    await dbDeleteBookmark(username, id)
    revalidatePath('/')

    const responseTime = Date.now() - startTime

    return {
      success: true,
      trackingData: {
        event: 'api_bookmark_delete_success',
        username: username,
        bookmark_id: id,
        response_time_ms: responseTime
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      error: error.message,
      trackingData: {
        event: 'api_bookmark_delete_error',
        username: username,
        bookmark_id: id,
        error_message: error.message,
        response_time_ms: responseTime
      }
    }
  }
}

export async function toggleFavorite(username: string, id: string, currentState: boolean): Promise<ServerActionResult<void>> {
  const startTime = Date.now()

  try {
    await dbUpdateBookmark(username, id, { isFavorite: !currentState })
    revalidatePath('/')

    const responseTime = Date.now() - startTime
    const newState = !currentState

    return {
      success: true,
      trackingData: {
        event: 'api_toggle_favorite_success',
        username: username,
        bookmark_id: id,
        new_state: newState,
        response_time_ms: responseTime
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      error: error.message,
      trackingData: {
        event: 'api_toggle_favorite_error',
        username: username,
        bookmark_id: id,
        error_message: error.message,
        response_time_ms: responseTime
      }
    }
  }
}
