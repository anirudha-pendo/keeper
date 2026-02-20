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
  const [originalFormData, setOriginalFormData] = useState<BookmarkInput | null>(null)
  const [originalPriority, setOriginalPriority] = useState<number>(0)

  useEffect(() => {
    if (bookmark) {
      const initialData = {
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        tags: bookmark.tags,
        isFavorite: bookmark.isFavorite,
        priority: bookmark.priority,
      }
      setFormData(initialData)
      setOriginalFormData(initialData)
      setOriginalPriority(bookmark.priority)
    } else {
      const emptyData = {
        url: '',
        title: '',
        description: '',
        tags: [],
        isFavorite: false,
        priority: 0,
      }
      setFormData(emptyData)
      setOriginalFormData(emptyData)
      setOriginalPriority(0)
    }
    setError('')
  }, [bookmark, isOpen])

  const handleSubmit = async () => {
    setError('')

    // Validate URL
    if (!formData.url.trim()) {
      setError('URL is required')
      // Track bookmark creation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_creation_error', {
          error_type: 'validation',
          error_message: 'URL is required',
          url_provided: false,
          title_provided: !!formData.title.trim()
        })
      }
      return
    }

    try {
      new URL(formData.url)
    } catch {
      setError('Invalid URL format')
      // Track bookmark creation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_creation_error', {
          error_type: 'validation',
          error_message: 'Invalid URL format',
          url_provided: true,
          title_provided: !!formData.title.trim()
        })
      }
      return
    }

    // Validate title
    if (!formData.title.trim()) {
      setError('Title is required')
      // Track bookmark creation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_creation_error', {
          error_type: 'validation',
          error_message: 'Title is required',
          url_provided: true,
          title_provided: false
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
        // Track successful bookmark creation or update
        if (typeof window !== 'undefined' && (window as any).pendo) {
          if (bookmark) {
            // Track bookmark_updated (Event 4)
            const fieldsChanged = []
            if (originalFormData) {
              if (formData.url !== originalFormData.url) fieldsChanged.push('url')
              if (formData.title !== originalFormData.title) fieldsChanged.push('title')
              if (formData.description !== originalFormData.description) fieldsChanged.push('description')
              if (formData.priority !== originalFormData.priority) fieldsChanged.push('priority')
              if (formData.isFavorite !== originalFormData.isFavorite) fieldsChanged.push('favorite')
              if (JSON.stringify(formData.tags) !== JSON.stringify(originalFormData.tags)) fieldsChanged.push('tags')
            }

            (window as any).pendo.track('bookmark_updated', {
              bookmark_id: bookmark.id,
              fields_changed: fieldsChanged.join(','),
              priority_changed: originalFormData && formData.priority !== originalFormData.priority,
              favorite_changed: originalFormData && formData.isFavorite !== originalFormData.isFavorite,
              url_changed: originalFormData && formData.url !== originalFormData.url,
              has_description: !!formData.description.trim(),
              tag_count: formData.tags.length
            })
          } else {
            // Track bookmark_created (Event 3)
            const url = new URL(formData.url)
            ;(window as any).pendo.track('bookmark_created', {
              bookmark_id: (result as any).data?.id || 'unknown',
              has_description: !!formData.description.trim(),
              priority_level: formData.priority,
              is_favorite: formData.isFavorite,
              tag_count: formData.tags.length,
              url_domain: url.hostname,
              creation_source: 'form'
            })
          }
        }
        onClose()
      } else {
        setError(result.error || 'Failed to save bookmark')
        // Track server error for bookmark creation
        if (typeof window !== 'undefined' && (window as any).pendo) {
          (window as any).pendo.track('bookmark_creation_error', {
            error_type: 'server',
            error_message: result.error || 'Failed to save bookmark',
            url_provided: true,
            title_provided: true
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      // Track error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_creation_error', {
          error_type: 'exception',
          error_message: err.message || 'An error occurred',
          url_provided: true,
          title_provided: true
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Track bookmark form cancellation (Event 12)
    if (typeof window !== 'undefined' && (window as any).pendo) {
      const fieldsFilledCount = [
        formData.url.trim(),
        formData.title.trim(),
        formData.description.trim(),
        formData.tags.length > 0,
        formData.priority > 0
      ].filter(Boolean).length

      ;(window as any).pendo.track('bookmark_form_cancelled', {
        form_mode: bookmark ? 'edit' : 'create',
        had_url_entered: !!formData.url.trim(),
        had_title_entered: !!formData.title.trim(),
        fields_filled_count: fieldsFilledCount
      })
    }
    onClose()
  }

  const handlePriorityChange = (value: string) => {
    const newPriority = parseInt(value) as 0 | 1 | 2 | 3 | 4 | 5

    // Track priority_set (Event 24) - only when changed to non-zero
    if (newPriority !== originalPriority && newPriority > 0) {
      if (typeof window !== 'undefined' && (window as any).pendo) {
        const priorityLabels = {
          0: 'None',
          1: 'Minimal',
          2: 'Low',
          3: 'Medium',
          4: 'High',
          5: 'Critical'
        }
        ;(window as any).pendo.track('priority_set', {
          bookmark_id: bookmark?.id || 'new',
          previous_priority: originalPriority,
          new_priority: newPriority,
          priority_label: priorityLabels[newPriority],
          is_create: !bookmark,
          is_update: !!bookmark
        })
      }
    }

    setFormData({ ...formData, priority: newPriority })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleCancel}>
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
                onValueChange={handlePriorityChange}
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
          <AlertDialogCancel disabled={isSubmitting} onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : bookmark ? 'Update' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
