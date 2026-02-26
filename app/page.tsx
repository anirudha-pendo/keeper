'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'

export default function Page() {
  const { username, isLoading } = useUsername()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      router.replace(username ? '/dashboard' : '/auth')
    }
  }, [isLoading, username, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  )
}
