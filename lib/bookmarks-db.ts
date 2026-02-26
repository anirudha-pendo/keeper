import type { Bookmark, BookmarksData, Collection, User } from './types'

const STORAGE_KEY = 'keeper-bookmarks-data'

const DEFAULT_DATA: BookmarksData = {
  users: {},
  metadata: {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
  },
}

function readData(): BookmarksData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_DATA)
    return JSON.parse(raw)
  } catch {
    return structuredClone(DEFAULT_DATA)
  }
}

function writeData(data: BookmarksData): void {
  data.metadata.lastModified = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function ensureUserCollections(user: User): void {
  if (!user.collections) {
    user.collections = {}
  }
}

export async function getUserBookmarks(username: string): Promise<Bookmark[]> {
  const data = readData()
  const user = data.users[username]
  if (!user) return []
  return Object.values(user.bookmarks)
}

export async function addBookmark(username: string, bookmark: Bookmark): Promise<void> {
  const data = readData()

  if (!data.users[username]) {
    data.users[username] = {
      username,
      createdAt: new Date().toISOString(),
      bookmarks: {},
      collections: {},
    }
  }

  data.users[username].bookmarks[bookmark.id] = bookmark
  writeData(data)
}

export async function updateBookmark(username: string, id: string, updates: Partial<Bookmark>): Promise<void> {
  const data = readData()

  if (!data.users[username]?.bookmarks[id]) {
    throw new Error('Bookmark not found')
  }

  data.users[username].bookmarks[id] = {
    ...data.users[username].bookmarks[id],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  }

  writeData(data)
}

export async function deleteBookmark(username: string, id: string): Promise<void> {
  const data = readData()

  if (!data.users[username]?.bookmarks[id]) {
    throw new Error('Bookmark not found')
  }

  delete data.users[username].bookmarks[id]
  writeData(data)
}

export async function clearUserBookmarks(username: string): Promise<void> {
  const data = readData()
  if (data.users[username]) {
    data.users[username].bookmarks = {}
    writeData(data)
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
  const data = readData()

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

  writeData(data)
  return added
}

// Collection CRUD
export async function getUserCollections(username: string): Promise<Collection[]> {
  const data = readData()
  const user = data.users[username]
  if (!user) return []
  ensureUserCollections(user)
  return Object.values(user.collections)
}

export async function addCollection(username: string, collection: Collection): Promise<void> {
  const data = readData()

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
  writeData(data)
}

export async function updateCollection(username: string, id: string, updates: Partial<Collection>): Promise<void> {
  const data = readData()
  ensureUserCollections(data.users[username])

  if (!data.users[username]?.collections[id]) {
    throw new Error('Collection not found')
  }

  data.users[username].collections[id] = {
    ...data.users[username].collections[id],
    ...updates,
    id,
  }

  writeData(data)
}

export async function deleteCollection(username: string, id: string): Promise<void> {
  const data = readData()
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

  writeData(data)
}
