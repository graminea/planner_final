'use client'

/**
 * CategoryList - Displays expandable category sections
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Expand/collapse categories
 * - Show item count and budget per category
 * - CRUD operations for categories
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoryWithItems } from '@/app/actions/categories'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'

interface CategoryListProps {
  categories: CategoryWithItems[]
  // Callback when category is selected for filtering
  // undefined = all, null = uncategorized, string = specific category
  onSelectCategory?: (categoryId: string | null | undefined) => void
  selectedCategoryId?: string | null
}

export function CategoryList({ 
  categories, 
  onSelectCategory,
  selectedCategoryId 
}: CategoryListProps) {
  const router = useRouter()
  
  // Track which categories are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  
  // New category form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryBudget, setNewCategoryBudget] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Toggle expand/collapse
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Create new category
  const handleCreate = async () => {
    if (!newCategoryName.trim()) return
    
    setIsCreating(true)
    const result = await createCategory(
      newCategoryName,
      undefined,
      newCategoryBudget ? parseFloat(newCategoryBudget) : undefined
    )
    
    if (result.success) {
      setNewCategoryName('')
      setNewCategoryBudget('')
      setShowAddForm(false)
      router.refresh()
    }
    setIsCreating(false)
  }

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria? Os itens ficarão sem categoria.')) return
    await deleteCategory(id)
    router.refresh()
  }

  return (
    <div>
      {/* Header with Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong>Categorias</strong>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancelar' : '+ Adicionar Categoria'}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div style={{ marginBottom: '12px', padding: '8px', border: '1px solid #ccc' }}>
          <div>
            <input
              type="text"
              placeholder="Nome da categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ marginRight: '8px' }}
            />
            <input
              type="number"
              placeholder="Orçamento (opcional)"
              value={newCategoryBudget}
              onChange={(e) => setNewCategoryBudget(e.target.value)}
              style={{ width: '120px', marginRight: '8px' }}
            />
            <button onClick={handleCreate} disabled={isCreating || !newCategoryName.trim()}>
              Criar
            </button>
          </div>
        </div>
      )}

      {/* "All" option */}
      <div 
        style={{ 
          padding: '4px 8px', 
          cursor: 'pointer',
          backgroundColor: selectedCategoryId === undefined ? '#eee' : 'transparent'
        }}
        onClick={() => onSelectCategory?.(undefined)}
      >
        Todos os Itens
      </div>

      {/* Category list */}
      {categories.map(category => {
        const isExpanded = expandedIds.has(category.id)
        const isSelected = selectedCategoryId === category.id
        
        // Calculate category stats
        const totalItems = category.items.length
        const boughtItems = category.items.filter(i => i.isBought).length
        const totalPlanned = category.items.reduce((sum, i) => 
          sum + (i.plannedPrice || 0), 0
        )

        return (
          <div key={category.id} style={{ marginBottom: '4px' }}>
            {/* Category header */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#e0e0ff' : 'transparent'
              }}
            >
              {/* Expand toggle */}
              <span 
                onClick={() => toggleExpanded(category.id)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
              
              {/* Category name - clicking filters */}
              <span 
                onClick={() => onSelectCategory?.(category.id)}
                style={{ flex: 1 }}
              >
                {category.icon} {category.name}
                <span style={{ color: '#888', marginLeft: '8px' }}>
                  ({boughtItems}/{totalItems})
                </span>
              </span>

              {/* Budget display */}
              {category.budget && (
                <span style={{ marginRight: '8px', fontSize: '12px' }}>
                  ${totalPlanned.toFixed(0)} / ${category.budget}
                </span>
              )}

              {/* Delete button */}
              {!category.isDefault && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                  style={{ fontSize: '12px' }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Expanded items list */}
            {isExpanded && (
              <div style={{ marginLeft: '24px', fontSize: '14px' }}>
                {category.items.length === 0 ? (
                  <div style={{ color: '#888', padding: '4px' }}>Sem itens</div>
                ) : (
                  category.items.map(item => (
                    <div key={item.id} style={{ padding: '2px 0' }}>
                      <span style={{ 
                        textDecoration: item.isBought ? 'line-through' : 'none',
                        color: item.isBought ? '#888' : 'inherit'
                      }}>
                        [{item.isBought ? 'x' : ' '}] {item.name}
                      </span>
                      {item.plannedPrice && (
                        <span style={{ marginLeft: '8px', color: '#888' }}>
                          ${item.plannedPrice}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Uncategorized option */}
      <div 
        style={{ 
          padding: '4px 8px', 
          cursor: 'pointer',
          backgroundColor: selectedCategoryId === null ? '#eee' : 'transparent'
        }}
        onClick={() => onSelectCategory?.(null)}
      >
        Sem Categoria
      </div>
    </div>
  )
}
