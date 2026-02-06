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

    // Track form open time for calculating time spent
    if (isOpen && typeof window !== 'undefined') {
      (window as any).__bookmarkFormOpenTime = Date.now()
    }
  }, [bookmark, isOpen])

  const handleSubmit = async () => {
    setError('')

    // Validate URL
    if (!formData.url.trim()) {
      const errorMessage = 'URL is required'
      setError(errorMessage)
      // Track validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_form_validation_error', {
          error_type: 'missing_url',
          error_message: errorMessage,
          mode: bookmark ? 'edit' : 'create'
        })
      }
      return
    }

    try {
      new URL(formData.url)
    } catch {
      const errorMessage = 'Invalid URL format'
      setError(errorMessage)
      // Track validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_form_validation_error', {
          error_type: 'invalid_url',
          error_message: errorMessage,
          mode: bookmark ? 'edit' : 'create'
        })
      }
      return
    }

    // Validate title
    if (!formData.title.trim()) {
      const errorMessage = 'Title is required'
      setError(errorMessage)
      // Track validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('bookmark_form_validation_error', {
          error_type: 'missing_title',
          error_message: errorMessage,
          mode: bookmark ? 'edit' : 'create'
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
        // Track successful bookmark creation/update and API events
        if (typeof window !== 'undefined' && (window as any).pendo && result.trackingData) {
          if (bookmark) {
            // Track bookmark updated
            (window as any).pendo.track('bookmark_updated', {
              username: result.trackingData.username,
              bookmark_id: result.trackingData.bookmark_id,
              fields_changed: result.trackingData.fields_changed,
              has_description: result.trackingData.has_description,
              tags_count: result.trackingData.tags_count,
              is_favorite: result.trackingData.is_favorite,
              priority: result.trackingData.priority,
              time_since_creation: result.trackingData.time_since_creation
            })

            // Track API success
            (window as any).pendo.track('api_bookmark_update_success', {
              username: result.trackingData.api_username,
              bookmark_id: result.trackingData.api_bookmark_id,
              response_time_ms: result.trackingData.response_time_ms
            })
          } else {
            // Track bookmark created
            (window as any).pendo.track('bookmark_created', {
              username: result.trackingData.username,
              bookmark_id: result.trackingData.bookmark_id,
              has_description: result.trackingData.has_description,
              tags_count: result.trackingData.tags_count,
              is_favorite: result.trackingData.is_favorite,
              priority: result.trackingData.priority,
              url_domain: result.trackingData.url_domain,
              creation_source: result.trackingData.creation_source
            })

            // Track API success
            (window as any).pendo.track('api_bookmark_create_success', {
              username: result.trackingData.api_username,
              bookmark_id: result.trackingData.api_bookmark_id,
              response_time_ms: result.trackingData.response_time_ms
            })

            // Track milestone: first bookmark
            if (result.trackingData.is_first_bookmark) {
              (window as any).pendo.track('milestone_first_bookmark', {
                username: result.trackingData.username,
                time_since_signup_minutes: 0, // Would need user creation date
                bookmark_details: {
                  has_description: result.trackingData.has_description,
                  priority: result.trackingData.priority
                }
              })
            }

            // Track milestone: bookmark count
            if (result.trackingData.milestone_reached) {
              const favoritesCount = 0 // Would need to calculate from all bookmarks
              (window as any).pendo.track('milestone_bookmarks_count', {
                milestone: result.trackingData.milestone_count,
                username: result.trackingData.username,
                favorites_count: favoritesCount,
                time_since_signup_days: 0 // Would need user creation date
              })
            }
          }
        }
        onClose()
      } else {
        setError(result.error || 'Failed to save bookmark')
        // Track API error
        if (typeof window !== 'undefined' && (window as any).pendo && result.trackingData) {
          const eventName = bookmark ? 'api_bookmark_update_error' : 'api_bookmark_create_error'
          ;(window as any).pendo.track(eventName, {
            username: result.trackingData.username,
            bookmark_id: result.trackingData.bookmark_id,
            error_type: result.trackingData.error_type,
            error_message: result.trackingData.error_message,
            url_attempted: result.trackingData.url_attempted
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      // Track unexpected error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        const eventName = bookmark ? 'api_bookmark_update_error' : 'api_bookmark_create_error'
        ;(window as any).pendo.track(eventName, {
          username: username,
          bookmark_id: bookmark?.id,
          error_type: 'unexpected_error',
          error_message: err.message || 'An error occurred'
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

                  // Track priority changed
                  if (typeof window !== 'undefined' && (window as any).pendo) {
                    (window as any).pendo.track('bookmark_priority_changed', {
                      previous_priority: previousPriority,
                      new_priority: newPriority,
                      mode: bookmark ? 'edit' : 'create'
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
            // Track form cancelled - calculate time spent
            const formOpenTime = (window as any).__bookmarkFormOpenTime || Date.now()
            const timeSpent = Math.floor((Date.now() - formOpenTime) / 1000)

            const fieldsFilled = [
              formData.url.trim() ? 'url' : null,
              formData.title.trim() ? 'title' : null,
              formData.description.trim() ? 'description' : null
            ].filter(Boolean)

            if (typeof window !== 'undefined' && (window as any).pendo) {
              (window as any).pendo.track('bookmark_form_cancelled', {
                mode: bookmark ? 'edit' : 'create',
                form_filled_fields: fieldsFilled.join(','),
                time_spent_seconds: timeSpent
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
