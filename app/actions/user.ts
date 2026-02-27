'use server'

import { getUserCreatedAt } from '@/lib/bookmarks-db'

export async function fetchUserCreatedAt(username: string): Promise<string | null> {
  return getUserCreatedAt(username)
}
