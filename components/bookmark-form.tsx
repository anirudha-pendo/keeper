'use client'

import { useState, useEffect } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createBookmark, updateBookmark } from '@/app/actions/bookmarks'
import type { Bookmark, BookmarkInput } from '@/lib/types'

interface BookmarkFormProps {
  isOpen: boolean
  onClose: () => void
  username: string
  bookmark?: Bookmark
}

export function BookmarkForm({ isOpen, onClose, username, bookmark }: BookmarkFormProps) {
  const [formData, setFormData] = useState<BookmarkInput>({
    url: '',
    title: '',
    description: '',
    tags: [],
    isFavorite: false,
    priority: 0,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (bookmark) {
      setFormData({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        tags: bookmark.tags,
        isFavorite: bookmark.isFavorite,
        priority: bookmark.priority,
      })
    } else {
      setFormData({
        url: '',
        title: '',
        description: '',
        tags: [],
        isFavorite: false,
        priority: 0,
      })
    }
    setError('')
  }, [bookmark, isOpen])

  const handleSubmit = async () => {
    setError('')

    // Validate URL
    if (!formData.url.trim()) {
      setError('URL is required')
      pendo.track('bookmark_creation_failed', {
        error_message: 'URL is required',
        error_type: 'validation',
        url_provided: false,
        title_provided: !!formData.title.trim(),
      })
      return
    }

    try {
      new URL(formData.url)
    } catch {
      setError('Invalid URL format')
      pendo.track('bookmark_creation_failed', {
        error_message: 'Invalid URL format',
        error_type: 'validation',
        url_provided: true,
        title_provided: !!formData.title.trim(),
      })
      return
    }

    // Validate title
    if (!formData.title.trim()) {
      setError('Title is required')
      pendo.track('bookmark_creation_failed', {
        error_message: 'Title is required',
        error_type: 'validation',
        url_provided: true,
        title_provided: false,
      })
      return
    }

    setIsSubmitting(true)

    try {
      let result
      let urlDomain = ''
      try { urlDomain = new URL(formData.url).hostname } catch {}
      if (bookmark) {
        result = await updateBookmark(username, bookmark.id, formData)
        if (result.success) {
          pendo.track('bookmark_updated', {
            bookmark_id: bookmark.id,
            priority: formData.priority,
            is_favorite: formData.isFavorite,
            tags_count: formData.tags.length,
          })
        }
      } else {
        result = await createBookmark(username, formData)
        if (result.success) {
          pendo.track('bookmark_created', {
            has_description: !!formData.description?.trim(),
            priority: formData.priority,
            is_favorite: formData.isFavorite,
            tags_count: formData.tags.length,
            url_domain: urlDomain,
          })
        }
      }

      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Failed to save bookmark')
        if (!bookmark) {
          pendo.track('bookmark_creation_failed', {
            error_message: result.error || 'Failed to save bookmark',
            error_type: 'server',
            url_provided: true,
            title_provided: true,
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      if (!bookmark) {
        pendo.track('bookmark_creation_failed', {
          error_message: err.message || 'An error occurred',
          error_type: 'exception',
          url_provided: true,
          title_provided: true,
        })
      }
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
            {bookmark ? 'Update the bookmark details below.' : 'Fill in the details to create a new bookmark.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel>URL *</FieldLabel>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                type="url"
              />
            </Field>

            <Field>
              <FieldLabel>Title *</FieldLabel>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Bookmark"
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) as 0 | 1 | 2 | 3 | 4 | 5 })}
              >
                <SelectTrigger>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <FieldLabel htmlFor="favorite" className="mb-0 cursor-pointer">
                  Mark as favorite
                </FieldLabel>
              </div>
            </Field>
          </FieldGroup>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : bookmark ? 'Update' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
