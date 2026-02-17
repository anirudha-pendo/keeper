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

  const getUrlDomain = (url: string): string => {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  const handleSubmit = async () => {
    setError('')
    const formMode = bookmark ? 'edit' : 'create'

    // Validate URL
    if (!formData.url.trim()) {
      const errorMsg = 'URL is required'
      setError(errorMsg)
      pendo.track('bookmark_form_validation_failed', {
        form_mode: formMode,
        error_type: 'missing_url',
        error_message: errorMsg,
      })
      return
    }

    try {
      new URL(formData.url)
    } catch {
      const errorMsg = 'Invalid URL format'
      setError(errorMsg)
      pendo.track('bookmark_form_validation_failed', {
        form_mode: formMode,
        error_type: 'invalid_url',
        error_message: errorMsg,
      })
      return
    }

    // Validate title
    if (!formData.title.trim()) {
      const errorMsg = 'Title is required'
      setError(errorMsg)
      pendo.track('bookmark_form_validation_failed', {
        form_mode: formMode,
        error_type: 'missing_title',
        error_message: errorMsg,
      })
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
        if (bookmark) {
          const fieldsChanged: string[] = []
          if (formData.url !== bookmark.url) fieldsChanged.push('url')
          if (formData.title !== bookmark.title) fieldsChanged.push('title')
          if (formData.description !== (bookmark.description || '')) fieldsChanged.push('description')
          if (formData.isFavorite !== bookmark.isFavorite) fieldsChanged.push('isFavorite')
          if (formData.priority !== bookmark.priority) fieldsChanged.push('priority')

          pendo.track('bookmark_updated', {
            bookmark_id: bookmark.id,
            has_description: Boolean(formData.description?.trim()),
            tag_count: formData.tags.length,
            priority_level: formData.priority,
            is_favorite: formData.isFavorite,
            url_domain: getUrlDomain(formData.url),
            fields_changed: fieldsChanged.join(','),
          })
        } else {
          pendo.track('bookmark_created', {
            has_description: Boolean(formData.description?.trim()),
            tag_count: formData.tags.length,
            priority_level: formData.priority,
            is_favorite: formData.isFavorite,
            url_domain: getUrlDomain(formData.url),
          })
        }

        onClose()
      } else {
        const errorMsg = result.error || 'Failed to save bookmark'
        setError(errorMsg)
        pendo.track('bookmark_save_failed', {
          form_mode: formMode,
          error_message: errorMsg,
          bookmark_id: bookmark?.id || '',
        })
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred'
      setError(errorMsg)
      pendo.track('bookmark_save_failed', {
        form_mode: formMode,
        error_message: errorMsg,
        bookmark_id: bookmark?.id || '',
      })
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
          <AlertDialogCancel
            disabled={isSubmitting}
            onClick={() => {
              const hasChanges = bookmark
                ? formData.url !== bookmark.url ||
                  formData.title !== bookmark.title ||
                  formData.description !== (bookmark.description || '') ||
                  formData.isFavorite !== bookmark.isFavorite ||
                  formData.priority !== bookmark.priority
                : formData.url.trim() !== '' ||
                  formData.title.trim() !== '' ||
                  (formData.description?.trim() || '') !== '' ||
                  formData.isFavorite !== false ||
                  formData.priority !== 0
              pendo.track('bookmark_form_cancelled', {
                form_mode: bookmark ? 'edit' : 'create',
                had_unsaved_changes: hasChanges,
              })
            }}
          >Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : bookmark ? 'Update' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
