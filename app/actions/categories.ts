"use server"

/**
 * Server Actions for Category Management
 *
 * Categories group items logically (Kitchen, Bedroom, etc.)
 * Each user has their own categories with optional budgets.
 */

import { revalidatePath } from "next/cache"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"
import { DEFAULT_CATEGORIES } from "@/lib/types"
import type { Category, CategoryWithItems } from "@/lib/types"

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
    const categories = await sql`
      SELECT c.*, 
        (SELECT COUNT(*) FROM "Item" WHERE "categoryId" = c.id) as "_count_items"
      FROM "Category" c
      WHERE c."userId" = ${userId}
      ORDER BY c."order" ASC
    `

    return categories.map((c: any) => ({
      ...c,
      budget: c.budget ? Number(c.budget) : null,
      _count: { items: Number(c._count_items) },
    })) as Category[]
  } catch (error) {
    console.error("Failed to fetch categories:", error)
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
    const categories = await sql`
      SELECT c.*,
        (SELECT COUNT(*) FROM "Item" WHERE "categoryId" = c.id) as "_count_items"
      FROM "Category" c
      WHERE c."userId" = ${userId}
      ORDER BY c."order" ASC
    `

    const categoryIds = categories.map((c: any) => c.id)
    if (categoryIds.length === 0) return []

    const items = await sql`
      SELECT id, name, "isBought", "plannedPrice", "boughtPrice", "categoryId"
      FROM "Item"
      WHERE "categoryId" = ANY(${categoryIds})
      ORDER BY "createdAt" DESC
    `

    const itemsByCategory = items.reduce((acc: Record<string, any[]>, item: any) => {
      if (!acc[item.categoryId]) acc[item.categoryId] = []
      acc[item.categoryId].push({
        ...item,
        plannedPrice: item.plannedPrice ? Number(item.plannedPrice) : null,
        boughtPrice: item.boughtPrice ? Number(item.boughtPrice) : null,
      })
      return acc
    }, {})

    return categories.map((c: any) => ({
      ...c,
      budget: c.budget ? Number(c.budget) : null,
      items: itemsByCategory[c.id] || [],
      _count: { items: Number(c._count_items) },
    })) as CategoryWithItems[]
  } catch (error) {
    console.error("Failed to fetch categories with items:", error)
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
    if (!userId) return { success: false, error: "Not authenticated" }

    // Check if user already has categories
    const existing = await sql`
      SELECT COUNT(*) as count FROM "Category" WHERE "userId" = ${userId}
    `
    if (Number(existing[0].count) > 0) {
      return { success: true } // Already seeded
    }

    // Create default categories
    for (const cat of DEFAULT_CATEGORIES) {
      const id = generateId()
      const now = new Date()
      await sql`
        INSERT INTO "Category" (id, name, icon, "isDefault", "order", "userId", "createdAt", "updatedAt")
        VALUES (${id}, ${cat.name}, ${cat.icon || null}, true, ${cat.order}, ${userId}, ${now}, ${now})
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to seed categories:", error)
    return { success: false, error: "Failed to create default categories" }
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  icon?: string,
  budget?: number,
): Promise<{ success: boolean; error?: string; category?: Category }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    if (!name.trim()) {
      return { success: false, error: "Category name is required" }
    }

    // Get max order for new category
    const maxOrderResult = await sql`
      SELECT MAX("order") as max_order FROM "Category" WHERE "userId" = ${userId}
    `
    const maxOrder = maxOrderResult[0]?.max_order || 0

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "Category" (id, name, icon, budget, "order", "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${name.trim()}, ${icon || null}, ${budget || null}, ${maxOrder + 1}, ${userId}, ${now}, ${now})
    `

    revalidatePath("/dashboard")
    return {
      success: true,
      category: {
        id,
        name: name.trim(),
        icon: icon || null,
        isDefault: false,
        order: maxOrder + 1,
        budget: budget || null,
        userId,
        createdAt: now,
        updatedAt: now,
      } as Category,
    }
  } catch (error: any) {
    if (error.code === "23505") {
      return { success: false, error: "Category name already exists" }
    }
    console.error("Failed to create category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: { name?: string; icon?: string; budget?: number | null; order?: number },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "Category" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (existing.length === 0) {
      return { success: false, error: "Category not found" }
    }

    await sql`
      UPDATE "Category"
      SET 
        name = COALESCE(${data.name?.trim()}, name),
        icon = COALESCE(${data.icon}, icon),
        budget = COALESCE(${data.budget}, budget),
        "order" = COALESCE(${data.order}, "order"),
        "updatedAt" = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    if (error.code === "23505") {
      return { success: false, error: "Category name already exists" }
    }
    console.error("Failed to update category:", error)
    return { success: false, error: "Failed to update category" }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "Category" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (existing.length === 0) {
      return { success: false, error: "Category not found" }
    }

    // Delete category (items will have categoryId set to null due to SetNull)
    await sql`DELETE FROM "Category" WHERE id = ${id}`

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Update order for each category
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE "Category"
        SET "order" = ${i + 1}
        WHERE id = ${orderedIds[i]} AND "userId" = ${userId}
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to reorder categories:", error)
    return { success: false, error: "Failed to reorder categories" }
  }
}
