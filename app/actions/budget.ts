'use server'

/**
 * Server Actions for Budget Management
 * 
 * MENTAL MODEL:
 * - One single source of truth: the overall budget
 * - Categories have "allocations" (desired amounts), not independent limits
 * - Sum of all category allocations must never exceed overall budget
 * - Unallocated = Overall Budget - Sum(Category Allocations)
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'
import { setBudgetSchema, setCategoryAllocationSchema } from '@/lib/validation'
import type { BudgetSettings, BudgetSummary, CategoryBudgetSummary } from '@/lib/types'

// ============================================================================
// HELPER: Get total allocated across all categories
// ============================================================================

async function getTotalAllocated(userId: string, excludeCategoryId?: string): Promise<number> {
  const categories = await prisma.category.findMany({
    where: { 
      userId,
      ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {})
    },
    select: { budget: true }
  })
  
  return categories.reduce((sum, cat) => sum + (cat.budget ? Number(cat.budget) : 0), 0)
}

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
 * Get the remaining available budget (not yet allocated to categories)
 */
export async function getAvailableBudget(): Promise<{ 
  available: number
  totalBudget: number
  totalAllocated: number
} | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  try {
    const settings = await prisma.budgetSettings.findUnique({
      where: { userId }
    })
    
    if (!settings) {
      return { available: 0, totalBudget: 0, totalAllocated: 0 }
    }

    const totalBudget = Number(settings.totalBudget)
    const totalAllocated = await getTotalAllocated(userId)
    const available = totalBudget - totalAllocated

    return { available, totalBudget, totalAllocated }
  } catch (error) {
    console.error('Failed to get available budget:', error)
    return null
  }
}

/**
 * Set the overall budget
 * 
 * CONSTRAINT: If new budget < current allocations, returns error with details
 */
export async function setBudget(
  totalBudget: number,
  currency: string = 'BRL'
): Promise<{ success: boolean; error?: string; currentAllocations?: number }> {
  try {
    const parsed = setBudgetSchema.safeParse({ totalBudget, currency })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }

    const user = await requireAuth()

    // Check if new budget would be less than current allocations
    const totalAllocated = await getTotalAllocated(user.id)
    
    if (parsed.data.totalBudget < totalAllocated) {
      return { 
        success: false, 
        error: `O novo orçamento (R$${parsed.data.totalBudget.toFixed(0)}) é menor que o total já alocado (R$${totalAllocated.toFixed(0)}). Reduza as alocações das categorias primeiro.`,
        currentAllocations: totalAllocated
      }
    }

    await prisma.budgetSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, totalBudget: parsed.data.totalBudget, currency: parsed.data.currency },
      update: { totalBudget: parsed.data.totalBudget, currency: parsed.data.currency }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to set budget:', error)
    return { success: false, error: 'Falha ao definir orçamento' }
  }
}

/**
 * Set category allocation
 * 
 * CONSTRAINTS:
 * - Cannot allocate if no overall budget is set
 * - Cannot allocate more than available budget
 * - Returns real-time feedback about available budget
 */
export async function setCategoryAllocation(
  categoryId: string,
  allocation: number | null
): Promise<{ 
  success: boolean
  error?: string
  available?: number
  totalBudget?: number
}> {
  try {
    const parsed = setCategoryAllocationSchema.safeParse({ categoryId, allocation })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }

    const user = await requireAuth()

    // Get overall budget
    const settings = await prisma.budgetSettings.findUnique({
      where: { userId: user.id }
    })

    if (!settings) {
      return { 
        success: false, 
        error: 'Defina um orçamento geral antes de alocar valores para categorias.' 
      }
    }

    const totalBudget = Number(settings.totalBudget)

    // Verify category ownership
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, userId: user.id }
    })
    if (!category) {
      return { success: false, error: 'Categoria não encontrada' }
    }

    // Calculate available (excluding current category's existing allocation)
    const otherAllocations = await getTotalAllocated(user.id, parsed.data.categoryId)
    const availableForThisCategory = totalBudget - otherAllocations

    // Validate allocation doesn't exceed available
    const newAllocation = parsed.data.allocation ?? 0

    if (newAllocation > availableForThisCategory) {
      return { 
        success: false, 
        error: `Não é possível alocar R$${newAllocation.toFixed(0)}. Disponível: R$${availableForThisCategory.toFixed(0)}`,
        available: availableForThisCategory,
        totalBudget
      }
    }

    // Update category allocation
    await prisma.category.update({
      where: { id: parsed.data.categoryId },
      data: { budget: parsed.data.allocation }
    })

    revalidatePath('/dashboard')
    return { 
      success: true,
      available: availableForThisCategory - newAllocation,
      totalBudget
    }
  } catch (error) {
    console.error('Failed to set category allocation:', error)
    return { success: false, error: 'Falha ao definir alocação' }
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
        name: 'Sem Categoria',
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
    const totalAllocated = categoryBudgets.reduce((sum, cat) => sum + (cat.budget ?? 0), 0)
    const totalBudget = settings ? Number(settings.totalBudget) : 0
    const remaining = totalBudget - totalSpent
    const unallocated = totalBudget - totalAllocated

    return {
      totalBudget,
      totalPlanned,
      totalSpent,
      totalAllocated,
      unallocated,
      remaining,
      percentSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      percentPlanned: totalBudget > 0 ? (totalPlanned / totalBudget) * 100 : 0,
      percentAllocated: totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0,
      currency: settings?.currency || 'BRL',
      categories: categoryBudgets,
      hasBudget: !!settings
    }
  } catch (error) {
    console.error('Failed to get budget summary:', error)
    return null
  }
}
