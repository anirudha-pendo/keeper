'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { getBookmarks, importBookmarks } from '@/app/actions/bookmarks'
import { parseJsonImport, parseHtmlImport } from '@/lib/import-parsers'
import { ImportDialog } from '@/components/import-dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { BookmarkInput } from '@/lib/types'

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function SettingsPage() {
  const { username, clearUsername } = useUsername()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importBookmarksList, setImportBookmarksList] = useState<BookmarkInput[]>([])
  const [importDuplicates, setImportDuplicates] = useState<Set<string>>(new Set())
  const jsonFileRef = useRef<HTMLInputElement>(null)
  const htmlFileRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    if (!username) return
    const result = await getBookmarks(username)
    if (result.success && result.data) {
      const jsonString = JSON.stringify(result.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `keeper-${username}-bookmarks.json`
      a.click()
      URL.revokeObjectURL(url)
      if (typeof pendo !== 'undefined') {
        pendo.track('bookmarks_exported', {
          bookmarkCount: result.data.length,
          exportFormat: 'json',
          fileSizeBytes: jsonString.length,
          username,
        })
      }
    }
  }

  const handleImportFile = async (file: File, format: 'json' | 'html') => {
    if (!username) return
    try {
      const content = await file.text()
      let parsed: BookmarkInput[]

      if (format === 'json') {
        parsed = parseJsonImport(content)
      } else {
        parsed = parseHtmlImport(content)
      }

      if (parsed.length === 0) {
        toast.error('No bookmarks found in the file')
        return
      }

      // Check for duplicates
      const existingResult = await getBookmarks(username)
      const existingUrls = new Set<string>()
      if (existingResult.success && existingResult.data) {
        existingResult.data.forEach((b) => {
          try {
            existingUrls.add(new URL(b.url).href)
          } catch {
            existingUrls.add(b.url)
          }
        })
      }

      const duplicates = new Set<string>()
      parsed.forEach((b) => {
        try {
          if (existingUrls.has(new URL(b.url).href)) {
            duplicates.add(b.url)
          }
        } catch {
          if (existingUrls.has(b.url)) {
            duplicates.add(b.url)
          }
        }
      })

      setImportBookmarksList(parsed)
      setImportDuplicates(duplicates)
      setShowImportDialog(true)
      if (typeof pendo !== 'undefined') {
        pendo.track('bookmarks_import_started', {
          importFormat: format,
          totalParsed: parsed.length,
          newBookmarks: parsed.length - duplicates.size,
          duplicateCount: duplicates.size,
          fileName: file.name,
        })
      }
    } catch (err: any) {
      toast.error(`Failed to parse file: ${err.message}`)
    }
  }

  const handleImportConfirm = async (bookmarks: BookmarkInput[]) => {
    if (!username) return
    const result = await importBookmarks(username, bookmarks)
    if (result.success && result.data) {
      if (typeof pendo !== 'undefined') {
        pendo.track('bookmarks_import_completed', {
          importedCount: result.data.imported,
          skippedCount: bookmarks.length - result.data.imported,
          totalAttempted: bookmarks.length,
        })
      }
      toast.success(`Imported ${result.data.imported} bookmark${result.data.imported !== 1 ? 's' : ''}`)
      setShowImportDialog(false)
    } else {
      toast.error(result.error || 'Import failed')
    }
  }

  const handleLogout = () => {
    if (typeof pendo !== 'undefined') {
      pendo.track('user_logged_out', {
        username,
      })
      pendo.clearSession()
    }
    clearUsername()
    router.replace('/auth')
  }

  if (!username) return null

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-lg font-semibold mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Username</p>
                <p className="text-xs text-muted-foreground">@{username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look of the app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (typeof pendo !== 'undefined') {
                      pendo.track('theme_changed', {
                        newTheme: option.value,
                        previousTheme: theme,
                      })
                    }
                    setTheme(option.value)
                  }}
                  className={cn(
                    'text-xs',
                    theme !== option.value && 'text-muted-foreground'
                  )}
                  data-tracking-id={`settings-theme-${option.value}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>Import and export your bookmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-2">Export</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  data-tracking-id="settings-export-bookmarks"
                >
                  Export as JSON
                </Button>
              </div>

              <div>
                <p className="text-xs font-medium mb-2">Import</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => jsonFileRef.current?.click()}
                    data-tracking-id="settings-import-json"
                  >
                    Import from JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => htmlFileRef.current?.click()}
                    data-tracking-id="settings-import-html"
                  >
                    Import from HTML
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Import from Keeper JSON export or browser bookmark HTML export
                </p>
              </div>

              <input
                ref={jsonFileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportFile(file, 'json')
                  e.target.value = ''
                }}
              />
              <input
                ref={htmlFileRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportFile(file, 'html')
                  e.target.value = ''
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Sign out of your account</CardDescription>
          </CardHeader>
          <CardContent>
            {showLogoutConfirm ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to log out? You can log back in with your username to access your bookmarks.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    data-tracking-id="settings-logout-confirm"
                  >
                    Confirm Logout
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogoutConfirm(false)}
                    data-tracking-id="settings-logout-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-destructive"
                data-tracking-id="settings-logout"
              >
                Logout
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        bookmarks={importBookmarksList}
        duplicateUrls={importDuplicates}
        onConfirm={handleImportConfirm}
      />
    </div>
  )
}
