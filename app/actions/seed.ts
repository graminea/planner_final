"use server"

/**
 * Seed Action - Initialize default data for new users
 *
 * This action runs once per user to set up:
 * - Default categories
 * - System item suggestions
 */

import { sql } from "@/lib/db"
import { getCurrentUserId, requireAuth } from "@/lib/auth"
import { seedDefaultCategories } from "./categories"
import { seedSystemSuggestions } from "./suggestions"

// Mapping English -> Portuguese for migration
const CATEGORY_TRANSLATION: Record<string, string> = {
  "Living Room": "Sala de Estar",
  Kitchen: "Cozinha",
  Bedroom: "Quarto",
  Bathroom: "Banheiro",
  Office: "Escritório",
  Outdoor: "Área Externa",
  Electronics: "Eletrônicos",
  Decor: "Decoração",
  Storage: "Armazenamento",
  Other: "Outros",
}

const SUGGESTION_TRANSLATION: Record<string, string> = {
  Sofa: "Sofá",
  "Coffee Table": "Mesa de Centro",
  "TV Stand": "Rack de TV",
  Bookshelf: "Estante",
  "Area Rug": "Tapete",
  "Floor Lamp": "Luminária de Chão",
  Curtains: "Cortinas",
  "Throw Pillows": "Almofadas",
  Refrigerator: "Geladeira",
  Microwave: "Micro-ondas",
  Toaster: "Torradeira",
  "Coffee Maker": "Cafeteira",
  Blender: "Liquidificador",
  "Pots and Pans Set": "Jogo de Panelas",
  "Knife Set": "Jogo de Facas",
  "Cutting Board": "Tábua de Corte",
  "Dish Set": "Jogo de Pratos",
  "Utensil Set": "Jogo de Talheres",
  "Trash Can": "Lixeira",
  "Paper Towel Holder": "Porta Papel Toalha",
  "Bed Frame": "Cama",
  Mattress: "Colchão",
  Pillows: "Travesseiros",
  "Bedding Set": "Jogo de Cama",
  Dresser: "Cômoda",
  Nightstand: "Criado-Mudo",
  Wardrobe: "Guarda-Roupa",
  "Bedside Lamp": "Abajur",
  "Alarm Clock": "Despertador",
  "Shower Curtain": "Cortina de Box",
  "Bath Towels": "Toalhas de Banho",
  "Bath Mat": "Tapete de Banheiro",
  "Toilet Brush": "Escova Sanitária",
  "Soap Dispenser": "Saboneteira",
  "Toothbrush Holder": "Porta Escova de Dentes",
  "Bathroom Mirror": "Espelho de Banheiro",
  "Laundry Hamper": "Cesto de Roupa Suja",
  Desk: "Escrivaninha",
  "Office Chair": "Cadeira de Escritório",
  Monitor: "Monitor",
  "Desk Lamp": "Luminária de Mesa",
  "File Cabinet": "Arquivo",
  Printer: "Impressora",
  "Desk Organizer": "Organizador de Mesa",
  TV: "TV",
  Speakers: "Caixas de Som",
  Router: "Roteador",
  "Power Strip": "Filtro de Linha",
  "Smart Home Hub": "Central de Automação",
  "Vacuum Cleaner": "Aspirador de Pó",
  "Air Purifier": "Purificador de Ar",
  Fan: "Ventilador",
  "Wall Art": "Quadros",
  "Photo Frames": "Porta-Retratos",
  Vases: "Vasos",
  Candles: "Velas",
  "Indoor Plants": "Plantas",
  "Decorative Mirror": "Espelho Decorativo",
  Clock: "Relógio de Parede",
  "Storage Bins": "Caixas Organizadoras",
  "Closet Organizer": "Organizador de Armário",
  "Shoe Rack": "Sapateira",
  Hangers: "Cabides",
  "Drawer Dividers": "Divisores de Gaveta",
  "Vacuum Storage Bags": "Sacos à Vácuo",
  "Welcome Mat": "Capacho",
  "Patio Furniture": "Móveis de Varanda",
  Grill: "Churrasqueira",
  "Garden Hose": "Mangueira de Jardim",
  "Outdoor Lights": "Iluminação Externa",
  Planters: "Vasos para Plantas",
  "First Aid Kit": "Kit de Primeiros Socorros",
  Toolkit: "Caixa de Ferramentas",
  "Fire Extinguisher": "Extintor de Incêndio",
  Batteries: "Pilhas",
  "Light Bulbs": "Lâmpadas",
  "Extension Cord": "Extensão Elétrica",
}

/**
 * Initialize all default data for a user
 * Call this after first login
 */
export async function initializeUserData(): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    // Seed default categories for user
    await seedDefaultCategories()

    // Seed system suggestions (global, runs once)
    await seedSystemSuggestions()

    return { success: true }
  } catch (error) {
    console.error("Failed to initialize user data:", error)
    return { success: false, error: "Failed to initialize user data" }
  }
}

/**
 * Check if user has been initialized
 */
export async function isUserInitialized(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return false

    const result = await sql`
      SELECT COUNT(*) as count FROM "Category" WHERE "userId" = ${userId}
    `
    return Number(result[0].count) > 0
  } catch (error) {
    console.error("Failed to check initialization:", error)
    return false
  }
}

/**
 * Migrate existing English data to Portuguese
 * Run this once to update existing users' data
 */
export async function migrateToPortuguese(): Promise<{
  success: boolean
  error?: string
  categoriesUpdated?: number
  suggestionsUpdated?: number
  itemsUpdated?: number
}> {
  try {
    await requireAuth()
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: "Not authenticated" }

    let categoriesUpdated = 0
    let suggestionsUpdated = 0
    let itemsUpdated = 0

    // 1. Update user's categories
    const userCategories = await sql`SELECT id, name FROM "Category" WHERE "userId" = ${userId}`
    for (const cat of userCategories) {
      const newName = CATEGORY_TRANSLATION[cat.name]
      if (newName && newName !== cat.name) {
        await sql`UPDATE "Category" SET name = ${newName} WHERE id = ${cat.id}`
        categoriesUpdated++
      }
    }

    // 2. Update system suggestions (global)
    const suggestions = await sql`SELECT id, name, "categoryName" FROM "ItemSuggestion" WHERE "isSystem" = true`
    for (const sug of suggestions) {
      const newName = SUGGESTION_TRANSLATION[sug.name]
      const newCategory = sug.categoryName ? CATEGORY_TRANSLATION[sug.categoryName] : null

      if (newName || newCategory) {
        await sql`
          UPDATE "ItemSuggestion"
          SET name = ${newName || sug.name}, "categoryName" = ${newCategory || sug.categoryName}
          WHERE id = ${sug.id}
        `
        suggestionsUpdated++
      }
    }

    // 3. Update user's items that have English names from suggestions
    const userItems = await sql`SELECT id, name FROM "Item" WHERE "userId" = ${userId}`
    for (const item of userItems) {
      const newName = SUGGESTION_TRANSLATION[item.name]
      if (newName && newName !== item.name) {
        await sql`UPDATE "Item" SET name = ${newName} WHERE id = ${item.id}`
        itemsUpdated++
      }
    }

    console.log(
      `Migration complete: ${categoriesUpdated} categories, ${suggestionsUpdated} suggestions, ${itemsUpdated} items updated`,
    )

    return {
      success: true,
      categoriesUpdated,
      suggestionsUpdated,
      itemsUpdated,
    }
  } catch (error) {
    console.error("Failed to migrate to Portuguese:", error)
    return { success: false, error: "Failed to migrate data" }
  }
}
