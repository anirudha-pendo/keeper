'use client'

import { useState, useEffect } from 'react'

const USERNAME_KEY = 'keeper-username'

export function useUsername() {
  const [username, setUsernameState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(USERNAME_KEY)
    setUsernameState(stored)
    setIsLoading(false)
  }, [])

  const setUsername = (value: string) => {
    localStorage.setItem(USERNAME_KEY, value)
    setUsernameState(value)
  }

  const clearUsername = () => {
    localStorage.removeItem(USERNAME_KEY)
    setUsernameState(null)
  }

  return {
    username,
    setUsername,
    clearUsername,
    isLoading,
  }
}
