'use client'

import { AuthGuard } from '@/components/auth-guard'
import { AppNav } from '@/components/app-nav'
import { PendoInitializer } from '@/components/pendo-initializer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {(username) => (
        <div className="min-h-screen bg-background">
          <PendoInitializer username={username} />
          <AppNav username={username} />
          <main>{children}</main>
        </div>
      )}
    </AuthGuard>
  )
}
