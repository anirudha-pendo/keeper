'use client'

import { useEffect, useRef } from 'react'
import { getUserInfo } from '@/app/actions/bookmarks'

interface PendoInitializerProps {
  username: string
}

export function PendoInitializer({ username }: PendoInitializerProps) {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current || !username) return
    initializedRef.current = true

    async function initPendo() {
      const result = await getUserInfo(username)
      const createdAt = result.success && result.data ? result.data.createdAt : undefined

      pendo.initialize({
        visitor: {
          id: username,
          createdAt: createdAt,
        },
      })
    }

    initPendo()
  }, [username])

  return null
}
