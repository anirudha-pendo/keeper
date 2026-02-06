'use client'

import { useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface UsernamePromptProps {
  isOpen: boolean
  onSubmit: (username: string) => void
}

export function UsernamePrompt({ isOpen, onSubmit }: UsernamePromptProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const trimmed = username.trim()

    if (trimmed.length < 3 || trimmed.length > 20) {
      const errorMessage = 'Username must be between 3 and 20 characters'
      setError(errorMessage)
      // Track username validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('username_validation_error', {
          error_type: trimmed.length < 3 ? 'length_too_short' : 'length_too_long',
          error_message: errorMessage,
          attempted_username_length: trimmed.length
        })
      }
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      const errorMessage = 'Username can only contain letters, numbers, and underscores'
      setError(errorMessage)
      // Track username validation error
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('username_validation_error', {
          error_type: 'invalid_characters',
          error_message: errorMessage,
          attempted_username_length: trimmed.length
        })
      }
      return
    }

    // Track successful user account creation
    if (typeof window !== 'undefined' && (window as any).pendo) {
      const hasNumbers = /\d/.test(trimmed)
      const hasUnderscores = /_/.test(trimmed)

      (window as any).pendo.track('user_account_created', {
        username: trimmed,
        timestamp: new Date().toISOString(),
        username_length: trimmed.length,
        contains_numbers: hasNumbers,
        contains_underscores: hasUnderscores
      })
    }

    onSubmit(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome to Keeper</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a username to get started. Your bookmarks will be saved under this username.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Username</FieldLabel>
            <Input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter username"
              autoFocus
            />
            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}
            {!error && (
              <FieldDescription>
                3-20 characters, letters, numbers, and underscores only
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>

        <AlertDialogFooter>
          <AlertDialogAction onClick={handleSubmit}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
