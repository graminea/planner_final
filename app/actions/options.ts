"use server"

/**
 * Server Actions for Option Management
 *
 * Options are purchase options for items (different stores, prices).
 * All actions verify item ownership through the authenticated user.
 */

import { revalidatePath } from "next/cache"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"

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
export async function createOption(itemId: string, data: OptionData): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify item ownership
    const items = await sql`
      SELECT id FROM "Item" WHERE id = ${itemId} AND "userId" = ${userId} LIMIT 1
    `

    if (items.length === 0) {
      return { success: false, error: "Item not found" }
    }

    if (!data.store.trim()) {
      return { success: false, error: "Store name is required" }
    }

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "Option" (id, store, url, "currentPrice", "desiredPrice", "minPrice", notes, "itemId", "createdAt", "updatedAt")
      VALUES (${id}, ${data.store.trim()}, ${data.url || null}, ${data.currentPrice || null}, ${data.desiredPrice || null}, ${data.minPrice || null}, ${data.notes || null}, ${itemId}, ${now}, ${now})
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to create option:", error)
    return { success: false, error: "Failed to create option" }
  }
}

/**
 * Update an option
 */
export async function updateOption(
  optionId: string,
  data: Partial<OptionData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify ownership through item
    const options = await sql`
      SELECT o.id, i."userId"
      FROM "Option" o
      JOIN "Item" i ON o."itemId" = i.id
      WHERE o.id = ${optionId}
      LIMIT 1
    `

    if (options.length === 0 || options[0].userId !== userId) {
      return { success: false, error: "Option not found" }
    }

    await sql`
      UPDATE "Option"
      SET 
        store = COALESCE(${data.store?.trim()}, store),
        url = COALESCE(${data.url}, url),
        "currentPrice" = COALESCE(${data.currentPrice}, "currentPrice"),
        "desiredPrice" = COALESCE(${data.desiredPrice}, "desiredPrice"),
        "minPrice" = COALESCE(${data.minPrice}, "minPrice"),
        notes = COALESCE(${data.notes}, notes),
        "updatedAt" = NOW()
      WHERE id = ${optionId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update option:", error)
    return { success: false, error: "Failed to update option" }
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
      return { success: false, error: "Not authenticated" }
    }

    // Verify ownership through item
    const options = await sql`
      SELECT o.id, i."userId"
      FROM "Option" o
      JOIN "Item" i ON o."itemId" = i.id
      WHERE o.id = ${optionId}
      LIMIT 1
    `

    if (options.length === 0 || options[0].userId !== userId) {
      return { success: false, error: "Option not found" }
    }

    await sql`DELETE FROM "Option" WHERE id = ${optionId}`

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete option:", error)
    return { success: false, error: "Failed to delete option" }
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
    const items = await sql`
      SELECT id FROM "Item" WHERE id = ${itemId} AND "userId" = ${userId} LIMIT 1
    `

    if (items.length === 0) {
      return []
    }

    const options = await sql`
      SELECT id, store, url, "currentPrice", "desiredPrice", "minPrice", notes, "itemId", "createdAt", "updatedAt"
      FROM "Option"
      WHERE "itemId" = ${itemId}
      ORDER BY "createdAt" ASC
    `

    return options.map((opt: any) => ({
      ...opt,
      currentPrice: opt.currentPrice ? Number(opt.currentPrice) : null,
      desiredPrice: opt.desiredPrice ? Number(opt.desiredPrice) : null,
      minPrice: opt.minPrice ? Number(opt.minPrice) : null,
    }))
  } catch (error) {
    console.error("Failed to fetch options:", error)
    return []
  }
}
