"use server"

/**
 * Server Actions for Budget Management
 *
 * Tracks global and category-level budgets with spending calculations.
 */

import { revalidatePath } from "next/cache"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"
import type { BudgetSettings, BudgetSummary, CategoryBudgetSummary } from "@/lib/types"

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
    const settings = await sql`
      SELECT id, "userId", "totalBudget", currency, "createdAt", "updatedAt"
      FROM "BudgetSettings"
      WHERE "userId" = ${userId}
      LIMIT 1
    `

    if (settings.length === 0) return null

    return {
      id: settings[0].id,
      userId: settings[0].userId,
      totalBudget: Number(settings[0].totalBudget),
      currency: settings[0].currency,
      createdAt: settings[0].createdAt,
      updatedAt: settings[0].updatedAt,
    }
  } catch (error) {
    console.error("Failed to fetch budget settings:", error)
    return null
  }
}

/**
 * Set global budget
 */
export async function setBudget(totalBudget: number, currency = "USD"): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    if (totalBudget < 0) {
      return { success: false, error: "Budget must be positive" }
    }

    // Check if settings exist
    const existing = await sql`
      SELECT id FROM "BudgetSettings" WHERE "userId" = ${userId} LIMIT 1
    `

    if (existing.length > 0) {
      await sql`
        UPDATE "BudgetSettings"
        SET "totalBudget" = ${totalBudget}, currency = ${currency}, "updatedAt" = NOW()
        WHERE "userId" = ${userId}
      `
    } else {
      const id = generateId()
      await sql`
        INSERT INTO "BudgetSettings" (id, "userId", "totalBudget", currency, "createdAt", "updatedAt")
        VALUES (${id}, ${userId}, ${totalBudget}, ${currency}, NOW(), NOW())
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to set budget:", error)
    return { success: false, error: "Failed to set budget" }
  }
}

/**
 * Set category budget
 */
export async function setCategoryBudget(
  categoryId: string,
  budget: number | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify category ownership
    const category = await sql`
      SELECT id FROM "Category" WHERE id = ${categoryId} AND "userId" = ${userId} LIMIT 1
    `
    if (category.length === 0) {
      return { success: false, error: "Category not found" }
    }

    await sql`
      UPDATE "Category"
      SET budget = ${budget}, "updatedAt" = NOW()
      WHERE id = ${categoryId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to set category budget:", error)
    return { success: false, error: "Failed to set category budget" }
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
    const settingsResult = await sql`
      SELECT id, "totalBudget", currency FROM "BudgetSettings" WHERE "userId" = ${userId} LIMIT 1
    `
    const settings = settingsResult[0] || null

    // Get all categories
    const categories = await sql`
      SELECT id, name, icon, budget, "order"
      FROM "Category"
      WHERE "userId" = ${userId}
      ORDER BY "order" ASC
    `

    // Get all items with their selected links
    const items = await sql`
      SELECT i.id, i."isBought", i."plannedPrice", i."boughtPrice", i."categoryId",
        (SELECT price FROM "ItemLink" WHERE "itemId" = i.id AND "isSelected" = true LIMIT 1) as "selectedLinkPrice"
      FROM "Item" i
      WHERE i."userId" = ${userId}
    `

    // Group items by category
    const itemsByCategory = items.reduce((acc: Record<string, any[]>, item: any) => {
      const catId = item.categoryId || "uncategorized"
      if (!acc[catId]) acc[catId] = []
      acc[catId].push(item)
      return acc
    }, {})

    // Calculate category summaries
    const categoryBudgets: CategoryBudgetSummary[] = categories.map((cat: any) => {
      const catItems = itemsByCategory[cat.id] || []
      const planned = catItems.reduce((sum: number, item: any) => {
        const price = item.selectedLinkPrice
          ? Number(item.selectedLinkPrice)
          : item.plannedPrice
            ? Number(item.plannedPrice)
            : 0
        return sum + price
      }, 0)

      const spent = catItems.reduce((sum: number, item: any) => {
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
        itemCount: catItems.length,
        boughtCount: catItems.filter((i: any) => i.isBought).length,
      }
    })

    // Add uncategorized if exists
    const uncategorizedItems = itemsByCategory["uncategorized"] || []
    if (uncategorizedItems.length > 0) {
      const planned = uncategorizedItems.reduce((sum: number, item: any) => {
        const price = item.selectedLinkPrice
          ? Number(item.selectedLinkPrice)
          : item.plannedPrice
            ? Number(item.plannedPrice)
            : 0
        return sum + price
      }, 0)

      const spent = uncategorizedItems.reduce((sum: number, item: any) => {
        if (!item.isBought) return sum
        return sum + (item.boughtPrice ? Number(item.boughtPrice) : 0)
      }, 0)

      categoryBudgets.push({
        id: "uncategorized",
        name: "Uncategorized",
        icon: "📌",
        budget: null,
        planned,
        spent,
        remaining: planned - spent,
        percentSpent: planned > 0 ? (spent / planned) * 100 : 0,
        itemCount: uncategorizedItems.length,
        boughtCount: uncategorizedItems.filter((i: any) => i.isBought).length,
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
      currency: settings?.currency || "USD",
      categories: categoryBudgets,
    }
  } catch (error) {
    console.error("Failed to get budget summary:", error)
    return null
  }
}
