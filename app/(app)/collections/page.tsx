'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUsername } from '@/hooks/use-username'
import { getBookmarks, getCollections, createCollection, updateCollection, deleteCollection } from '@/app/actions/bookmarks'
import { CollectionCard } from '@/components/collection-card'
import { CollectionForm } from '@/components/collection-form'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import type { Bookmark, Collection } from '@/lib/types'

export default function CollectionsPage() {
  const { username } = useUsername()
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>()

  useEffect(() => {
    if (username) {
      loadData()
    }
  }, [username])

  const loadData = async () => {
    if (!username) return
    setIsLoading(true)
    const [collectionsResult, bookmarksResult] = await Promise.all([
      getCollections(username),
      getBookmarks(username),
    ])
    if (collectionsResult.success && collectionsResult.data) {
      setCollections(collectionsResult.data)
    }
    if (bookmarksResult.success && bookmarksResult.data) {
      setBookmarks(bookmarksResult.data)
    }
    setIsLoading(false)
  }

  const getBookmarkCount = (collectionId: string) => {
    return bookmarks.filter((b) => b.collectionId === collectionId).length
  }

  const handleCreate = async (data: { name: string; description?: string; color: string }) => {
    if (!username) return
    const result = await createCollection(username, data)
    if (result.success) {
      window.pendo?.track('collection_created', {
        has_description: !!data.description?.trim(),
        color: data.color,
      })
      toast.success('Collection created')
      loadData()
    } else {
      throw new Error(result.error)
    }
  }

  const handleUpdate = async (data: { name: string; description?: string; color: string }) => {
    if (!username || !editingCollection) return
    const result = await updateCollection(username, editingCollection.id, data)
    if (result.success) {
      window.pendo?.track('collection_updated', {
        has_description: !!data.description?.trim(),
        color: data.color,
      })
      toast.success('Collection updated')
      loadData()
    } else {
      throw new Error(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!username) return
    const result = await deleteCollection(username, id)
    if (result.success) {
      window.pendo?.track('collection_deleted', {
        bookmark_count: getBookmarkCount(id),
      })
      toast.success('Collection deleted')
      loadData()
    }
  }

  const handleCollectionClick = (collection: Collection) => {
    router.push(`/bookmarks?collection=${collection.id}`)
  }

  const handleAddNew = () => {
    setEditingCollection(undefined)
    setShowForm(true)
  }

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setShowForm(true)
  }

  if (!username) return null

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">Collections</h1>
            <p className="text-xs text-muted-foreground">
              {collections.length} collection{collections.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleAddNew} size="sm" data-tracking-id="add-new-collection-button">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg mb-2">No collections yet</p>
          <p className="text-muted-foreground text-sm mb-4">
            Create a collection to organize your bookmarks
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bookmarkCount={getBookmarkCount(collection.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={handleCollectionClick}
            />
          ))}
        </div>
      )}

      <CollectionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingCollection(undefined)
        }}
        onSubmit={editingCollection ? handleUpdate : handleCreate}
        collection={editingCollection}
      />
    </div>
  )
}
