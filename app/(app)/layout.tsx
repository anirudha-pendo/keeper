'use client'

import { useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { AppNav } from '@/components/app-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleMindClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (target.closest('.mind')) {
        if (typeof pendo !== 'undefined') {
          pendo.track('mind_clicked')
        }
      }
    }

    document.addEventListener('click', handleMindClick)
    return () => document.removeEventListener('click', handleMindClick)
  }, [])

  return (
    <AuthGuard>
      {(username) => (
        <div className="min-h-screen bg-background">
          <AppNav username={username} />
          <main>{children}</main>
        </div>
      )}
    </AuthGuard>
  )
}
