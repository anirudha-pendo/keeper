'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUsername } from '@/hooks/use-username'
import { getDashboardStats } from '@/app/actions/bookmarks'
import { StatsCard } from '@/components/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Bookmark01Icon,
  StarIcon,
  Tag01Icon,
  Folder01Icon,
  Add01Icon,
  ArrowRight01Icon,
  Upload04Icon,
} from '@hugeicons/core-free-icons'
import type { Bookmark } from '@/lib/types'

interface DashboardData {
  totalBookmarks: number
  favoritesCount: number
  tagsCount: number
  collectionsCount: number
  recentBookmarks: Bookmark[]
  topTags: { tag: string; count: number }[]
}

export default function DashboardPage() {
  const { username } = useUsername()
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (username) {
      loadStats()
    }
  }, [username])

  const loadStats = async () => {
    if (!username) return
    setIsLoading(true)
    const result = await getDashboardStats(username)
    if (result.success && result.data) {
      setStats(result.data)
    }
    setIsLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  if (!username) return null

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Welcome back, @{username}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard icon={Bookmark01Icon} label="Bookmarks" count={stats.totalBookmarks} href="/bookmarks" />
            <StatsCard icon={StarIcon} label="Favorites" count={stats.favoritesCount} href="/bookmarks" />
            <StatsCard icon={Tag01Icon} label="Tags" count={stats.tagsCount} href="/tags" />
            <StatsCard icon={Folder01Icon} label="Collections" count={stats.collectionsCount} href="/collections" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent bookmarks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Recent Bookmarks</CardTitle>
                  <Link
                    href="/bookmarks"
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    data-tracking-id="dashboard-view-all-bookmarks"
                  >
                    View all
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {stats.recentBookmarks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No bookmarks yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentBookmarks.map((bookmark) => (
                      <Link
                        key={bookmark.id}
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-md p-2 -mx-2 hover:bg-accent transition-colors"
                        data-tracking-id="dashboard-recent-bookmark"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{bookmark.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {new URL(bookmark.url).hostname}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(bookmark.createdAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top tags + quick actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Top Tags</CardTitle>
                    <Link
                      href="/tags"
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                      data-tracking-id="dashboard-view-all-tags"
                    >
                      View all
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {stats.topTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No tags yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {stats.topTags.map(({ tag, count }) => (
                        <Link
                          key={tag}
                          href={`/bookmarks?tag=${encodeURIComponent(tag)}`}
                          data-tracking-id="dashboard-top-tag"
                        >
                          <Badge variant="secondary" className="text-[10px] h-5 px-2 cursor-pointer hover:bg-accent">
                            {tag} ({count})
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    <Link href="/bookmarks" data-tracking-id="dashboard-quick-action-add-bookmark">
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-2 h-3.5 w-3.5" />
                        Add Bookmark
                      </Button>
                    </Link>
                    <Link href="/settings" data-tracking-id="dashboard-quick-action-import">
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                        <HugeiconsIcon icon={Upload04Icon} strokeWidth={2} className="mr-2 h-3.5 w-3.5" />
                        Import Bookmarks
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
