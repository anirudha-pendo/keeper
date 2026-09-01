'use client'

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { TagInput } from '@/components/tag-input'
import {
  createBookmark,
  updateBookmark,
  checkDuplicateUrl,
} from '@/app/actions/bookmarks'
import type { Bookmark, BookmarkInput, Collection } from '@/lib/types'

interface BookmarkFormProps {
  isOpen: boolean
  onClose: () => void
  username: string
  bookmark?: Bookmark
  collections?: Collection[]
}

export function BookmarkForm({
  isOpen,
  onClose,
  username,
  bookmark,
  collections = [],
}: BookmarkFormProps) {
  const [formData, setFormData] = useState<BookmarkInput>({
    url: '',
    title: '',
    description: '',
    tags: [],
    isFavorite: false,
    priority: 0,
    collectionId: undefined,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string
    bookmarkId: string
  } | null>(null)

  useEffect(() => {
    if (bookmark) {
      setFormData({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        tags: bookmark.tags,
        isFavorite: bookmark.isFavorite,
        priority: bookmark.priority,
        collectionId: bookmark.collectionId,
      })
    } else {
      setFormData({
        url: '',
        title: '',
        description: '',
        tags: [],
        isFavorite: false,
        priority: 0,
        collectionId: undefined,
      })
    }
    setError('')
    setDuplicateWarning(null)
  }, [bookmark, isOpen])

  const handleUrlBlur = async () => {
    if (bookmark || !formData.url.trim()) return
    try {
      new URL(formData.url)
    } catch {
      return
    }
    const result = await checkDuplicateUrl(username, formData.url)
    if (result.success && result.data) {
      setDuplicateWarning({
        message: `A bookmark with this URL already exists: "${result.data.title}"`,
        bookmarkId: result.data.id,
      })
    } else {
      setDuplicateWarning(null)
    }
  }

  const handleSubmit = async () => {
    setError('')

    // Validate URL
    if (!formData.url.trim()) {
      setError('URL is required')
      return
    }

    try {
      new URL(formData.url)
    } catch {
      setError('Invalid URL format')
      return
    }

    // Validate title
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)

    try {
      let result
      if (bookmark) {
        result = await updateBookmark(username, bookmark.id, formData)
      } else {
        result = await createBookmark(username, formData)
      }

      if (result.success) {
        if (typeof pendo !== 'undefined') {
          if (bookmark) {
            pendo.track('bookmark_updated', {
              tag_count: formData.tags.length,
              has_description: !!formData.description?.trim(),
              priority: formData.priority,
              is_favorite: formData.isFavorite,
              has_collection: !!formData.collectionId,
            })
          } else {
            let urlDomain = ''
            try {
              urlDomain = new URL(formData.url).hostname
            } catch {
              // URL already validated above
            }
            pendo.track('bookmark_created', {
              tag_count: formData.tags.length,
              has_description: !!formData.description?.trim(),
              priority: formData.priority,
              is_favorite: formData.isFavorite,
              has_collection: !!formData.collectionId,
              url_domain: urlDomain,
            })
          }
        }
        onClose()
      } else {
        setError(result.error || 'Failed to save bookmark')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {bookmark
              ? 'Update the bookmark details below.'
              : 'Fill in the details to create a new bookmark.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel>URL *</FieldLabel>
              <Input
                value={formData.url}
                onChange={(e) => {
                  setFormData({ ...formData, url: e.target.value })
                  setDuplicateWarning(null)
                }}
                onBlur={handleUrlBlur}
                placeholder="https://example.com"
                type="url"
                data-tracking-id="bookmark-form-url-input"
              />
              {duplicateWarning && (
                <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    {duplicateWarning.message}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
                      onClick={() => setDuplicateWarning(null)}
                      data-tracking-id="duplicate-url-add-anyway"
                    >
                      Add Anyway
                    </button>
                  </div>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Title *</FieldLabel>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="My Bookmark"
                data-tracking-id="bookmark-form-title-input"
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
                data-tracking-id="bookmark-form-description-input"
              />
            </Field>

            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(value) as 0 | 1 | 2 | 3 | 4 | 5,
                  })
                }
              >
                <SelectTrigger data-tracking-id="bookmark-form-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">Priority 1 (Lowest)</SelectItem>
                  <SelectItem value="2">Priority 2</SelectItem>
                  <SelectItem value="3">Priority 3</SelectItem>
                  <SelectItem value="4">Priority 4</SelectItem>
                  <SelectItem value="5">Priority 5 (Highest)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Tags</FieldLabel>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Add tags..."
              />
            </Field>

            {collections.length > 0 && (
              <Field>
                <FieldLabel>Collection</FieldLabel>
                <Select
                  value={formData.collectionId || '_none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      collectionId: value === '_none' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger data-tracking-id="bookmark-form-collection-select">
                    <SelectValue placeholder="No collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {collections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={formData.isFavorite}
                  onChange={(e) =>
                    setFormData({ ...formData, isFavorite: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border"
                  data-tracking-id="bookmark-form-favorite-checkbox"
                />
                <FieldLabel htmlFor="favorite" className="mb-0 cursor-pointer">
                  Mark as favorite
                </FieldLabel>
              </div>
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isSubmitting}
            data-tracking-id="bookmark-form-cancel-button"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-tracking-id="bookmark-form-submit-button"
          >
            {isSubmitting ? 'Saving...' : bookmark ? 'Update' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
