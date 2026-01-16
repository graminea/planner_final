'use server'

/**
 * Server Actions for Tag Management
 * 
 * Tags are flexible labels for items (urgent, sale, gift, etc.)
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'
import type { Tag } from '@/lib/types'

// Re-export type for convenience
export type { Tag }

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all tags for current user
 */
export async function getTags(): Promise<Tag[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  try {
    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return tags as Tag[]
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return []
  }
}

/**
 * Create a new tag
 */
export async function createTag(
  name: string,
  color?: string
): Promise<{ success: boolean; error?: string; tag?: Tag }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    if (!name.trim()) {
      return { success: false, error: 'Tag name is required' }
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim().toLowerCase(),
        color: color || null,
        userId,
      }
    })

    revalidatePath('/dashboard')
    return { success: true, tag: tag as Tag }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Tag already exists' }
    }
    console.error('Failed to create tag:', error)
    return { success: false, error: 'Failed to create tag' }
  }
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  data: { name?: string; color?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const existing = await prisma.tag.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Tag not found' }
    }

    await prisma.tag.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim().toLowerCase() }),
        ...(data.color !== undefined && { color: data.color }),
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Tag name already exists' }
    }
    console.error('Failed to update tag:', error)
    return { success: false, error: 'Failed to update tag' }
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const existing = await prisma.tag.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Tag not found' }
    }

    await prisma.tag.delete({ where: { id } })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete tag:', error)
    return { success: false, error: 'Failed to delete tag' }
  }
}

/**
 * Add tag to item
 */
export async function addTagToItem(
  itemId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify item and tag ownership
    const [item, tag] = await Promise.all([
      prisma.item.findFirst({ where: { id: itemId, userId } }),
      prisma.tag.findFirst({ where: { id: tagId, userId } })
    ])

    if (!item || !tag) {
      return { success: false, error: 'Item or tag not found' }
    }

    await prisma.itemTag.create({
      data: { itemId, tagId }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: true } // Already exists, treat as success
    }
    console.error('Failed to add tag to item:', error)
    return { success: false, error: 'Failed to add tag' }
  }
}

/**
 * Remove tag from item
 */
export async function removeTagFromItem(
  itemId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    await prisma.itemTag.deleteMany({
      where: { itemId, tagId }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to remove tag from item:', error)
    return { success: false, error: 'Failed to remove tag' }
  }
}
