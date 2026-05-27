'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreVerticalIcon, EditIcon, DeleteIcon } from '@hugeicons/core-free-icons'
import type { Collection } from '@/lib/types'

interface CollectionCardProps {
  collection: Collection
  bookmarkCount: number
  onEdit: (collection: Collection) => void
  onDelete: (id: string) => void
  onClick: (collection: Collection) => void
}

export function CollectionCard({ collection, bookmarkCount, onEdit, onDelete, onClick }: CollectionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Card
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => onClick(collection)}
        data-tracking-id="collection-card"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: collection.color }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{collection.name}</h3>
                {collection.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{collection.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100" data-tracking-id="collection-actions-menu-trigger">
                  <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onEdit(collection)} data-tracking-id="collection-edit-action">
                  <HugeiconsIcon icon={EditIcon} strokeWidth={2} className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive" data-tracking-id="collection-delete-action">
                  <HugeiconsIcon icon={DeleteIcon} strokeWidth={2} className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the collection &quot;{collection.name}&quot;. Bookmarks in this collection will not be deleted but will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-tracking-id="collection-delete-cancel-button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (typeof pendo !== 'undefined') {
                  pendo.track('collection_deleted', {
                    collection_id: collection.id,
                    collection_name: collection.name,
                    bookmark_count_in_collection: bookmarkCount,
                  })
                }
                onDelete(collection.id)
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-tracking-id="collection-delete-confirm-button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
