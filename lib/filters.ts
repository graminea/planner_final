/**
 * Filter and Sort Logic (Client-Side)
 * 
 * Pure functions for filtering and sorting items.
 * This logic lives outside UI components for easy testing and v0 redesign.
 */

import type { Item, ItemFilters, ItemSort, ItemSortField, ItemSortOrder } from '@/lib/types'

// ============================================================================
// FILTER FUNCTIONS
// ============================================================================

/**
 * Apply all filters to an items array
 */
export function filterItems(items: Item[], filters: ItemFilters): Item[] {
  return items.filter(item => {
    // Filter by bought status
    if (filters.isBought !== undefined && item.isBought !== filters.isBought) {
      return false
    }

    // Filter by category
    if (filters.categoryId !== undefined) {
      if (filters.categoryId === null && item.categoryId !== null) return false
      if (filters.categoryId !== null && item.categoryId !== filters.categoryId) return false
    }

    // Filter by priority
    if (filters.priority !== undefined && item.priority !== filters.priority) {
      return false
    }

    // Filter by tags (item must have at least one of the specified tags)
    if (filters.tagIds && filters.tagIds.length > 0) {
      const itemTagIds = item.tags.map(t => t.id)
      const hasMatchingTag = filters.tagIds.some(tagId => itemTagIds.includes(tagId))
      if (!hasMatchingTag) return false
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = item.name.toLowerCase().includes(searchLower)
      const notesMatch = item.notes?.toLowerCase().includes(searchLower) || false
      const categoryMatch = item.category?.name.toLowerCase().includes(searchLower) || false
      if (!nameMatch && !notesMatch && !categoryMatch) return false
    }

    return true
  })
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: ItemFilters): boolean {
  return Boolean(
    filters.isBought !== undefined ||
    filters.categoryId !== undefined ||
    filters.priority !== undefined ||
    (filters.tagIds && filters.tagIds.length > 0) ||
    (filters.search && filters.search.length > 0)
  )
}

/**
 * Count items matching each filter option (for UI badges)
 */
export function getFilterCounts(items: Item[]): {
  bought: number
  notBought: number
  byCategory: Record<string, number>
  byPriority: Record<number, number>
  byTag: Record<string, number>
} {
  const counts = {
    bought: 0,
    notBought: 0,
    byCategory: {} as Record<string, number>,
    byPriority: { 1: 0, 2: 0, 3: 0 },
    byTag: {} as Record<string, number>
  }

  items.forEach(item => {
    // Bought status
    if (item.isBought) counts.bought++
    else counts.notBought++

    // Category
    const catId = item.categoryId || 'uncategorized'
    counts.byCategory[catId] = (counts.byCategory[catId] || 0) + 1

    // Priority
    const priority = item.priority as 1 | 2 | 3
    counts.byPriority[priority] = (counts.byPriority[priority] || 0) + 1

    // Tags
    item.tags.forEach(tag => {
      counts.byTag[tag.id] = (counts.byTag[tag.id] || 0) + 1
    })
  })

  return counts
}

// ============================================================================
// SORT FUNCTIONS
// ============================================================================

/**
 * Sort items by field and order
 */
export function sortItems(items: Item[], sort: ItemSort): Item[] {
  const sorted = [...items]
  
  sorted.sort((a, b) => {
    let comparison = 0

    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break

      case 'price':
        // Use selected link price, then planned price, then 0
        const priceA = a.selectedLink?.price ?? a.plannedPrice ?? 0
        const priceB = b.selectedLink?.price ?? b.plannedPrice ?? 0
        comparison = priceA - priceB
        break

      case 'priority':
        comparison = a.priority - b.priority
        break

      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break

      default:
        comparison = 0
    }

    return sort.order === 'desc' ? -comparison : comparison
  })

  return sorted
}

/**
 * Apply both filter and sort
 */
export function filterAndSortItems(
  items: Item[],
  filters: ItemFilters,
  sort: ItemSort
): Item[] {
  const filtered = filterItems(items, filters)
  return sortItems(filtered, sort)
}

// ============================================================================
// GROUP FUNCTIONS
// ============================================================================

/**
 * Group items by category
 */
export function groupByCategory(items: Item[]): Map<string | null, Item[]> {
  const groups = new Map<string | null, Item[]>()
  
  items.forEach(item => {
    const categoryId = item.categoryId
    if (!groups.has(categoryId)) {
      groups.set(categoryId, [])
    }
    groups.get(categoryId)!.push(item)
  })

  return groups
}

/**
 * Group items by bought status
 */
export function groupByBoughtStatus(items: Item[]): { toBuy: Item[]; bought: Item[] } {
  return {
    toBuy: items.filter(i => !i.isBought),
    bought: items.filter(i => i.isBought)
  }
}

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Baixa',
  2: 'Média',
  3: 'Alta'
}

export const PRIORITY_OPTIONS = [
  { value: 1, label: 'Baixa' },
  { value: 2, label: 'Média' },
  { value: 3, label: 'Alta' }
]

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_FILTERS: ItemFilters = {}

export const DEFAULT_SORT: ItemSort = {
  field: 'createdAt',
  order: 'desc'
}

export const SORT_OPTIONS: { field: ItemSortField; label: string }[] = [
  { field: 'createdAt', label: 'Data de Adição' },
  { field: 'name', label: 'Nome' },
  { field: 'price', label: 'Preço' },
  { field: 'priority', label: 'Prioridade' }
]
