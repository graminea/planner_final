"use server"
import { sql, generateId } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"
import { DEFAULT_SUGGESTIONS } from "@/lib/types"
import type { ItemSuggestion } from "@/lib/types"

// Re-export for convenience
export type { ItemSuggestion }

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Search suggestions by name (for autocomplete)
 */
export async function searchSuggestions(query: string, limit = 10): Promise<ItemSuggestion[]> {
  if (!query.trim()) return []

  try {
    const userId = await getCurrentUserId()

    // Search both system and user suggestions
    const suggestions = await sql`
      SELECT id, name, "categoryName", icon, "isSystem", "usageCount", "createdAt", "userId"
      FROM "ItemSuggestion"
      WHERE name ILIKE ${"%" + query.trim() + "%"}
        AND ("isSystem" = true OR "userId" = ${userId})
      ORDER BY "usageCount" DESC, name ASC
      LIMIT ${limit}
    `

    return suggestions as ItemSuggestion[]
  } catch (error) {
    console.error("Failed to search suggestions:", error)
    return []
  }
}

/**
 * Get all suggestions (for browsing)
 */
export async function getAllSuggestions(): Promise<ItemSuggestion[]> {
  try {
    const userId = await getCurrentUserId()

    const suggestions = await sql`
      SELECT id, name, "categoryName", icon, "isSystem", "usageCount", "createdAt", "userId"
      FROM "ItemSuggestion"
      WHERE "isSystem" = true OR "userId" = ${userId}
      ORDER BY "categoryName" ASC, name ASC
    `

    return suggestions as ItemSuggestion[]
  } catch (error) {
    console.error("Failed to fetch suggestions:", error)
    return []
  }
}

/**
 * Seed system suggestions (run once on app init)
 */
export async function seedSystemSuggestions(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already seeded
    const existing = await sql`
      SELECT COUNT(*) as count FROM "ItemSuggestion" WHERE "isSystem" = true
    `

    if (Number(existing[0].count) > 0) {
      return { success: true } // Already seeded
    }

    // Create system suggestions
    for (const s of DEFAULT_SUGGESTIONS) {
      const id = generateId()
      await sql`
        INSERT INTO "ItemSuggestion" (id, name, icon, "categoryName", "isSystem", "userId", "createdAt")
        VALUES (${id}, ${s.name}, ${s.icon || null}, ${s.category || null}, true, NULL, NOW())
      `
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to seed suggestions:", error)
    return { success: false, error: "Failed to seed suggestions" }
  }
}

/**
 * Create a custom user suggestion
 */
export async function createSuggestion(
  name: string,
  categoryName?: string,
  icon?: string,
): Promise<{ success: boolean; error?: string; suggestion?: ItemSuggestion }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    if (!name.trim()) {
      return { success: false, error: "Suggestion name is required" }
    }

    const id = generateId()
    const now = new Date()

    await sql`
      INSERT INTO "ItemSuggestion" (id, name, "categoryName", icon, "isSystem", "userId", "createdAt")
      VALUES (${id}, ${name.trim()}, ${categoryName || null}, ${icon || null}, false, ${userId}, ${now})
    `

    return {
      success: true,
      suggestion: {
        id,
        name: name.trim(),
        categoryName: categoryName || null,
        icon: icon || null,
        isSystem: false,
        usageCount: 0,
        userId,
        createdAt: now,
      } as ItemSuggestion,
    }
  } catch (error) {
    console.error("Failed to create suggestion:", error)
    return { success: false, error: "Failed to create suggestion" }
  }
}

/**
 * Increment usage count when suggestion is used
 */
export async function incrementSuggestionUsage(id: string): Promise<void> {
  try {
    await sql`
      UPDATE "ItemSuggestion"
      SET "usageCount" = "usageCount" + 1
      WHERE id = ${id}
    `
  } catch (error) {
    console.error("Failed to increment suggestion usage:", error)
  }
}
