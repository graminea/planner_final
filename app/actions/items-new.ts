"use server"

/**
 * Server Actions for Item Management (Updated for Home Planner)
 *
 * Items are the core entity - things to purchase for the home.
 * Supports categories, tags, multiple links, and budget tracking.
 */

import { revalidatePath } from "next/cache"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"
import type { Item, ItemLink, ItemFilters, ItemSort, ItemSortField, ItemSortOrder } from "@/lib/types"

// Re-export types for convenience
export type { Item, ItemLink, ItemFilters, ItemSort, ItemSortField, ItemSortOrder }

interface ItemTag {
  id: string
  name: string
  color: string | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform raw item row to our Item type with computed fields
 */
function transformItem(item: any, links: any[], tags: any[], category: any): Item {
  const itemLinks: ItemLink[] = links.map((l: any) => ({
    id: l.id,
    url: l.url,
    store: l.store,
    price: Number(l.price),
    isSelected: l.isSelected,
    notes: l.notes,
  }))

  const lowestPrice = itemLinks.length > 0 ? Math.min(...itemLinks.map((l) => l.price)) : null

  const selectedLink = itemLinks.find((l) => l.isSelected) || null

  return {
    id: item.id,
    name: item.name,
    notes: item.notes,
    priority: item.priority,
    plannedPrice: item.plannedPrice ? Number(item.plannedPrice) : null,
    boughtPrice: item.boughtPrice ? Number(item.boughtPrice) : null,
    isBought: item.isBought,
    boughtAt: item.boughtAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    userId: item.userId,
    categoryId: item.categoryId,
    category: category
      ? {
          id: category.id,
          name: category.name,
          icon: category.icon,
        }
      : null,
    tags: tags.map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color,
    })),
    links: itemLinks,
    lowestPrice,
    selectedLink,
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all items with optional filtering and sorting
 */
