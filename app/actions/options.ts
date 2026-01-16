'use server'

/**
 * Server Actions for Option Management
 * 
 * Options are purchase options for items (different stores, prices).
 * All actions verify item ownership through the authenticated user.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'

export interface OptionData {
  store: string
  url?: string | null
  currentPrice?: number | null
  desiredPrice?: number | null
  minPrice?: number | null
  notes?: string | null
}

/**
 * Create a new option for an item
 */
export async function createOption(
  itemId: string,
  data: OptionData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId }
    })
    
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    if (!data.store.trim()) {
      return { success: false, error: 'Store name is required' }
    }

    await prisma.option.create({
      data: {
        store: data.store.trim(),
        url: data.url || null,
        currentPrice: data.currentPrice || null,
        desiredPrice: data.desiredPrice || null,
        minPrice: data.minPrice || null,
        notes: data.notes || null,
        itemId,
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to create option:', error)
    return { success: false, error: 'Failed to create option' }
  }
}

/**
 * Update an option
 */
export async function updateOption(
  optionId: string,
  data: Partial<OptionData>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership through item
    const option = await prisma.option.findFirst({
      where: { id: optionId },
      include: { item: true }
    })
    
    if (!option || option.item.userId !== userId) {
      return { success: false, error: 'Option not found' }
    }

    await prisma.option.update({
      where: { id: optionId },
      data: {
        ...(data.store !== undefined && { store: data.store.trim() }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.currentPrice !== undefined && { currentPrice: data.currentPrice }),
        ...(data.desiredPrice !== undefined && { desiredPrice: data.desiredPrice }),
        ...(data.minPrice !== undefined && { minPrice: data.minPrice }),
        ...(data.notes !== undefined && { notes: data.notes }),
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update option:', error)
    return { success: false, error: 'Failed to update option' }
  }
}

/**
 * Delete an option
 */
export async function deleteOption(optionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership through item
    const option = await prisma.option.findFirst({
      where: { id: optionId },
      include: { item: true }
    })
    
    if (!option || option.item.userId !== userId) {
      return { success: false, error: 'Option not found' }
    }

    await prisma.option.delete({ where: { id: optionId } })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete option:', error)
    return { success: false, error: 'Failed to delete option' }
  }
}

/**
 * Get all options for an item
 */
export async function getOptions(itemId: string) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return []
    }

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId }
    })
    
    if (!item) {
      return []
    }

    const options = await prisma.option.findMany({
      where: { itemId },
      orderBy: { createdAt: 'asc' }
    })

    return options.map((opt: any) => ({
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
    }))
  } catch (error) {
    console.error('Failed to fetch options:', error)
    return []
  }
}
