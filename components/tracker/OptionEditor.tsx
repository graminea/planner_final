'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createOption, updateOption, deleteOption } from '@/app/actions/options'
import type { Option } from '@/app/actions/items'

interface OptionEditorProps {
  itemId: string
  options: Option[]
}

export function OptionEditor({ itemId, options }: OptionEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newOption, setNewOption] = useState({
    store: '',
    url: '',
    currentPrice: '',
    desiredPrice: '',
    minPrice: '',
    notes: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newOption.store.trim()) return

    setIsLoading(true)

    await createOption(itemId, {
      store: newOption.store,
      url: newOption.url || null,
      currentPrice: newOption.currentPrice ? parseFloat(newOption.currentPrice) : null,
      desiredPrice: newOption.desiredPrice ? parseFloat(newOption.desiredPrice) : null,
      minPrice: newOption.minPrice ? parseFloat(newOption.minPrice) : null,
      notes: newOption.notes || null,
    })

    setNewOption({
      store: '',
      url: '',
      currentPrice: '',
      desiredPrice: '',
      minPrice: '',
      notes: '',
    })
    setIsAdding(false)
    setIsLoading(false)
  }

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Delete this option?')) return
    await deleteOption(optionId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Purchase Options</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddOption} className="space-y-3 p-4 border rounded-lg bg-muted/50">
          <div className="grid gap-2">
            <Label htmlFor="store">Store Name *</Label>
            <Input
              id="store"
              value={newOption.store}
              onChange={(e) => setNewOption({ ...newOption, store: e.target.value })}
              placeholder="e.g., Amazon, Best Buy"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={newOption.url}
              onChange={(e) => setNewOption({ ...newOption, url: e.target.value })}
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="currentPrice">Current Price</Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                value={newOption.currentPrice}
                onChange={(e) => setNewOption({ ...newOption, currentPrice: e.target.value })}
                placeholder="$0.00"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="desiredPrice">Desired Price</Label>
              <Input
                id="desiredPrice"
                type="number"
                step="0.01"
                value={newOption.desiredPrice}
                onChange={(e) => setNewOption({ ...newOption, desiredPrice: e.target.value })}
                placeholder="$0.00"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="minPrice">Min Price Seen</Label>
              <Input
                id="minPrice"
                type="number"
                step="0.01"
                value={newOption.minPrice}
                onChange={(e) => setNewOption({ ...newOption, minPrice: e.target.value })}
                placeholder="$0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newOption.notes}
              onChange={(e) => setNewOption({ ...newOption, notes: e.target.value })}
              placeholder="Any additional notes..."
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !newOption.store.trim()}>
              Add Option
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {options.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No purchase options yet. Add one to track prices!
        </p>
      )}

      <div className="space-y-2">
        {options.map((option) => (
          <OptionCard key={option.id} option={option} onDelete={handleDeleteOption} />
        ))}
      </div>
    </div>
  )
}

interface OptionCardProps {
  option: Option
  onDelete: (id: string) => void
}

function OptionCard({ option, onDelete }: OptionCardProps) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{option.store}</span>
            {option.url && (
              <a
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
            {option.currentPrice && (
              <span>Current: ${option.currentPrice.toFixed(2)}</span>
            )}
            {option.desiredPrice && (
              <span>Target: ${option.desiredPrice.toFixed(2)}</span>
            )}
            {option.minPrice && (
              <span>Min: ${option.minPrice.toFixed(2)}</span>
            )}
          </div>

          {option.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{option.notes}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(option.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
