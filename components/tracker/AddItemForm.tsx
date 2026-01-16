'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createItem } from '@/app/actions/items'

export function AddItemForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)

    const result = await createItem(name)

    if (result.success) {
      setName('')
      router.refresh() // Refresh to show new item
    } else {
      setError(result.error || 'Failed to add item')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Add a new item..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !name.trim()}>
        <Plus className="h-4 w-4" />
        Add
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </form>
  )
}
