'use server'

/**
 * Server Actions for Category Management
 * 
 * Categories group items logically (Kitchen, Bedroom, etc.)
 * Each user has their own categories with optional budgets.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'
import { DEFAULT_CATEGORIES } from '@/lib/types'
import type { Category, CategoryWithItems } from '@/lib/types'

// Re-export types for convenience (type-only exports are allowed)
export type { Category, CategoryWithItems }

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all categories for current user
 */
export async function getCategories(): Promise<Category[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    return categories.map((c: any) => ({
      ...c,
      budget: c.budget ? Number(c.budget) : null,
    })) as Category[]
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

/**
 * Get categories with their items (for expanded view)
 */
export async function getCategoriesWithItems(): Promise<CategoryWithItems[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            isBought: true,
            plannedPrice: true,
            boughtPrice: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    return categories.map((c: any) => ({
      ...c,
      budget: c.budget ? Number(c.budget) : null,
      items: c.items.map((i: any) => ({
        ...i,
        plannedPrice: i.plannedPrice ? Number(i.plannedPrice) : null,
        boughtPrice: i.boughtPrice ? Number(i.boughtPrice) : null,
      }))
    })) as CategoryWithItems[]
  } catch (error) {
    console.error('Failed to fetch categories with items:', error)
    return []
  }
}

/**
 * Create default categories for a new user
 */
export async function seedDefaultCategories(): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Check if user already has categories
    const existingCount = await prisma.category.count({ where: { userId } })
    if (existingCount > 0) {
      return { success: true } // Already seeded
    }

    // Create default categories
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        userId,
        isDefault: true,
      }))
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to seed categories:', error)
    return { success: false, error: 'Failed to create default categories' }
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  icon?: string,
  budget?: number
): Promise<{ success: boolean; error?: string; category?: Category }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    if (!name.trim()) {
      return { success: false, error: 'Category name is required' }
    }

    // Get max order for new category
    const maxOrder = await prisma.category.aggregate({
      where: { userId },
      _max: { order: true }
    })

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || null,
        budget: budget || null,
        order: (maxOrder._max.order || 0) + 1,
        userId,
      }
    })

    revalidatePath('/dashboard')
    return { 
      success: true, 
      category: {
        ...category,
        budget: category.budget ? Number(category.budget) : null,
      } as Category
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Category name already exists' }
    }
    console.error('Failed to create category:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: { name?: string; icon?: string; budget?: number | null; order?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Category not found' }
    }

    await prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.order !== undefined && { order: data.order }),
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Category name already exists' }
    }
    console.error('Failed to update category:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Category not found' }
    }

    // Delete category (items will have categoryId set to null due to SetNull)
    await prisma.category.delete({ where: { id } })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Update order for each category
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.updateMany({
          where: { id, userId },
          data: { order: index + 1 }
        })
      )
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to reorder categories:', error)
    return { success: false, error: 'Failed to reorder categories' }
  }
}
