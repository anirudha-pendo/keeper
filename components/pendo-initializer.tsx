'use client'

import { useEffect, useRef } from 'react'
import { useUsername } from '@/hooks/use-username'
import { getUserCreatedAt } from '@/app/actions/bookmarks'

const ANON_ID_KEY = 'pendo-anonymous-id'

function getOrCreateAnonymousId(): string {
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = `anon-${crypto.randomUUID()}`
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

export function PendoInitializer() {
  const { username, isLoading } = useUsername()
  const pendoReadyRef = useRef(false)
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (!pendoReadyRef.current) {
      pendo.initialize({
        visitor: {
          id: username || getOrCreateAnonymousId(),
        },
      })
      pendoReadyRef.current = true
    }

    if (username && identifiedRef.current !== username) {
      identifiedRef.current = username
      getUserCreatedAt(username).then((result) => {
        const visitor: Record<string, any> = { id: username }
        if (result.success && result.data) {
          visitor.createdAt = result.data
        }
        pendo.identify({ visitor })
      })
    }
  }, [username, isLoading])

  return null
}