export async function getItems(filters?: ItemFilters, sort?: ItemSort): Promise<Item[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  try {
    // Build WHERE conditions
    const whereConditions = [`"userId" = '${userId}'`]

    if (filters?.isBought !== undefined) {
      whereConditions.push(`"isBought" = ${filters.isBought}`)
    }
    if (filters?.categoryId !== undefined) {
      whereConditions.push(filters.categoryId ? `"categoryId" = '${filters.categoryId}'` : `"categoryId" IS NULL`)
    }
    if (filters?.priority !== undefined) {
      whereConditions.push(`priority = ${filters.priority}`)
    }
    if (filters?.search) {
      whereConditions.push(`name ILIKE '%${filters.search}%'`)
    }

    // Build ORDER BY
    let orderBy = '"createdAt" DESC'
    if (sort) {
      const field =
        sort.field === "price"
          ? '"plannedPrice"'
          : sort.field === "priority"
            ? "priority"
            : sort.field === "name"
              ? "name"
              : `"${sort.field}"`
      orderBy = `${field} ${sort.order.toUpperCase()}`
    }

    const items = await sql`
      SELECT i.*, 
        c.id as "cat_id", c.name as "cat_name", c.icon as "cat_icon"
      FROM "Item" i
      LEFT JOIN "Category" c ON i."categoryId" = c.id
      WHERE i."userId" = ${userId}
        ${filters?.isBought !== undefined ? sql`AND i."isBought" = ${filters.isBought}` : sql``}
        ${filters?.categoryId ? sql`AND i."categoryId" = ${filters.categoryId}` : sql``}
        ${filters?.priority !== undefined ? sql`AND i.priority = ${filters.priority}` : sql``}
        ${filters?.search ? sql`AND i.name ILIKE ${"%" + filters.search + "%"}` : sql``}
      ORDER BY ${sort?.field === "price" ? sql`i."plannedPrice"` : sort?.field === "name" ? sql`i.name` : sql`i."createdAt"`} ${sort?.order === "asc" ? sql`ASC` : sql`DESC`}
    `

    if (items.length === 0) return []

    const itemIds = items.map((i) => i.id)

    // Get all links for these items
    const links = await sql`
      SELECT * FROM "ItemLink" WHERE "itemId" = ANY(${itemIds}) ORDER BY price ASC
    `

    // Get all tags for these items
    const itemTags = await sql`
      SELECT it."itemId", t.id, t.name, t.color
      FROM "ItemTag" it
      JOIN "Tag" t ON it."tagId" = t.id
      WHERE it."itemId" = ANY(${itemIds})
    `

    // Group by itemId
    const linksByItem = links.reduce((acc: Record<string, any[]>, l: any) => {
      if (!acc[l.itemId]) acc[l.itemId] = []
      acc[l.itemId].push(l)
      return acc
    }, {})

    const tagsByItem = itemTags.reduce((acc: Record<string, any[]>, t: any) => {
      if (!acc[t.itemId]) acc[t.itemId] = []
      acc[t.itemId].push(t)
      return acc
    }, {})

    return items.map((item) =>
      transformItem(
        item,
        linksByItem[item.id] || [],
        tagsByItem[item.id] || [],
        item.cat_id ? { id: item.cat_id, name: item.cat_name, icon: item.cat_icon } : null,
      ),
    )
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
  if (!userId) return null

  try {
    const items = await sql`
      SELECT i.*, 
        c.id as "cat_id", c.name as "cat_name", c.icon as "cat_icon"
      FROM "Item" i
      LEFT JOIN "Category" c ON i."categoryId" = c.id
      WHERE i.id = ${id} AND i."userId" = ${userId}
      LIMIT 1
    `

    if (items.length === 0) return null

    const item = items[0]

    const links = await sql`
      SELECT * FROM "ItemLink" WHERE "itemId" = ${id} ORDER BY price ASC
    `

    const tags = await sql`
      SELECT t.id, t.name, t.color
      FROM "ItemTag" it
      JOIN "Tag" t ON it."tagId" = t.id
      WHERE it."itemId" = ${id}
    `

    return transformItem(
      item,
      links,
      tags,
      item.cat_id ? { id: item.cat_id, name: item.cat_name, icon: item.cat_icon } : null,
    )
  } catch (error) {
    console.error("Failed to fetch item:", error)
    return null
  }
}

/**
 * Create a new item
 */
export async function createItem(data: {
  name: string
  categoryId?: string | null
  priority?: number
  plannedPrice?: number | null
  notes?: string | null
  tagIds?: string[]
}): Promise<{ success: boolean; error?: string; item?: Item }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    if (!data.name.trim()) {
      return { success: false, error: "Item name is required" }
    }

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "Item" (id, name, "userId", "categoryId", priority, "plannedPrice", notes, "isBought", "createdAt", "updatedAt")
      VALUES (${id}, ${data.name.trim()}, ${userId}, ${data.categoryId || null}, ${data.priority || 2}, ${data.plannedPrice || null}, ${data.notes || null}, false, ${now}, ${now})
    `

    // Create tag connections if provided
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        const tagItemId = generateId()
        await sql`
          INSERT INTO "ItemTag" (id, "itemId", "tagId", "createdAt")
          VALUES (${tagItemId}, ${id}, ${tagId}, ${now})
        `
      }
    }

    revalidatePath("/dashboard")

    // Fetch the created item
    const createdItem = await getItem(id)
    return { success: true, item: createdItem || undefined }
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
  data: {
    name?: string
    categoryId?: string | null
    priority?: number
    plannedPrice?: number | null
    boughtPrice?: number | null
    notes?: string | null
    isBought?: boolean
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "Item" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (existing.length === 0) {
      return { success: false, error: "Item not found" }
    }

    // If marking as bought, set boughtAt
    const boughtAt = data.isBought === true ? new Date() : data.isBought === false ? null : undefined

    await sql`
      UPDATE "Item"
      SET 
        name = COALESCE(${data.name?.trim()}, name),
        "categoryId" = COALESCE(${data.categoryId}, "categoryId"),
        priority = COALESCE(${data.priority}, priority),
        "plannedPrice" = COALESCE(${data.plannedPrice}, "plannedPrice"),
        "boughtPrice" = COALESCE(${data.boughtPrice}, "boughtPrice"),
        notes = COALESCE(${data.notes}, notes),
        "isBought" = COALESCE(${data.isBought}, "isBought"),
        "boughtAt" = COALESCE(${boughtAt}, "boughtAt"),
        "updatedAt" = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update item:", error)
    return { success: false, error: "Failed to update item" }
  }
}

