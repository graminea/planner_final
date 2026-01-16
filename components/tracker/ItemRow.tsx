'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toggleItemChecked, deleteItem } from '@/app/actions/items'
import type { Item } from '@/app/actions/items'
import { cn } from '@/lib/utils'

interface ItemRowProps {
  item: Item
  onToggle?: (id: string, newChecked: boolean) => void
  onDelete?: (id: string) => void
  onSelect: (item: Item) => void
}

export function ItemRow({ item, onToggle, onDelete, onSelect }: ItemRowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Optimistic state for immediate checkbox feedback
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    item.checked,
    (_, newChecked: boolean) => newChecked
  )

  const handleToggle = () => {
    const newChecked = !item.checked
    startTransition(async () => {
      // Optimistic update
      setOptimisticChecked(newChecked)
      
      // Notify parent for immediate list re-ordering
      onToggle?.(item.id, newChecked)
      
      // Call server action
      await toggleItemChecked(item.id)
      
      // Refresh to sync with server
      router.refresh()
    })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this item?')) return

    setIsDeleting(true)
    
    // Notify parent for immediate removal
    onDelete?.(item.id)
    
    await deleteItem(item.id)
    router.refresh()
  }

  // Find best price option
  const bestOption = item.options.length > 0
    ? item.options.reduce((best, opt) => {
        if (!opt.currentPrice) return best
        if (!best || !best.currentPrice) return opt
        return opt.currentPrice < best.currentPrice ? opt : best
      }, item.options[0])
    : null

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer',
        optimisticChecked && 'opacity-60',
        (isPending || isDeleting) && 'opacity-50 pointer-events-none'
      )}
      onClick={() => onSelect(item)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={optimisticChecked}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          optimisticChecked && 'line-through text-muted-foreground'
        )}>
          {item.name}
        </p>
        
        {bestOption && bestOption.currentPrice && (
          <p className="text-sm text-muted-foreground">
            Best: {bestOption.store} - ${bestOption.currentPrice.toFixed(2)}
          </p>
        )}
        
        {item.options.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {item.options.length} option{item.options.length !== 1 && 's'}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
