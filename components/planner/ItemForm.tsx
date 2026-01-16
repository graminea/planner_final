'use client'

/**
 * ItemForm - Create/Edit item form
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Name with autocomplete suggestions
 * - Category selection
 * - Priority selection
 * - Planned price
 * - Tags
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createItem, updateItem } from '@/app/actions/items-new'
import type { Item } from '@/app/actions/items-new'
import type { Category } from '@/app/actions/categories'
import type { Tag } from '@/app/actions/tags'
import type { ItemSuggestion } from '@/app/actions/suggestions'
import { ItemSuggestionInput } from './ItemSuggestionInput'
import { PRIORITY_OPTIONS } from '@/lib/filters'

interface ItemFormProps {
  categories: Category[]
  tags: Tag[]
  // If provided, we're editing
  item?: Item
  // Callback on success
  onSuccess?: () => void
  onCancel?: () => void
}

export function ItemForm({ 
  categories, 
  tags, 
  item, 
  onSuccess, 
  onCancel 
}: ItemFormProps) {
  const router = useRouter()
  const isEditing = !!item

  // Form state
  const [name, setName] = useState(item?.name || '')
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId || null)
  const [priority, setPriority] = useState(item?.priority || 2)
  const [plannedPrice, setPlannedPrice] = useState(item?.plannedPrice?.toString() || '')
  const [notes, setNotes] = useState(item?.notes || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    item?.tags.map(t => t.id) || []
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: ItemSuggestion) => {
    setName(suggestion.name)
    
    // Auto-select category if suggestion has one
    if (suggestion.categoryName) {
      const matchingCategory = categories.find(
        c => c.name.toLowerCase() === suggestion.categoryName?.toLowerCase()
      )
      if (matchingCategory) {
        setCategoryId(matchingCategory.id)
      }
    }
  }, [categories])

  // Toggle tag
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('O nome do item é obrigatório')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing) {
        const result = await updateItem(item.id, {
          name: name.trim(),
          categoryId,
          priority,
          plannedPrice: plannedPrice ? parseFloat(plannedPrice) : null,
          notes: notes || null
        })
        
        if (!result.success) {
          setError(result.error || 'Failed to update item')
          setIsSubmitting(false)
          return
        }
      } else {
        const result = await createItem({
          name: name.trim(),
          categoryId,
          priority,
          plannedPrice: plannedPrice ? parseFloat(plannedPrice) : null,
          notes: notes || null,
          tagIds: selectedTagIds
        })
        
        if (!result.success) {
          setError(result.error || 'Failed to create item')
          setIsSubmitting(false)
          return
        }
      }

      router.refresh()
      onSuccess?.()
      
      // Reset form if creating
      if (!isEditing) {
        setName('')
        setCategoryId(null)
        setPriority(2)
        setPlannedPrice('')
        setNotes('')
        setSelectedTagIds([])
      }
    } catch (err) {
      setError('Ocorreu um erro')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '8px', border: '1px solid #ddd' }}>
      <h3>{isEditing ? 'Editar Item' : 'Adicionar Novo Item'}</h3>

      {error && (
        <div style={{ color: 'red', marginBottom: '8px' }}>{error}</div>
      )}

      {/* Name with autocomplete */}
      <div style={{ marginBottom: '8px' }}>
        <label>Nome:</label>
        <ItemSuggestionInput
          value={name}
          onChange={setName}
          onSelectSuggestion={handleSelectSuggestion}
          placeholder="Nome do item..."
        />
      </div>

      {/* Category */}
      <div style={{ marginBottom: '8px' }}>
        <label>Categoria: </label>
        <select
          value={categoryId || ''}
          onChange={(e) => setCategoryId(e.target.value || null)}
        >
          <option value="">Sem Categoria</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div style={{ marginBottom: '8px' }}>
        <label>Prioridade: </label>
        {PRIORITY_OPTIONS.map(opt => (
          <label key={opt.value} style={{ marginRight: '12px' }}>
            <input
              type="radio"
              name="priority"
              value={opt.value}
              checked={priority === opt.value}
              onChange={() => setPriority(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Planned Price */}
      <div style={{ marginBottom: '8px' }}>
        <label>Preço Planejado: </label>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={plannedPrice}
          onChange={(e) => setPlannedPrice(e.target.value)}
          style={{ width: '100px' }}
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <label>Etiquetas: </label>
          {tags.map(tag => (
            <label key={tag.id} style={{ marginRight: '8px' }}>
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: '8px' }}>
        <label>Notas:</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas opcionais..."
          style={{ width: '100%', minHeight: '60px' }}
        />
      </div>

      {/* Actions */}
      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Adicionar Item')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ marginLeft: '8px' }}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
