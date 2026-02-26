import type { BookmarkInput } from './types'

export function parseJsonImport(content: string): BookmarkInput[] {
  const data = JSON.parse(content)

  // Handle array of bookmarks (app's own export format)
  const items = Array.isArray(data) ? data : data.bookmarks || []

  return items
    .filter((item: any) => item.url && item.title)
    .map((item: any): BookmarkInput => ({
      url: item.url,
      title: item.title,
      description: item.description || undefined,
      tags: Array.isArray(item.tags) ? item.tags : [],
      isFavorite: item.isFavorite || false,
      priority: typeof item.priority === 'number' && item.priority >= 0 && item.priority <= 5
        ? item.priority as BookmarkInput['priority']
        : 0,
      collectionId: item.collectionId || undefined,
    }))
}

export function parseHtmlImport(content: string): BookmarkInput[] {
  const bookmarks: BookmarkInput[] = []

  // Parse browser bookmark HTML format (<DT><A HREF="...">title</A>)
  const regex = /<A\s+HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi
  let match

  while ((match = regex.exec(content)) !== null) {
    const url = match[1]
    const title = match[2].trim()

    if (url && title) {
      try {
        new URL(url) // Validate URL
        bookmarks.push({
          url,
          title,
          tags: [],
          isFavorite: false,
          priority: 0,
        })
      } catch {
        // Skip invalid URLs
      }
    }
  }

  return bookmarks
}
