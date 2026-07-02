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
      setError('Username must be between 3 and 20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    (window as any).pendo?.track('username_set', {
      username_length: trimmed.length,
    })
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
              data-tracking-id="username-input"
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
          <AlertDialogAction onClick={handleSubmit} data-tracking-id="username-submit-button">
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
