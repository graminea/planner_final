'use client'

/**
 * PlannerItemList - Main item list component
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Display items with filters and sorting applied
 * - Inline item editing
 * - Toggle bought status
 * - Link management
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Item, ItemFilters, ItemSort } from '@/app/actions/items-new'
import type { Category } from '@/app/actions/categories'
import type { Tag } from '@/app/actions/tags'
import { toggleItemBought, deleteItem } from '@/app/actions/items-new'
import { ItemForm } from './ItemForm'
import { ItemLinkEditor } from './ItemLinkEditor'
import { filterAndSortItems, getFilterCounts, PRIORITY_LABELS } from '@/lib/filters'

interface PlannerItemListProps {
  items: Item[]
  categories: Category[]
  tags: Tag[]
  filters: ItemFilters
  sort: ItemSort
}

export function PlannerItemList({
  items,
  categories,
  tags,
  filters,
  sort
}: PlannerItemListProps) {
  const router = useRouter()
  
  // Apply client-side filtering and sorting
  const displayedItems = useMemo(() => 
    filterAndSortItems(items, filters, sort),
    [items, filters, sort]
  )

  // Track expanded items (for showing links)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  
  // Track editing item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // Toggle bought status
  const handleToggleBought = async (itemId: string) => {
    await toggleItemBought(itemId)
    router.refresh()
  }

  // Delete item
  const handleDelete = async (itemId: string) => {
    if (!confirm('Excluir este item?')) return
    await deleteItem(itemId)
    router.refresh()
  }

  if (displayedItems.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Nenhum item corresponde aos filtros.
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
        Mostrando {displayedItems.length} de {items.length} itens
      </div>

      {displayedItems.map(item => {
        const isExpanded = expandedItemId === item.id
        const isEditing = editingItemId === item.id

        return (
          <div 
            key={item.id} 
            style={{ 
              border: '1px solid #ddd', 
              marginBottom: '8px',
              backgroundColor: item.isBought ? '#f8f8f8' : 'white'
            }}
          >
            {/* Item Header */}
            <div style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={item.isBought}
                onChange={() => handleToggleBought(item.id)}
                style={{ width: '18px', height: '18px' }}
              />

              {/* Main info */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 'bold',
                  textDecoration: item.isBought ? 'line-through' : 'none',
                  color: item.isBought ? '#888' : 'inherit'
                }}>
                  {item.name}
                </div>
                
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {/* Category */}
                  {item.category && (
                    <span style={{ marginRight: '8px' }}>
                      {item.category.icon} {item.category.name}
                    </span>
                  )}
                  
                  {/* Priority */}
                  <span style={{ marginRight: '8px' }}>
                    [{PRIORITY_LABELS[item.priority]}]
                  </span>

                  {/* Tags */}
                  {item.tags.map(tag => (
                    <span 
                      key={tag.id} 
                      style={{ 
                        marginRight: '4px', 
                        backgroundColor: '#eee', 
                        padding: '0 4px',
                        fontSize: '10px'
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                {item.isBought && item.boughtPrice ? (
                  <div style={{ fontWeight: 'bold' }}>
                    R${item.boughtPrice.toFixed(2)}
                    <div style={{ fontSize: '10px', color: '#888' }}>Pago</div>
                  </div>
                ) : item.selectedLink ? (
                  <div>
                    R${item.selectedLink.price.toFixed(2)}
                    <div style={{ fontSize: '10px', color: '#888' }}>{item.selectedLink.store}</div>
                  </div>
                ) : item.plannedPrice ? (
                  <div>
                    R${item.plannedPrice.toFixed(2)}
                    <div style={{ fontSize: '10px', color: '#888' }}>Planejado</div>
                  </div>
                ) : (
                  <span style={{ color: '#888' }}>Sem preço</span>
                )}
              </div>

              {/* Links count */}
              <button
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                style={{ fontSize: '12px' }}
              >
                Links ({item.links.length})
                {isExpanded ? ' ▲' : ' ▼'}
              </button>

              {/* Edit button */}
              <button
                onClick={() => setEditingItemId(isEditing ? null : item.id)}
                style={{ fontSize: '12px' }}
              >
                Editar
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(item.id)}
                style={{ fontSize: '12px', color: '#dc3545' }}
              >
                Excluir
              </button>
            </div>

            {/* Notes */}
            {item.notes && (
              <div style={{ padding: '0 8px 8px', fontSize: '12px', color: '#666' }}>
                Nota: {item.notes}
              </div>
            )}

            {/* Expanded: Links */}
            {isExpanded && (
              <div style={{ padding: '8px', borderTop: '1px solid #eee' }}>
                <ItemLinkEditor
                  itemId={item.id}
                  links={item.links}
                  lowestPrice={item.lowestPrice}
                />
              </div>
            )}

            {/* Editing: Form */}
            {isEditing && (
              <div style={{ padding: '8px', borderTop: '1px solid #eee' }}>
                <ItemForm
                  categories={categories}
                  tags={tags}
                  item={item}
                  onSuccess={() => setEditingItemId(null)}
                  onCancel={() => setEditingItemId(null)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
