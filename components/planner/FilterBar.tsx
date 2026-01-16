'use client'

/**
 * FilterBar - Filter and sort controls
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Filter by bought status, category, priority, tags
 * - Sort by name, price, priority, date
 * - Search box
 * - Composable filters
 */

import { useState, useCallback } from 'react'
import type { ItemFilters, ItemSort, ItemSortField, ItemSortOrder } from '@/app/actions/items-new'
import type { Category } from '@/app/actions/categories'
import type { Tag } from '@/app/actions/tags'
import { PRIORITY_OPTIONS, SORT_OPTIONS } from '@/lib/filters'

interface FilterBarProps {
  categories: Category[]
  tags: Tag[]
  filters: ItemFilters
  sort: ItemSort
  onFiltersChange: (filters: ItemFilters) => void
  onSortChange: (sort: ItemSort) => void
  // Filter counts for badges
  counts?: {
    bought: number
    notBought: number
    byCategory: Record<string, number>
  }
}

export function FilterBar({
  categories,
  tags,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  counts
}: FilterBarProps) {
  // Local search state (debounced)
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Update filter
  const setFilter = useCallback(<K extends keyof ItemFilters>(
    key: K,
    value: ItemFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }, [filters, onFiltersChange])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchValue('')
    onFiltersChange({})
  }, [onFiltersChange])

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Simple debounce - in production use useDebouncedValue
    setTimeout(() => {
      setFilter('search', value || undefined)
    }, 300)
  }

  // Toggle tag filter
  const toggleTagFilter = (tagId: string) => {
    const currentTags = filters.tagIds || []
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId]
    setFilter('tagIds', newTags.length > 0 ? newTags : undefined)
  }

  return (
    <div style={{ padding: '8px', border: '1px solid #ddd', marginBottom: '16px' }}>
      {/* Search */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="Buscar itens..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ width: '200px', marginRight: '8px' }}
        />
        <button onClick={clearFilters}>Limpar Tudo</button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        {/* Bought Status Filter */}
        <div>
          <label style={{ marginRight: '4px' }}>Status:</label>
          <select
            value={filters.isBought === undefined ? '' : filters.isBought.toString()}
            onChange={(e) => {
              const val = e.target.value
              setFilter('isBought', val === '' ? undefined : val === 'true')
            }}
          >
            <option value="">Todos ({(counts?.bought || 0) + (counts?.notBought || 0)})</option>
            <option value="false">A Comprar ({counts?.notBought || 0})</option>
            <option value="true">Comprados ({counts?.bought || 0})</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label style={{ marginRight: '4px' }}>Categoria:</label>
          <select
            value={filters.categoryId === undefined ? '' : (filters.categoryId || 'null')}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') setFilter('categoryId', undefined)
              else if (val === 'null') setFilter('categoryId', null)
              else setFilter('categoryId', val)
            }}
          >
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({counts?.byCategory[cat.id] || 0})
              </option>
            ))}
            <option value="null">Sem Categoria</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label style={{ marginRight: '4px' }}>Prioridade:</label>
          <select
            value={filters.priority ?? ''}
            onChange={(e) => {
              const val = e.target.value
              setFilter('priority', val ? parseInt(val) : undefined)
            }}
          >
            <option value="">Todas</option>
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <label>Tags: </label>
          {tags.map(tag => {
            const isActive = filters.tagIds?.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                style={{
                  marginRight: '4px',
                  padding: '2px 8px',
                  backgroundColor: isActive ? '#007bff' : '#eee',
                  color: isActive ? 'white' : 'black',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Sort Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label>Sort by:</label>
        <select
          value={sort.field}
          onChange={(e) => onSortChange({ ...sort, field: e.target.value as ItemSortField })}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.field} value={opt.field}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => onSortChange({ 
            ...sort, 
            order: sort.order === 'asc' ? 'desc' : 'asc' 
          })}
        >
          {sort.order === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>
    </div>
  )
}
