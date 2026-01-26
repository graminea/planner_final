'use server'

/**
 * Server Actions for Item Management (Updated for Home Planner)
 * 
 * Items are the core entity - things to purchase for the home.
 * Supports categories, multiple links, and budget tracking.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'
import type { Item, ItemLink, ItemFilters, ItemSort, ItemSortField, ItemSortOrder } from '@/lib/types'

// Re-export types for convenience
export type { Item, ItemLink, ItemFilters, ItemSort, ItemSortField, ItemSortOrder }

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform Prisma item to our Item type with computed fields
 */
function transformItem(item: any): Item {
  const links: ItemLink[] = item.links?.map((l: any) => ({
    id: l.id,
    url: l.url,
    store: l.store,
    price: Number(l.price),
    isSelected: l.isSelected,
    notes: l.notes
  })) || []

  const lowestPrice = links.length > 0
    ? Math.min(...links.map(l => l.price))
    : null

  const selectedLink = links.find(l => l.isSelected) || null

  return {
    id: item.id,
    name: item.name,
    notes: item.notes,
    priority: item.priority,
    plannedPrice: item.plannedPrice ? Number(item.plannedPrice) : null,
    boughtPrice: item.boughtPrice ? Number(item.boughtPrice) : null,
    isBought: item.isBought,
    boughtAt: item.boughtAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    userId: item.userId,
    categoryId: item.categoryId,
    category: item.category ? {
      id: item.category.id,
      name: item.category.name,
      icon: item.category.icon
    } : null,
    links,
    lowestPrice,
    selectedLink
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all items with optional filtering and sorting
 */
export async function getItems(
  filters?: ItemFilters,
  sort?: ItemSort
): Promise<Item[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  try {
    // Build where clause
    const where: any = { userId }
    
    if (filters?.isBought !== undefined) {
      where.isBought = filters.isBought
    }
    
    if (filters?.categoryId !== undefined) {
      where.categoryId = filters.categoryId
    }
    
    if (filters?.priority !== undefined) {
      where.priority = filters.priority
    }
    
    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive'
      }
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' }
    if (sort) {
      if (sort.field === 'price') {
        orderBy = { plannedPrice: sort.order }
      } else if (sort.field === 'priority') {
        orderBy = { priority: sort.order }
      } else if (sort.field === 'name') {
        orderBy = { name: sort.order }
      } else {
        orderBy = { [sort.field]: sort.order }
      }
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, icon: true }
        },
        links: {
          orderBy: { price: 'asc' }
        }
      },
      orderBy
    })

    return items.map(transformItem)
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return []
  }
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<Item | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  try {
    const item = await prisma.item.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true, icon: true }
        },
        links: {
          orderBy: { price: 'asc' }
        }
      }
    })

    if (!item) return null
    return transformItem(item)
  } catch (error) {
    console.error('Failed to fetch item:', error)
    return null
  }
}

/**
 * Create a new item
 */
export async function createItem(data: {
  name: string
  categoryId?: string | null
  priority?: number
  plannedPrice?: number | null
  notes?: string | null
}): Promise<{ success: boolean; error?: string; item?: Item }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    if (!data.name.trim()) {
      return { success: false, error: 'Item name is required' }
    }

    // Debug: log planned price
    console.log('[createItem] Received data:', { 
      name: data.name, 
      plannedPrice: data.plannedPrice, 
      typeofPlannedPrice: typeof data.plannedPrice 
    })

    const item = await prisma.item.create({
      data: {
        name: data.name.trim(),
        userId,
        categoryId: data.categoryId || null,
        priority: data.priority ?? 2,
        plannedPrice: data.plannedPrice ?? null,
        notes: data.notes || null
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true }
        },
        links: true
      }
    })

    revalidatePath('/dashboard')
    return { success: true, item: transformItem(item) }
  } catch (error) {
    console.error('Failed to create item:', error)
    return { success: false, error: 'Failed to create item' }
  }
}

/**
 * Update an item
 */
export async function updateItem(
  id: string,
  data: {
    name?: string
    categoryId?: string | null
    priority?: number
    plannedPrice?: number | null
    boughtPrice?: number | null
    notes?: string | null
    isBought?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify ownership
    const existing = await prisma.item.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Item not found' }
    }

    // If marking as bought, set boughtAt
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.plannedPrice !== undefined) updateData.plannedPrice = data.plannedPrice
    if (data.boughtPrice !== undefined) updateData.boughtPrice = data.boughtPrice
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.isBought !== undefined) {
      updateData.isBought = data.isBought
      updateData.boughtAt = data.isBought ? new Date() : null
    }

    await prisma.item.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update item:', error)
    return { success: false, error: 'Failed to update item' }
  }
}

