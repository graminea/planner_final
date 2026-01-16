'use server'

/**
 * Server Actions for Item Management (Legacy Tracker)
 * 
 * All actions are protected and require authentication.
 * Items belong to the authenticated user only.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'

export interface Item {
  id: string
  name: string
  checked: boolean
  notes: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  options: Option[]
}

export interface Option {
  id: string
  store: string
  url: string | null
  currentPrice: number | null
  desiredPrice: number | null
  minPrice: number | null
  notes: string | null
  itemId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all items for the authenticated user
 */
export async function getItems(): Promise<Item[]> {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    return []
  }

  try {
    const items = await prisma.item.findMany({
      where: { userId },
      include: {
        options: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return items.map((item: any) => ({
      id: item.id,
      name: item.name,
      checked: item.isBought || false,
      notes: item.notes,
      userId: item.userId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      options: item.options?.map((opt: any) => ({
        id: opt.id,
        store: opt.store,
        url: opt.url,
        currentPrice: opt.currentPrice ? Number(opt.currentPrice) : null,
        desiredPrice: opt.desiredPrice ? Number(opt.desiredPrice) : null,
        minPrice: opt.minPrice ? Number(opt.minPrice) : null,
        notes: opt.notes,
        itemId: opt.itemId,
        createdAt: opt.createdAt,
        updatedAt: opt.updatedAt,
      })) || []
    })) as Item[]
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
  
  if (!userId) {
    return null
  }

  try {
    const item = await prisma.item.findFirst({
      where: { id, userId },
      include: {
        options: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!item) return null

    return {
      id: item.id,
      name: item.name,
      checked: item.isBought || false,
      notes: item.notes,
      userId: item.userId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      options: item.options?.map((opt: any) => ({
        id: opt.id,
        store: opt.store,
        url: opt.url,
        currentPrice: opt.currentPrice ? Number(opt.currentPrice) : null,
        desiredPrice: opt.desiredPrice ? Number(opt.desiredPrice) : null,
        minPrice: opt.minPrice ? Number(opt.minPrice) : null,
        notes: opt.notes,
        itemId: opt.itemId,
        createdAt: opt.createdAt,
        updatedAt: opt.updatedAt,
      })) || []
    } as Item
  } catch (error) {
    console.error('Failed to fetch item:', error)
    return null
  }
}

/**
 * Create a new item
 */
export async function createItem(name: string): Promise<{ success: boolean; error?: string; item?: Item }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!name.trim()) {
      return { success: false, error: 'Item name is required' }
    }

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        userId,
        isBought: false,
      },
      include: {
        options: true
      }
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        checked: item.isBought || false,
        notes: item.notes,
        userId: item.userId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        options: [],
      }
    }
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
  data: { name?: string; checked?: boolean; notes?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership
    const existing = await prisma.item.findFirst({
      where: { id, userId }
    })
    
    if (!existing) {
      return { success: false, error: 'Item not found' }
    }

    await prisma.item.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.checked !== undefined && { isBought: data.checked }),
        ...(data.notes !== undefined && { notes: data.notes }),
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update item:', error)
    return { success: false, error: 'Failed to update item' }
  }
}

/**
 * Toggle item checked status
 */
export async function toggleItemChecked(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const item = await prisma.item.findFirst({
      where: { id, userId }
    })
    
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    await prisma.item.update({
      where: { id },
      data: {
        isBought: !item.isBought,
        boughtAt: !item.isBought ? new Date() : null
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to toggle item:', error)
    return { success: false, error: 'Failed to toggle item' }
  }
}

/**
 * Delete an item
 */
export async function deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

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
