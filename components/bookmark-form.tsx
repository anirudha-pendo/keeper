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
  const [initialFormData, setInitialFormData] = useState<BookmarkInput>({
    url: '',
    title: '',
    description: '',
    tags: [],
    isFavorite: false,
    priority: 0,
  })

  useEffect(() => {
    const defaultData = {
      url: '',
      title: '',
      description: '',
      tags: [],
      isFavorite: false,
      priority: 0,
    }

    if (bookmark) {
      const data = {
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        tags: bookmark.tags,
        isFavorite: bookmark.isFavorite,
        priority: bookmark.priority,
      }
      setFormData(data)
      setInitialFormData(data)
    } else {
      setFormData(defaultData)
      setInitialFormData(defaultData)
    }
    setError('')
  }, [bookmark, isOpen])

  const handleSubmit = async () => {
    setError('')

    // Validate URL
    if (!formData.url.trim()) {
      setError('URL is required')
      // Track validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_validation_error', {
          error_type: 'missing_required_field',
          error_message: 'URL is required',
          field_name: 'url',
          form_mode: bookmark ? 'edit' : 'create'
        })
      }
      return
    }

    try {
      new URL(formData.url)
    } catch {
      setError('Invalid URL format')
      // Track validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_validation_error', {
          error_type: 'invalid_url_format',
          error_message: 'Invalid URL format',
          field_name: 'url',
          form_mode: bookmark ? 'edit' : 'create'
        })
      }
      return
    }

    // Validate title
    if (!formData.title.trim()) {
      setError('Title is required')
      // Track validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_validation_error', {
          error_type: 'missing_required_field',
          error_message: 'Title is required',
          field_name: 'title',
          form_mode: bookmark ? 'edit' : 'create'
        })
      }
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
        // Track successful bookmark creation/update
        if (typeof window !== 'undefined' && (window as any).pendo && result.trackingData) {
          if (bookmark) {
            (window as any).pendo.track('bookmark_updated', result.trackingData)
          } else {
            (window as any).pendo.track('bookmark_created', result.trackingData)
          }
        }
        onClose()
      } else {
        setError(result.error || 'Failed to save bookmark')
        // Track save error
        if (typeof window !== 'undefined' && (window as any).pendo) {
          (window as any).pendo.track('bookmark_save_error', {
            error_message: result.error || 'Failed to save bookmark',
            operation_type: bookmark ? 'update' : 'create',
            bookmark_id: bookmark?.id
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      // Track save error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_save_error', {
          error_message: err.message || 'An error occurred',
          operation_type: bookmark ? 'update' : 'create',
          bookmark_id: bookmark?.id
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
                onValueChange={(value) => {
                  const previousPriority = formData.priority
                  const newPriority = parseInt(value) as 0 | 1 | 2 | 3 | 4 | 5

                  // Track priority set
                  if (typeof window !== 'undefined' && (window as any).pendo) {
                    (window as any).pendo.track('priority_set', {
                      bookmark_id: bookmark?.id,
                      priority_level: newPriority,
                      previous_priority: previousPriority,
                      form_mode: bookmark ? 'edit' : 'create'
                    })
                  }

                  setFormData({ ...formData, priority: newPriority })
                }}
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
          <AlertDialogCancel disabled={isSubmitting} onClick={() => {
            // Track form cancelled
            const hasDataEntered = formData.url !== initialFormData.url ||
                                   formData.title !== initialFormData.title ||
                                   formData.description !== initialFormData.description

            const fieldsFilled = [
              formData.url ? 'url' : null,
              formData.title ? 'title' : null,
              formData.description ? 'description' : null
            ].filter(Boolean)

            if (typeof window !== 'undefined' && (window as any).pendo) {
              (window as any).pendo.track('bookmark_form_cancelled', {
                form_mode: bookmark ? 'edit' : 'create',
                had_data_entered: hasDataEntered,
                fields_filled: fieldsFilled
              })
            }
          }}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : bookmark ? 'Update' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
