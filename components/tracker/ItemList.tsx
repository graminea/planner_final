'use client'

import { useState, useOptimistic, useCallback, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AddItemForm } from './AddItemForm'
import { ItemRow } from './ItemRow'
import { ItemDrawer } from './ItemDrawer'
import type { Item } from '@/app/actions/items'

interface ItemListProps {
  initialItems: Item[]
}

type OptimisticAction = 
  | { type: 'toggle'; id: string; newChecked: boolean }
  | { type: 'delete'; id: string }

export function ItemList({ initialItems }: ItemListProps) {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Optimistic state for immediate UI updates
  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    initialItems,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'toggle':
          return state.map(item =>
            item.id === action.id ? { ...item, checked: action.newChecked } : item
          )
        case 'delete':
          return state.filter(item => item.id !== action.id)
        default:
          return state
      }
    }
  )

  const handleToggle = useCallback((id: string, newChecked: boolean) => {
    startTransition(() => {
      updateOptimisticItems({ type: 'toggle', id, newChecked })
    })
  }, [updateOptimisticItems])

  const handleDelete = useCallback((id: string) => {
    startTransition(() => {
      updateOptimisticItems({ type: 'delete', id })
    })
  }, [updateOptimisticItems])

  const handleSelectItem = useCallback((item: Item) => {
    // Find current item state from optimistic items
    const currentItem = optimisticItems.find(i => i.id === item.id)
    if (currentItem) {
      setSelectedItem(currentItem)
      setIsDrawerOpen(true)
    }
  }, [optimisticItems])

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedItem(null)
    // Refresh from server
    router.refresh()
  }, [router])

  // Separate checked and unchecked items
  const uncheckedItems = optimisticItems.filter((item) => !item.checked)
  const checkedItems = optimisticItems.filter((item) => item.checked)

  return (
    <div className="space-y-6">
      <AddItemForm />

      <div className="space-y-4">
        {optimisticItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No items yet. Add your first item to get started!
            </p>
          </div>
        ) : (
          <>
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  To Buy ({uncheckedItems.length})
                </h3>
                {uncheckedItems.map((item) => (
                  <ItemRow 
                    key={item.id} 
                    item={item} 
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onSelect={handleSelectItem} 
                  />
                ))}
              </div>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Purchased ({checkedItems.length})
                </h3>
                {checkedItems.map((item) => (
                  <ItemRow 
                    key={item.id} 
                    item={item} 
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onSelect={handleSelectItem} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ItemDrawer
        item={selectedItem}
        open={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  )
}
