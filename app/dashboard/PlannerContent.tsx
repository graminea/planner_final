'use client'

/**
 * PlannerContent - Main dashboard content (Client Component)
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Handles client-side state for:
 * - Filters
 * - Sorting
 * - UI interactions
 */

import { useState, useMemo } from 'react'
import type { Category, CategoryWithItems } from '@/app/actions/categories'
import type { Item, ItemFilters, ItemSort } from '@/app/actions/items-new'
import type { Tag } from '@/app/actions/tags'
import type { BudgetSummary } from '@/app/actions/budget'

import { 
  CategoryList,
  FilterBar,
  BudgetDisplay,
  TagManager,
  ItemForm,
  PlannerItemList
} from '@/components/planner'
import { DEFAULT_FILTERS, DEFAULT_SORT, getFilterCounts } from '@/lib/filters'

interface PlannerContentProps {
  categories: Category[]
  categoriesWithItems: CategoryWithItems[]
  initialItems: Item[]
  tags: Tag[]
  budgetSummary: BudgetSummary | null
}

export function PlannerContent({
  categories,
  categoriesWithItems,
  initialItems,
  tags,
  budgetSummary
}: PlannerContentProps) {
  // Filter and sort state
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<ItemSort>(DEFAULT_SORT)
  
  // Show/hide sections
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)

  // Calculate filter counts
  const filterCounts = useMemo(() => 
    getFilterCounts(initialItems),
    [initialItems]
  )

  // Handle category filter from sidebar
  const handleCategorySelect = (categoryId: string | null | undefined) => {
    if (categoryId === undefined) {
      // "All" selected - clear category filter
      setFilters(prev => ({ ...prev, categoryId: undefined }))
    } else {
      setFilters(prev => ({ ...prev, categoryId }))
    }
  }

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      {/* Left Sidebar */}
      <aside style={{ width: '280px', flexShrink: 0 }}>
        {/* Budget */}
        <div style={{ marginBottom: '16px' }}>
          <BudgetDisplay summary={budgetSummary} />
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '16px' }}>
          <CategoryList
            categories={categoriesWithItems}
            selectedCategoryId={filters.categoryId}
            onSelectCategory={handleCategorySelect}
          />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={() => setShowTagManager(!showTagManager)}
            style={{ width: '100%', textAlign: 'left', padding: '8px' }}
          >
            Gerenciar Etiquetas ({tags.length})
          </button>
          {showTagManager && <TagManager tags={tags} />}
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Add Item Button/Form */}
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {showAddForm ? 'x Cancelar' : '+ Adicionar Item'}
          </button>
          
          {showAddForm && (
            <div style={{ marginTop: '8px' }}>
              <ItemForm
                categories={categories}
                tags={tags}
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          categories={categories}
          tags={tags}
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          counts={filterCounts}
        />

        {/* Items List */}
        <PlannerItemList
          items={initialItems}
          categories={categories}
          tags={tags}
          filters={filters}
          sort={sort}
        />
      </div>
    </div>
  )
}