/**
 * Toggle item bought status
 * @param id - The item ID
 * @param boughtPrice - Optional: the actual price paid. If not provided when marking as bought, uses plannedPrice
 */
export async function toggleItemBought(
  id: string, 
  boughtPrice?: number
): Promise<{ success: boolean; error?: string; item?: { isBought: boolean; boughtPrice: number | null } }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const item = await prisma.item.findFirst({
      where: { id, userId }
    })
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    const newIsBought = !item.isBought
    
    // When marking as bought, use provided price, or fall back to plannedPrice
    const actualBoughtPrice = newIsBought 
      ? (boughtPrice !== undefined ? boughtPrice : (item.plannedPrice ? Number(item.plannedPrice) : null))
      : null
    
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        isBought: newIsBought,
        boughtAt: newIsBought ? new Date() : null,
        boughtPrice: actualBoughtPrice
      }
    })

    revalidatePath('/dashboard')
    return { 
      success: true, 
      item: { 
        isBought: updatedItem.isBought, 
        boughtPrice: updatedItem.boughtPrice ? Number(updatedItem.boughtPrice) : null 
      } 
    }
  } catch (error) {
    console.error('Failed to toggle item:', error)
    return { success: false, error: 'Failed to toggle item' }
  }
}

/**
 * Update the bought price of an item (for adjusting after marking as bought)
 */
export async function updateItemBoughtPrice(
  id: string, 
  boughtPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const item = await prisma.item.findFirst({
      where: { id, userId }
    })
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    if (!item.isBought) {
      return { success: false, error: 'Item must be marked as bought first' }
    }

    await prisma.item.update({
      where: { id },
      data: { boughtPrice }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update bought price:', error)
    return { success: false, error: 'Failed to update bought price' }
  }
}

/**
 * Delete an item
 */
export async function deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const existing = await prisma.item.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Item not found' }
    }

    await prisma.item.delete({ where: { id } })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete item:', error)
    return { success: false, error: 'Failed to delete item' }
  }
}

// ============================================================================
// ITEM LINK ACTIONS
// ============================================================================

/**
 * Add a link to an item
 */
export async function addItemLink(
  itemId: string,
  data: {
    url: string
    store: string
    price: number
    notes?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId }
    })
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    // Check if this is the first link (make it selected by default)
    const linkCount = await prisma.itemLink.count({ where: { itemId } })
    
    await prisma.itemLink.create({
      data: {
        itemId,
        url: data.url,
        store: data.store.trim(),
        price: data.price,
        notes: data.notes || null,
        isSelected: linkCount === 0 // First link is selected by default
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to add link:', error)
    return { success: false, error: 'Failed to add link' }
  }
}

/**
 * Update a link
 */
export async function updateItemLink(
  linkId: string,
  data: {
    url?: string
    store?: string
    price?: number
    notes?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify ownership through item
    const link = await prisma.itemLink.findFirst({
      where: { id: linkId },
      include: { item: true }
    })
    if (!link || link.item.userId !== userId) {
      return { success: false, error: 'Link not found' }
    }

    await prisma.itemLink.update({
      where: { id: linkId },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.store !== undefined && { store: data.store.trim() }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.notes !== undefined && { notes: data.notes }),
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update link:', error)
    return { success: false, error: 'Failed to update link' }
  }
}

/**
 * Delete a link
 */
export async function deleteItemLink(linkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const link = await prisma.itemLink.findFirst({
      where: { id: linkId },
      include: { item: true }
    })
    if (!link || link.item.userId !== userId) {
      return { success: false, error: 'Link not found' }
    }

    await prisma.itemLink.delete({ where: { id: linkId } })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete link:', error)
    return { success: false, error: 'Failed to delete link' }
  }
}

/**
 * Select a link (mark as preferred option)
 */
export async function selectItemLink(
  itemId: string,
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId }
    })
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    // Deselect all links for this item, then select the chosen one
    await prisma.$transaction([
      prisma.itemLink.updateMany({
        where: { itemId },
        data: { isSelected: false }
      }),
      prisma.itemLink.update({
        where: { id: linkId },
        data: { isSelected: true }
      })
    ])

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to select link:', error)
    return { success: false, error: 'Failed to select link' }
  }
}

// Keep old function name for backwards compatibility
export { toggleItemBought as toggleItemChecked }
