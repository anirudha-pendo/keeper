'use client'

import { AuthGuard } from '@/components/auth-guard'
import { AppNav } from '@/components/app-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
