'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'keeper-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    const initial = stored ?? 'system'
    setThemeState(initial)
    applyTheme(initial)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const current = localStorage.getItem(THEME_KEY) as Theme | null
      if (!current || current === 'system') {
        applyTheme('system')
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((value: Theme) => {
    localStorage.setItem(THEME_KEY, value)
    setThemeState(value)
    applyTheme(value)
  }, [])

  return { theme, setTheme }
}
