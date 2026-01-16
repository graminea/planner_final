'use client'

import { useState, useEffect } from 'react'
import { updateItem } from '@/app/actions/items'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OptionEditor } from './OptionEditor'
import type { Item } from '@/app/actions/items'

interface ItemDrawerProps {
  item: Item | null
  open: boolean
  onClose: () => void
}

export function ItemDrawer({ item, open, onClose }: ItemDrawerProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name)
      setNotes(item.notes || '')
    }
  }, [item])

  const handleSave = async () => {
    if (!item) return

    setIsLoading(true)
    await updateItem(item.id, {
      name,
      notes: notes || null,
    })
    setIsLoading(false)
    onClose()
  }

  if (!item) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Item</SheetTitle>
          <SheetDescription>
            Update item details and manage purchase options.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this item..."
                disabled={isLoading}
              />
            </div>

            <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
              Save Changes
            </Button>
          </div>

          <hr />

          <OptionEditor itemId={item.id} options={item.options} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
