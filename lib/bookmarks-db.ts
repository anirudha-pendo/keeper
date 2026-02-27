import fs from 'fs/promises'
import path from 'path'
import type { Bookmark, BookmarksData, Collection, User } from './types'

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

function ensureUserCollections(user: User): void {
  if (!user.collections) {
    user.collections = {}
  }
}

export async function getUserCreatedAt(username: string): Promise<string | null> {
  const data = await readBookmarksFile()
  const user = data.users[username]
  return user?.createdAt ?? null
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
      collections: {},
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

export async function clearUserBookmarks(username: string): Promise<void> {
  const data = await readBookmarksFile()
  if (data.users[username]) {
    data.users[username].bookmarks = {}
    await writeBookmarksFile(data)
  }
}

export async function getAllTags(username: string): Promise<string[]> {
  const bookmarks = await getUserBookmarks(username)
  const tagsSet = new Set<string>()
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagsSet.add(tag))
  })
  return Array.from(tagsSet).sort()
}

export async function findBookmarkByUrl(username: string, url: string): Promise<Bookmark | null> {
  const bookmarks = await getUserBookmarks(username)
  try {
    const normalizedUrl = new URL(url).href
    return bookmarks.find((b) => {
      try {
        return new URL(b.url).href === normalizedUrl
      } catch {
        return b.url === url
      }
    }) || null
  } catch {
    return bookmarks.find((b) => b.url === url) || null
  }
}

export async function bulkAddBookmarks(username: string, bookmarks: Bookmark[]): Promise<number> {
  const data = await readBookmarksFile()

  if (!data.users[username]) {
    data.users[username] = {
      username,
      createdAt: new Date().toISOString(),
      bookmarks: {},
      collections: {},
    }
  }

  let added = 0
  for (const bookmark of bookmarks) {
    data.users[username].bookmarks[bookmark.id] = bookmark
    added++
  }

  await writeBookmarksFile(data)
  return added
}

// Collection CRUD
export async function getUserCollections(username: string): Promise<Collection[]> {
  const data = await readBookmarksFile()
  const user = data.users[username]
  if (!user) return []
  ensureUserCollections(user)
  return Object.values(user.collections)
}

export async function addCollection(username: string, collection: Collection): Promise<void> {
  const data = await readBookmarksFile()

  if (!data.users[username]) {
    data.users[username] = {
      username,
      createdAt: new Date().toISOString(),
      bookmarks: {},
      collections: {},
    }
  }

  ensureUserCollections(data.users[username])
  data.users[username].collections[collection.id] = collection
  await writeBookmarksFile(data)
}

export async function updateCollection(username: string, id: string, updates: Partial<Collection>): Promise<void> {
  const data = await readBookmarksFile()
  ensureUserCollections(data.users[username])

  if (!data.users[username]?.collections[id]) {
    throw new Error('Collection not found')
  }

  data.users[username].collections[id] = {
    ...data.users[username].collections[id],
    ...updates,
    id,
  }

  await writeBookmarksFile(data)
}

export async function deleteCollection(username: string, id: string): Promise<void> {
  const data = await readBookmarksFile()
  ensureUserCollections(data.users[username])

  if (!data.users[username]?.collections[id]) {
    throw new Error('Collection not found')
  }

  delete data.users[username].collections[id]

  // Remove collectionId from bookmarks that reference it
  const bookmarks = data.users[username].bookmarks
  for (const bookmarkId of Object.keys(bookmarks)) {
    if (bookmarks[bookmarkId].collectionId === id) {
      bookmarks[bookmarkId].collectionId = undefined
    }
  }

  await writeBookmarksFile(data)
}
