'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'

interface AuthGuardProps {
  children: (username: string) => React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { username, isLoading } = useUsername()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !username) {
      router.replace('/auth')
    }
    if (!isLoading && username) {
      if (typeof pendo !== 'undefined') {
        pendo.identify({
          visitor: {
            id: username,
            full_name: username,
          },
        })
      }
    }
  }, [isLoading, username, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!username) {
    return null
  }

  return <>{children(username)}</>
}
