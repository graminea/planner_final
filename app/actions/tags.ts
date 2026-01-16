"use server"

/**
 * Server Actions for Tag Management
 *
 * Tags are flexible labels for items (urgent, sale, gift, etc.)
 */

import { revalidatePath } from "next/cache"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"
import type { Tag } from "@/lib/types"

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
    const tags = await sql`
      SELECT t.*, 
        (SELECT COUNT(*) FROM "ItemTag" WHERE "tagId" = t.id) as "_count_items"
      FROM "Tag" t
      WHERE t."userId" = ${userId}
      ORDER BY t.name ASC
    `

    return tags.map((t: any) => ({
      ...t,
      _count: { items: Number(t._count_items) },
    })) as Tag[]
  } catch (error) {
    console.error("Failed to fetch tags:", error)
    return []
  }
}

/**
 * Create a new tag
 */
export async function createTag(
  name: string,
  color?: string,
): Promise<{ success: boolean; error?: string; tag?: Tag }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    if (!name.trim()) {
      return { success: false, error: "Tag name is required" }
    }

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "Tag" (id, name, color, "userId", "createdAt")
      VALUES (${id}, ${name.trim().toLowerCase()}, ${color || null}, ${userId}, ${now})
    `

    revalidatePath("/dashboard")
    return {
      success: true,
      tag: {
        id,
        name: name.trim().toLowerCase(),
        color: color || null,
        userId,
        createdAt: now,
      } as Tag,
    }
  } catch (error: any) {
    if (error.code === "23505") {
      return { success: false, error: "Tag already exists" }
    }
    console.error("Failed to create tag:", error)
    return { success: false, error: "Failed to create tag" }
  }
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  data: { name?: string; color?: string | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    const existing = await sql`
      SELECT id FROM "Tag" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (existing.length === 0) {
      return { success: false, error: "Tag not found" }
    }

    await sql`
      UPDATE "Tag"
      SET 
        name = COALESCE(${data.name?.trim().toLowerCase()}, name),
        color = COALESCE(${data.color}, color)
      WHERE id = ${id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    if (error.code === "23505") {
      return { success: false, error: "Tag name already exists" }
    }
    console.error("Failed to update tag:", error)
    return { success: false, error: "Failed to update tag" }
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    const existing = await sql`
      SELECT id FROM "Tag" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `
    if (existing.length === 0) {
      return { success: false, error: "Tag not found" }
    }

    await sql`DELETE FROM "Tag" WHERE id = ${id}`

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete tag:", error)
    return { success: false, error: "Failed to delete tag" }
  }
}

/**
 * Add tag to item
 */
export async function addTagToItem(itemId: string, tagId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Verify item and tag ownership
    const [items, tags] = await Promise.all([
      sql`SELECT id FROM "Item" WHERE id = ${itemId} AND "userId" = ${userId} LIMIT 1`,
      sql`SELECT id FROM "Tag" WHERE id = ${tagId} AND "userId" = ${userId} LIMIT 1`,
    ])

    if (items.length === 0 || tags.length === 0) {
      return { success: false, error: "Item or tag not found" }
    }

    const id = generateId()
    await sql`
      INSERT INTO "ItemTag" (id, "itemId", "tagId", "createdAt")
      VALUES (${id}, ${itemId}, ${tagId}, NOW())
      ON CONFLICT ("itemId", "tagId") DO NOTHING
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to add tag to item:", error)
    return { success: false, error: "Failed to add tag" }
  }
}

/**
 * Remove tag from item
 */
export async function removeTagFromItem(itemId: string, tagId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    await sql`
      DELETE FROM "ItemTag" WHERE "itemId" = ${itemId} AND "tagId" = ${tagId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to remove tag from item:", error)
    return { success: false, error: "Failed to remove tag" }
  }
}
