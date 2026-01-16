'use server'

/**
 * Server Actions for Budget Management
 * 
 * Tracks global and category-level budgets with spending calculations.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'
import type { BudgetSettings, BudgetSummary, CategoryBudgetSummary } from '@/lib/types'

// Re-export types for convenience
export type { BudgetSettings, BudgetSummary, CategoryBudgetSummary }

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get or create budget settings for current user
 */
export async function getBudgetSettings(): Promise<BudgetSettings | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  try {
    const settings = await prisma.budgetSettings.findUnique({
      where: { userId }
    })

    if (!settings) return null

    return {
      id: settings.id,
      userId: settings.userId,
      totalBudget: Number(settings.totalBudget),
      currency: settings.currency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    }
  } catch (error) {
    console.error('Failed to fetch budget settings:', error)
    return null
  }
}

/**
 * Set global budget
 */
export async function setBudget(
  totalBudget: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    if (totalBudget < 0) {
      return { success: false, error: 'Budget must be positive' }
    }

    await prisma.budgetSettings.upsert({
      where: { userId },
      create: {
        userId,
        totalBudget,
        currency
      },
      update: {
        totalBudget,
        currency
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to set budget:', error)
    return { success: false, error: 'Failed to set budget' }
  }
}

/**
 * Set category budget
 */
export async function setCategoryBudget(
  categoryId: string,
  budget: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    // Verify category ownership
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    })
    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: { budget }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to set category budget:', error)
    return { success: false, error: 'Failed to set category budget' }
  }
}

/**
 * Get comprehensive budget summary with calculations
 */
export async function getBudgetSummary(): Promise<BudgetSummary | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  try {
    // Get budget settings
    const settings = await prisma.budgetSettings.findUnique({
      where: { userId }
    })

    // Get all categories with items
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            isBought: true,
            plannedPrice: true,
            boughtPrice: true,
            links: {
              where: { isSelected: true },
              select: { price: true },
              take: 1
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Get uncategorized items
    const uncategorizedItems = await prisma.item.findMany({
      where: { userId, categoryId: null },
      select: {
        id: true,
        isBought: true,
        plannedPrice: true,
        boughtPrice: true,
        links: {
          where: { isSelected: true },
          select: { price: true },
          take: 1
        }
      }
    })

    // Calculate category summaries
    const categoryBudgets: CategoryBudgetSummary[] = categories.map((cat: any) => {
      const items = cat.items as any[]
      const planned = items.reduce((sum: number, item: any) => {
        // Use selected link price, fall back to planned price
        const selectedLinkPrice = item.links[0]?.price
        const price = selectedLinkPrice 
          ? Number(selectedLinkPrice)
          : (item.plannedPrice ? Number(item.plannedPrice) : 0)
        return sum + price
      }, 0)
      
      const spent = items.reduce((sum: number, item: any) => {
        if (!item.isBought) return sum
        return sum + (item.boughtPrice ? Number(item.boughtPrice) : 0)
      }, 0)

      const budget = cat.budget ? Number(cat.budget) : null
      const remaining = budget ? budget - spent : planned - spent

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        budget,
        planned,
        spent,
        remaining,
        percentSpent: planned > 0 ? (spent / planned) * 100 : 0,
        itemCount: items.length,
        boughtCount: items.filter((i: any) => i.isBought).length
      }
    })

    // Add uncategorized if exists
    if (uncategorizedItems.length > 0) {
      const planned = (uncategorizedItems as any[]).reduce((sum: number, item: any) => {
        const selectedLinkPrice = item.links[0]?.price
        const price = selectedLinkPrice 
          ? Number(selectedLinkPrice)
          : (item.plannedPrice ? Number(item.plannedPrice) : 0)
        return sum + price
      }, 0)
      
      const spent = (uncategorizedItems as any[]).reduce((sum: number, item: any) => {
        if (!item.isBought) return sum
        return sum + (item.boughtPrice ? Number(item.boughtPrice) : 0)
      }, 0)

      categoryBudgets.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        icon: '📌',
        budget: null,
        planned,
        spent,
        remaining: planned - spent,
        percentSpent: planned > 0 ? (spent / planned) * 100 : 0,
        itemCount: uncategorizedItems.length,
        boughtCount: (uncategorizedItems as any[]).filter((i: any) => i.isBought).length
      })
    }

    // Calculate totals
    const totalPlanned = categoryBudgets.reduce((sum, cat) => sum + cat.planned, 0)
    const totalSpent = categoryBudgets.reduce((sum, cat) => sum + cat.spent, 0)
    const totalBudget = settings ? Number(settings.totalBudget) : totalPlanned
    const remaining = totalBudget - totalSpent

    return {
      totalBudget,
      totalPlanned,
      totalSpent,
      remaining,
      percentSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      percentPlanned: totalBudget > 0 ? (totalPlanned / totalBudget) * 100 : 0,
      currency: settings?.currency || 'USD',
      categories: categoryBudgets
    }
  } catch (error) {
    console.error('Failed to get budget summary:', error)
    return null
  }
}
