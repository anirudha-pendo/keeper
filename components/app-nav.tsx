'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Bookmark01Icon,
  Settings01Icon,
  Logout03Icon,
  DashboardSquare01Icon,
  Tag01Icon,
  Folder01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardSquare01Icon },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark01Icon },
  { href: '/collections', label: 'Collections', icon: Folder01Icon },
  { href: '/tags', label: 'Tags', icon: Tag01Icon },
  { href: '/settings', label: 'Settings', icon: Settings01Icon },
]

export function AppNav({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { clearUsername } = useUsername()

  const handleLogout = () => {
    clearUsername()
    router.replace('/auth')
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-12 max-w-7xl items-center px-4">
        <Link
          href="/dashboard"
          className="mr-6 text-sm font-bold tracking-tight"
          data-tracking-id="nav-logo"
        >
          keeper
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-tracking-id={`nav-${link.label.toLowerCase()}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                pathname === link.href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <HugeiconsIcon icon={link.icon} strokeWidth={2} className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">@{username}</span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            data-tracking-id="nav-logout"
          >
            <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
