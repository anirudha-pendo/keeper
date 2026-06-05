'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  const { username: existingUsername, setUsername, isLoading } = useUsername()
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && existingUsername) {
      router.replace('/dashboard')
    }
  }, [isLoading, existingUsername, router])

  const handleSubmit = () => {
    const trimmed = value.trim()

    if (trimmed.length < 3 || trimmed.length > 20) {
      setError('Username must be between 3 and 20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    setUsername(trimmed)

    if (typeof pendo !== 'undefined') {
      pendo.identify({
        visitor: {
          id: trimmed,
          username: trimmed,
          createdAt: new Date().toISOString(),
        },
      })
      pendo.track('user_signed_up', {
        username: trimmed,
        usernameLength: trimmed.length,
        createdAt: new Date().toISOString(),
      })
    }

    router.replace('/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (isLoading || existingUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Welcome to Keeper</CardTitle>
          <CardDescription>
            Choose a username to get started. Your bookmarks will be saved under this username.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter username"
                autoFocus
                data-tracking-id="auth-username-input"
              />
              {error ? (
                <FieldDescription className="text-destructive">
                  {error}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  3-20 characters, letters, numbers, and underscores only
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full" data-tracking-id="auth-submit-button">
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
