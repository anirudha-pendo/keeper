'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Copy01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
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

  const handleToggleFavorite = async () => {
    const newState = !isFavorite
    setIsFavorite(newState)
    const result = await toggleFavorite(username, bookmark.id, bookmark.isFavorite)
    if (!result.success) {
      setIsFavorite(!newState)
    } else {
      if (typeof pendo !== 'undefined') {
        pendo.track('bookmark_favorite_toggled', {
          bookmarkId: bookmark.id,
          newFavoriteState: newState,
          bookmarkTitle: bookmark.title,
          domain: (() => { try { return new URL(bookmark.url).hostname } catch { return '' } })(),
        })
      }
    }
  }

  const handleDelete = async () => {
    const result = await deleteBookmark(username, bookmark.id)
    if (result.success) {
      if (typeof pendo !== 'undefined') {
        pendo.track('bookmark_deleted', {
          bookmarkId: bookmark.id,
          bookmarkTitle: bookmark.title,
          domain: (() => { try { return new URL(bookmark.url).hostname } catch { return '' } })(),
          hadTags: bookmark.tags.length > 0,
          wasFavorite: bookmark.isFavorite,
        })
      }
      setShowDeleteDialog(false)
      onDelete?.()
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
                    onError={() => setFaviconError(true)}
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
                    data-tracking-id="bookmark-title-link"
                  >
                    {bookmark.title}
                  </a>
                </CardTitle>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate block"
                  data-tracking-id="bookmark-domain-link"
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
                data-tracking-id="bookmark-favorite-button"
              >
                <HugeiconsIcon
                  icon={StarIcon}
                  strokeWidth={2}
                  className={isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}
                />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" data-tracking-id="bookmark-actions-menu-trigger">
                    <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    window.open(bookmark.url, '_blank')
                  }} data-tracking-id="bookmark-open-action">
                    <HugeiconsIcon icon={ExternalLink} strokeWidth={2} className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    navigator.clipboard.writeText(bookmark.url)
                    toast.success('Link copied to clipboard')
                    if (typeof pendo !== 'undefined') {
                      pendo.track('bookmark_link_copied', {
                        bookmarkId: bookmark.id,
                        bookmarkTitle: bookmark.title,
                        domain: (() => { try { return new URL(bookmark.url).hostname } catch { return '' } })(),
                      })
                    }
                  }} data-tracking-id="bookmark-copy-link-action">
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    onEdit(bookmark)
                  }} data-tracking-id="bookmark-edit-action">
                    <HugeiconsIcon icon={EditIcon} strokeWidth={2} className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setShowDeleteDialog(true)
                  }} className="text-destructive" data-tracking-id="bookmark-delete-action">
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

        {bookmark.tags.length > 0 && (
          <CardContent className="pt-0 pb-3">
            <div className="flex flex-wrap gap-1">
              {bookmark.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                  {tag}
                </Badge>
              ))}
            </div>
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
            <AlertDialogCancel data-tracking-id="bookmark-delete-cancel-button">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-tracking-id="bookmark-delete-confirm-button">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
