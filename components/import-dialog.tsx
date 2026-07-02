'use client'

import { useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { BookmarkInput } from '@/lib/types'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: BookmarkInput[]
  duplicateUrls: Set<string>
  onConfirm: (bookmarks: BookmarkInput[]) => Promise<void>
}

export function ImportDialog({ isOpen, onClose, bookmarks, duplicateUrls, onConfirm }: ImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false)

  const newBookmarks = bookmarks.filter((b) => !duplicateUrls.has(b.url))
  const duplicateBookmarks = bookmarks.filter((b) => duplicateUrls.has(b.url))

  const handleConfirm = async () => {
    setIsImporting(true)
    try {
      await onConfirm(newBookmarks)
      const pendo = (window as any).pendo
      pendo?.track('bookmarks_imported', {
        total_found: bookmarks.length,
        new_imported_count: newBookmarks.length,
        duplicate_skipped_count: duplicateBookmarks.length,
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Import Preview</AlertDialogTitle>
          <AlertDialogDescription>
            Review the bookmarks to import.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{bookmarks.length}</p>
              <p className="text-[10px] text-muted-foreground">Total found</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{newBookmarks.length}</p>
              <p className="text-[10px] text-muted-foreground">New</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{duplicateBookmarks.length}</p>
              <p className="text-[10px] text-muted-foreground">Duplicates</p>
            </div>
          </div>

          {newBookmarks.length > 0 && (
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1.5">
              {newBookmarks.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">new</Badge>
                  <span className="text-xs truncate">{b.title}</span>
                </div>
              ))}
              {duplicateBookmarks.map((b, i) => (
                <div key={`dup-${i}`} className="flex items-center gap-2 opacity-50">
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">skip</Badge>
                  <span className="text-xs truncate line-through">{b.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isImporting} data-tracking-id="import-cancel-button">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isImporting || newBookmarks.length === 0}
            data-tracking-id="import-confirm-button"
          >
            {isImporting ? 'Importing...' : `Import ${newBookmarks.length} bookmark${newBookmarks.length !== 1 ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
