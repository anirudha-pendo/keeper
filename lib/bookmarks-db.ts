import fs from 'fs/promises'
import path from 'path'
import type { Bookmark, BookmarksData, User } from './types'

const DB_PATH = path.join(process.cwd(), 'data', 'bookmarks.json')

const DEFAULT_DATA: BookmarksData = {
  users: {},
  metadata: {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
  },
}

async function ensureDataDir() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
}

async function readBookmarksFile(): Promise<BookmarksData> {
  try {
    const content = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create with default structure
      await ensureDataDir()
      await writeBookmarksFile(DEFAULT_DATA)
      return DEFAULT_DATA
    }

    // Corrupted JSON - backup and recreate
    if (error instanceof SyntaxError) {
      const timestamp = Date.now()
      const backupPath = `${DB_PATH}.backup.${timestamp}`
      try {
        await fs.copyFile(DB_PATH, backupPath)
        console.warn(`Corrupted bookmarks.json backed up to ${backupPath}`)
      } catch (backupError) {
        console.error('Failed to backup corrupted file:', backupError)
      }
      await writeBookmarksFile(DEFAULT_DATA)
      return DEFAULT_DATA
    }

    throw error
  }
}

async function writeBookmarksFile(data: BookmarksData): Promise<void> {
  await ensureDataDir()
  const tempPath = `${DB_PATH}.tmp`
  data.metadata.lastModified = new Date().toISOString()
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tempPath, DB_PATH) // Atomic operation
}

export async function getUserBookmarks(username: string): Promise<Bookmark[]> {
  const data = await readBookmarksFile()
  const user = data.users[username]
  if (!user) {
    return []
  }
  return Object.values(user.bookmarks)
}

export async function addBookmark(username: string, bookmark: Bookmark): Promise<void> {
  const data = await readBookmarksFile()

  if (!data.users[username]) {
    data.users[username] = {
      username,
      createdAt: new Date().toISOString(),
      bookmarks: {},
    }
  }

  data.users[username].bookmarks[bookmark.id] = bookmark
  await writeBookmarksFile(data)
}

export async function updateBookmark(username: string, id: string, updates: Partial<Bookmark>): Promise<void> {
  const data = await readBookmarksFile()

  if (!data.users[username]?.bookmarks[id]) {
    throw new Error('Bookmark not found')
  }

  data.users[username].bookmarks[id] = {
    ...data.users[username].bookmarks[id],
    ...updates,
    id, // Ensure id cannot be changed
    updatedAt: new Date().toISOString(),
  }

  await writeBookmarksFile(data)
}

export async function deleteBookmark(username: string, id: string): Promise<void> {
  const data = await readBookmarksFile()

  if (!data.users[username]?.bookmarks[id]) {
    throw new Error('Bookmark not found')
  }

  delete data.users[username].bookmarks[id]
  await writeBookmarksFile(data)
}

export async function getAllTags(username: string): Promise<string[]> {
  const bookmarks = await getUserBookmarks(username)
  const tagsSet = new Set<string>()
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagsSet.add(tag))
  })
  return Array.from(tagsSet).sort()
}

export async function getUserMetadata(username: string): Promise<{
  createdAt: string | null
  bookmarkCount: number
  tagCount: number
  favoriteCount: number
  tags: string[]
}> {
  const data = await readBookmarksFile()
  const user = data.users[username]
  if (!user) {
    return { createdAt: null, bookmarkCount: 0, tagCount: 0, favoriteCount: 0, tags: [] }
  }
  const bookmarks = Object.values(user.bookmarks)
  const tagsSet = new Set<string>()
  let favoriteCount = 0
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagsSet.add(tag))
    if (bookmark.isFavorite) favoriteCount++
  })
  const tags = Array.from(tagsSet).sort()
  return {
    createdAt: user.createdAt,
    bookmarkCount: bookmarks.length,
    tagCount: tags.length,
    favoriteCount,
    tags,
  }
}
