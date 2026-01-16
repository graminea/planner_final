'use server'

/**
 * Server Actions for Item Suggestions
 * 
 * Provides autocomplete suggestions for common household items.
 * Combines system-seeded suggestions with user-created ones.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId, requireAuth } from '@/lib/auth'
import { DEFAULT_SUGGESTIONS } from '@/lib/types'
import type { ItemSuggestion } from '@/lib/types'

// Re-export for convenience
export type { ItemSuggestion }

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Search suggestions by name (for autocomplete)
 */
export async function searchSuggestions(
  query: string,
  limit: number = 10
): Promise<ItemSuggestion[]> {
  if (!query.trim()) return []

  try {
    const userId = await getCurrentUserId()
    
    // Search both system and user suggestions
    const suggestions = await prisma.itemSuggestion.findMany({
      where: {
        name: {
          contains: query.trim(),
          mode: 'insensitive'
        },
        OR: [
          { isSystem: true },
          { userId: userId || undefined }
        ]
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ],
      take: limit
    })

    return suggestions as ItemSuggestion[]
  } catch (error) {
    console.error('Failed to search suggestions:', error)
    return []
  }
}

/**
 * Get all suggestions (for browsing)
 */
export async function getAllSuggestions(): Promise<ItemSuggestion[]> {
  try {
    const userId = await getCurrentUserId()
    
    const suggestions = await prisma.itemSuggestion.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId || undefined }
        ]
      },
      orderBy: [
        { categoryName: 'asc' },
        { name: 'asc' }
      ]
    })

    return suggestions as ItemSuggestion[]
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)
    return []
  }
}

/**
 * Seed system suggestions (run once on app init)
 */
export async function seedSystemSuggestions(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already seeded
    const existingCount = await prisma.itemSuggestion.count({
      where: { isSystem: true }
    })
    
    if (existingCount > 0) {
      return { success: true } // Already seeded
    }

    // Create system suggestions
    await prisma.itemSuggestion.createMany({
      data: DEFAULT_SUGGESTIONS.map(s => ({
        name: s.name,
        icon: s.icon,
        categoryName: s.category, // Map 'category' to 'categoryName'
        isSystem: true,
        userId: null
      }))
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to seed suggestions:', error)
    return { success: false, error: 'Failed to seed suggestions' }
  }
}

/**
 * Create a custom user suggestion
 */
export async function createSuggestion(
  name: string,
  categoryName?: string,
  icon?: string
): Promise<{ success: boolean; error?: string; suggestion?: ItemSuggestion }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    if (!name.trim()) {
      return { success: false, error: 'Suggestion name is required' }
    }

    const suggestion = await prisma.itemSuggestion.create({
      data: {
        name: name.trim(),
        categoryName: categoryName || null,
        icon: icon || null,
        isSystem: false,
        userId
      }
    })

    return { success: true, suggestion: suggestion as ItemSuggestion }
  } catch (error) {
    console.error('Failed to create suggestion:', error)
    return { success: false, error: 'Failed to create suggestion' }
  }
}

/**
 * Increment usage count when suggestion is used
 */
export async function incrementSuggestionUsage(id: string): Promise<void> {
  try {
    await prisma.itemSuggestion.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    })
  } catch (error) {
    console.error('Failed to increment suggestion usage:', error)
  }
}
