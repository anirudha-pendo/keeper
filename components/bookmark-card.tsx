'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalIcon,
  StarIcon,
  EditIcon,
  DeleteIcon,
  ExternalLink,
  Flag01Icon,
  ArrowUp01Icon,
  MinusSignIcon,
  ArrowDown01Icon,
  CircleIcon,
} from '@hugeicons/core-free-icons'
import type { Bookmark } from '@/lib/types'
import { toggleFavorite, deleteBookmark } from '@/app/actions/bookmarks'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'

interface BookmarkCardProps {
  bookmark: Bookmark
  username: string
  onEdit: (bookmark: Bookmark) => void
  onDelete?: () => void
}

export function BookmarkCard({ bookmark, username, onEdit, onDelete }: BookmarkCardProps) {
  const [isFavorite, setIsFavorite] = useState(bookmark.isFavorite)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  const trackBookmarkOpen = (method: 'title' | 'dropdown') => {
    const bookmarkAgeMs = Date.now() - new Date(bookmark.createdAt).getTime()
    const bookmarkAgeDays = Math.floor(bookmarkAgeMs / (1000 * 60 * 60 * 24))

    if (typeof window !== 'undefined' && (window as any).pendo) {
      const urlObj = new URL(bookmark.url)
      (window as any).pendo.track('bookmark_opened', {
        username: username,
        bookmark_id: bookmark.id,
        click_source: method,
        url_domain: urlObj.hostname,
        is_favorite: bookmark.isFavorite,
        priority: bookmark.priority,
        bookmark_age_days: bookmarkAgeDays
      })
    }
  }

  const handleToggleFavorite = async () => {
    const newState = !isFavorite
    const previousState = isFavorite
    setIsFavorite(newState)

    // Calculate bookmark age in days
    const bookmarkAgeMs = Date.now() - new Date(bookmark.createdAt).getTime()
    const bookmarkAgeDays = Math.floor(bookmarkAgeMs / (1000 * 60 * 60 * 24))

    const result = await toggleFavorite(username, bookmark.id, bookmark.isFavorite)
    if (!result.success) {
      setIsFavorite(!newState)
      // Track API error
      if (typeof window !== 'undefined' && (window as any).pendo && result.trackingData) {
        (window as any).pendo.track('api_toggle_favorite_error', {
          username: result.trackingData.username,
          bookmark_id: result.trackingData.bookmark_id,
          error_message: result.trackingData.error_message
        })
      }
    } else {
      // Track favorite toggle event
      if (typeof window !== 'undefined' && (window as any).pendo) {
        if (newState) {
          // Bookmark favorited
          (window as any).pendo.track('bookmark_favorited', {
            username: username,
            bookmark_id: bookmark.id,
            bookmark_age_days: bookmarkAgeDays,
            priority: bookmark.priority,
            tags_count: bookmark.tags.length,
            total_favorites: -1 // This would need to be calculated from parent
          })
        } else {
          // Bookmark unfavorited
          (window as any).pendo.track('bookmark_unfavorited', {
            username: username,
            bookmark_id: bookmark.id,
            bookmark_age_days: bookmarkAgeDays,
            time_favorited_days: 0 // This would need historical tracking
          })
        }

        // Track API success
        if (result.trackingData) {
          (window as any).pendo.track('api_toggle_favorite_success', {
            username: result.trackingData.username,
            bookmark_id: result.trackingData.bookmark_id,
            new_state: result.trackingData.new_state,
            response_time_ms: result.trackingData.response_time_ms
          })
        }
      }
    }
  }

  const handleDelete = async () => {
    const bookmarkAgeMs = Date.now() - new Date(bookmark.createdAt).getTime()
    const bookmarkAgeDays = Math.floor(bookmarkAgeMs / (1000 * 60 * 60 * 24))

    const result = await deleteBookmark(username, bookmark.id)
    if (result.success) {
      // Track bookmark deletion
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_deleted', {
          username: username,
          bookmark_id: bookmark.id,
          bookmark_age_days: bookmarkAgeDays,
          was_favorite: bookmark.isFavorite,
          priority: bookmark.priority,
          tags_count: bookmark.tags.length,
          deletion_source: 'bookmark_card'
        })

        // Track API success
        if (result.trackingData) {
          (window as any).pendo.track('api_bookmark_delete_success', {
            username: result.trackingData.username,
            bookmark_id: result.trackingData.bookmark_id,
            response_time_ms: result.trackingData.response_time_ms
          })
        }
      }
      setShowDeleteDialog(false)
      onDelete?.()
    } else {
      // Track API error
      if (typeof window !== 'undefined' && (window as any).pendo && result.trackingData) {
        (window as any).pendo.track('api_bookmark_delete_error', {
          username: result.trackingData.username,
          bookmark_id: result.trackingData.bookmark_id,
          error_message: result.trackingData.error_message
        })
      }
    }
  }

  const truncateDescription = (text: string | undefined, maxLength: number) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const getPriorityConfig = (priority: number) => {
    switch (priority) {
      case 5:
        return {
          icon: Flag01Icon,
          label: 'Critical',
          className: 'text-red-600 dark:text-red-400',
        }
      case 4:
        return {
          icon: ArrowUp01Icon,
          label: 'High',
          className: 'text-orange-600 dark:text-orange-400',
        }
      case 3:
        return {
          icon: MinusSignIcon,
          label: 'Medium',
          className: 'text-yellow-600 dark:text-yellow-400',
        }
      case 2:
        return {
          icon: ArrowDown01Icon,
          label: 'Low',
          className: 'text-blue-600 dark:text-blue-400',
        }
      case 1:
        return {
          icon: CircleIcon,
          label: 'Minimal',
          className: 'text-gray-500 dark:text-gray-400',
        }
      default:
        return null
    }
  }

  const priorityConfig = getPriorityConfig(bookmark.priority)

  return (
    <>
      <Card className="group hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Favicon */}
              <div className="shrink-0 w-4 h-4 mt-1">
                {!faviconError && bookmark.favicon ? (
                  <img
                    src={bookmark.favicon}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={() => {
                      setFaviconError(true)
                      // Track favicon load error
                      if (typeof window !== 'undefined' && (window as any).pendo) {
                        const urlObj = new URL(bookmark.url)
                        (window as any).pendo.track('favicon_load_error', {
                          bookmark_id: bookmark.id,
                          url_domain: urlObj.hostname,
                          favicon_url: bookmark.favicon
                        })
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={ExternalLink} strokeWidth={2} className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Title and URL */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-medium leading-tight mb-1">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                    onClick={() => trackBookmarkOpen('title')}
                  >
                    {bookmark.title}
                  </a>
                </CardTitle>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate block"
                >
                  {new URL(bookmark.url).hostname}
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                onClick={handleToggleFavorite}
              >
                <HugeiconsIcon
                  icon={StarIcon}
                  strokeWidth={2}
                  className={isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}
                />
              </Button>

              <DropdownMenu onOpenChange={(open) => {
                if (open && typeof window !== 'undefined' && (window as any).pendo) {
                  (window as any).pendo.track('bookmark_menu_opened', {
                    bookmark_id: bookmark.id,
                    is_favorite: bookmark.isFavorite
                  })
                }
              }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100">
                    <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    trackBookmarkOpen('dropdown')
                    window.open(bookmark.url, '_blank')
                  }}>
                    <HugeiconsIcon icon={ExternalLink} strokeWidth={2} className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                    <HugeiconsIcon icon={EditIcon} strokeWidth={2} className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setShowDeleteDialog(true)
                    // Track delete dialog opened
                    const bookmarkAgeMs = Date.now() - new Date(bookmark.createdAt).getTime()
                    const bookmarkAgeDays = Math.floor(bookmarkAgeMs / (1000 * 60 * 60 * 24))
                    if (typeof window !== 'undefined' && (window as any).pendo) {
                      (window as any).pendo.track('bookmark_delete_dialog_opened', {
                        bookmark_id: bookmark.id,
                        is_favorite: bookmark.isFavorite,
                        priority: bookmark.priority,
                        bookmark_age_days: bookmarkAgeDays
                      })
                    }
                  }} className="text-destructive">
                    <HugeiconsIcon icon={DeleteIcon} strokeWidth={2} className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {bookmark.description && (
          <CardContent className="pt-0 pb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {truncateDescription(bookmark.description, 120)}
            </p>
          </CardContent>
        )}

        <CardFooter className="pt-0 pb-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {formatDate(bookmark.createdAt)}
          </span>
          {priorityConfig && (
            <div className="flex items-center gap-1">
              <HugeiconsIcon
                icon={priorityConfig.icon}
                strokeWidth={2}
                className={`h-3 w-3 ${priorityConfig.className}`}
              />
              <span className={`text-[10px] font-medium ${priorityConfig.className}`}>
                {priorityConfig.label}
              </span>
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bookmark "{bookmark.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              // Track delete cancelled
              if (typeof window !== 'undefined' && (window as any).pendo) {
                (window as any).pendo.track('bookmark_delete_cancelled', {
                  bookmark_id: bookmark.id,
                  is_favorite: bookmark.isFavorite
                })
              }
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