/**
 * Toggle item bought status
 */
export async function toggleItemBought(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    const items = await sql`
      SELECT id, "isBought" FROM "Item" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (items.length === 0) {
      return { success: false, error: "Item not found" }
    }

    const newIsBought = !items[0].isBought

    await sql`
      UPDATE "Item"
      SET "isBought" = ${newIsBought}, "boughtAt" = ${newIsBought ? new Date() : null}, "updatedAt" = NOW()
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
    if (!userId) return { success: false, error: "Not authenticated" }

    const existing = await sql`
      SELECT id FROM "Item" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (existing.length === 0) {
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

// ============================================================================
// ITEM LINK ACTIONS
// ============================================================================

/**
 * Add a link to an item
 */
export async function addItemLink(
  itemId: string,
  data: {
    url: string
    store: string
    price: number
    notes?: string | null
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify item ownership
    const items = await sql`
      SELECT id FROM "Item" WHERE id = ${itemId} AND "userId" = ${userId} LIMIT 1
    `
    if (items.length === 0) {
      return { success: false, error: "Item not found" }
    }

    // Check if this is the first link (make it selected by default)
    const linkCountResult = await sql`
      SELECT COUNT(*) as count FROM "ItemLink" WHERE "itemId" = ${itemId}
    `
    const isFirst = Number(linkCountResult[0].count) === 0

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "ItemLink" (id, "itemId", url, store, price, notes, "isSelected", "createdAt", "updatedAt")
      VALUES (${id}, ${itemId}, ${data.url}, ${data.store.trim()}, ${data.price}, ${data.notes || null}, ${isFirst}, ${now}, ${now})
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to add link:", error)
    return { success: false, error: "Failed to add link" }
  }
}

/**
 * Update a link
 */
export async function updateItemLink(
  linkId: string,
  data: {
    url?: string
    store?: string
    price?: number
    notes?: string | null
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify ownership through item
    const links = await sql`
      SELECT l.id, i."userId"
      FROM "ItemLink" l
      JOIN "Item" i ON l."itemId" = i.id
      WHERE l.id = ${linkId}
      LIMIT 1
    `
    if (links.length === 0 || links[0].userId !== userId) {
      return { success: false, error: "Link not found" }
    }

    await sql`
      UPDATE "ItemLink"
      SET 
        url = COALESCE(${data.url}, url),
        store = COALESCE(${data.store?.trim()}, store),
        price = COALESCE(${data.price}, price),
        notes = COALESCE(${data.notes}, notes),
        "updatedAt" = NOW()
      WHERE id = ${linkId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update link:", error)
    return { success: false, error: "Failed to update link" }
  }
}

/**
 * Delete a link
 */
export async function deleteItemLink(linkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    const links = await sql`
      SELECT l.id, i."userId"
      FROM "ItemLink" l
      JOIN "Item" i ON l."itemId" = i.id
      WHERE l.id = ${linkId}
      LIMIT 1
    `
    if (links.length === 0 || links[0].userId !== userId) {
      return { success: false, error: "Link not found" }
    }

    await sql`DELETE FROM "ItemLink" WHERE id = ${linkId}`

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete link:", error)
    return { success: false, error: "Failed to delete link" }
  }
}

/**
 * Select a link (mark as preferred option)
 */
export async function selectItemLink(itemId: string, linkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify item ownership
    const items = await sql`
      SELECT id FROM "Item" WHERE id = ${itemId} AND "userId" = ${userId} LIMIT 1
    `
    if (items.length === 0) {
      return { success: false, error: "Item not found" }
    }

    // Deselect all links for this item, then select the chosen one
    await sql`UPDATE "ItemLink" SET "isSelected" = false WHERE "itemId" = ${itemId}`
    await sql`UPDATE "ItemLink" SET "isSelected" = true WHERE id = ${linkId}`

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to select link:", error)
    return { success: false, error: "Failed to select link" }
  }
}

// Keep old function name for backwards compatibility
export { toggleItemBought as toggleItemChecked }
