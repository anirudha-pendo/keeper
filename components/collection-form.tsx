'use client'

import { useState, useEffect } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Collection } from '@/lib/types'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9',
]

interface CollectionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string; color: string }) => Promise<void>
  collection?: Collection
}

export function CollectionForm({ isOpen, onClose, onSubmit, collection }: CollectionFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setDescription(collection.description || '')
      setColor(collection.color)
    } else {
      setName('')
      setDescription('')
      setColor(PRESET_COLORS[0])
    }
    setError('')
  }, [collection, isOpen])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, color })
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {collection ? 'Edit Collection' : 'New Collection'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {collection ? 'Update the collection details.' : 'Create a new collection to organize your bookmarks.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Name *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work Resources"
                data-tracking-id="collection-form-name-input"
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                data-tracking-id="collection-form-description-input"
              />
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    data-tracking-id="collection-form-color-swatch"
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} data-tracking-id="collection-form-cancel-button">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting} data-tracking-id="collection-form-submit-button">
            {isSubmitting ? 'Saving...' : collection ? 'Update' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
