"use server"

/**
 * Server Actions for Item Management
 *
 * All actions are protected and require authentication.
 * Items belong to the authenticated user only.
 */

import { revalidatePath } from "next/cache"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"

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
    // Get items
    const items = await sql`
      SELECT id, name, checked, notes, "userId", "createdAt", "updatedAt"
      FROM "Item"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `

    // Get options for all items
    const itemIds = items.map((i) => i.id)
    if (itemIds.length === 0) return []

    const options = await sql`
      SELECT id, store, url, "currentPrice", "desiredPrice", "minPrice", notes, "itemId", "createdAt", "updatedAt"
      FROM "Option"
      WHERE "itemId" = ANY(${itemIds})
      ORDER BY "createdAt" ASC
    `

    // Group options by itemId
    const optionsByItem = options.reduce((acc: Record<string, Option[]>, opt: any) => {
      if (!acc[opt.itemId]) acc[opt.itemId] = []
      acc[opt.itemId].push({
        ...opt,
        currentPrice: opt.currentPrice ? Number(opt.currentPrice) : null,
        desiredPrice: opt.desiredPrice ? Number(opt.desiredPrice) : null,
        minPrice: opt.minPrice ? Number(opt.minPrice) : null,
      })
      return acc
    }, {})

    return items.map((item) => ({
      ...item,
      options: optionsByItem[item.id] || [],
    })) as Item[]
  } catch (error) {
    console.error("Failed to fetch items:", error)
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
    const items = await sql`
      SELECT id, name, checked, notes, "userId", "createdAt", "updatedAt"
      FROM "Item"
      WHERE id = ${id} AND "userId" = ${userId}
      LIMIT 1
    `

    if (items.length === 0) return null

    const options = await sql`
      SELECT id, store, url, "currentPrice", "desiredPrice", "minPrice", notes, "itemId", "createdAt", "updatedAt"
      FROM "Option"
      WHERE "itemId" = ${id}
      ORDER BY "createdAt" ASC
    `

    return {
      ...items[0],
      options: options.map((opt: any) => ({
        ...opt,
        currentPrice: opt.currentPrice ? Number(opt.currentPrice) : null,
        desiredPrice: opt.desiredPrice ? Number(opt.desiredPrice) : null,
        minPrice: opt.minPrice ? Number(opt.minPrice) : null,
      })),
    } as Item
  } catch (error) {
    console.error("Failed to fetch item:", error)
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
      return { success: false, error: "Not authenticated" }
    }

    if (!name.trim()) {
      return { success: false, error: "Item name is required" }
    }

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "Item" (id, name, checked, "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${name.trim()}, false, ${userId}, ${now}, ${now})
    `

    revalidatePath("/dashboard")
    return {
      success: true,
      item: {
        id,
        name: name.trim(),
        checked: false,
        notes: null,
        userId,
        createdAt: now,
        updatedAt: now,
        options: [],
      },
    }
  } catch (error) {
    console.error("Failed to create item:", error)
    return { success: false, error: "Failed to create item" }
  }
}

/**
 * Update an item
 */
export async function updateItem(
  id: string,
  data: { name?: string; checked?: boolean; notes?: string | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify ownership
    const existingItems = await sql`
      SELECT id FROM "Item" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `

    if (existingItems.length === 0) {
      return { success: false, error: "Item not found" }
    }

    // Build update dynamically
    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push(`name = $${values.length + 1}`)
      values.push(data.name.trim())
    }
    if (data.checked !== undefined) {
      updates.push(`checked = $${values.length + 1}`)
      values.push(data.checked)
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${values.length + 1}`)
      values.push(data.notes)
    }
    updates.push(`"updatedAt" = NOW()`)

    if (updates.length > 1) {
      await sql`
        UPDATE "Item"
        SET name = COALESCE(${data.name?.trim()}, name),
            checked = COALESCE(${data.checked}, checked),
            notes = COALESCE(${data.notes}, notes),
            "updatedAt" = NOW()
        WHERE id = ${id}
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update item:", error)
    return { success: false, error: "Failed to update item" }
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
      return { success: false, error: "Not authenticated" }
    }

    const items = await sql`
      SELECT id, checked FROM "Item" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `

    if (items.length === 0) {
      return { success: false, error: "Item not found" }
    }

    await sql`
      UPDATE "Item"
      SET checked = ${!items[0].checked}, "updatedAt" = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle item:", error)
    return { success: false, error: "Failed to toggle item" }
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
      return { success: false, error: "Not authenticated" }
    }

    // Verify ownership
    const existingItems = await sql`
      SELECT id FROM "Item" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `

    if (existingItems.length === 0) {
      return { success: false, error: "Item not found" }
    }

    await sql`DELETE FROM "Item" WHERE id = ${id}`

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete item:", error)
    return { success: false, error: "Failed to delete item" }
  }
}
