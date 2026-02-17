/**
 * Validation Schemas (Zod)
 * 
 * Centralized input validation for all server actions.
 * All user input must pass through these schemas before reaching Prisma.
 */

import { z } from 'zod'

// ============================================================================
// PRIMITIVES
// ============================================================================

/** CUID format (Prisma default IDs) */
export const cuidSchema = z.string().min(1).max(30)

/** Non-empty trimmed string */
export const nameSchema = z.string().trim().min(1, 'Nome é obrigatório').max(200)

/** Optional text field */
export const notesSchema = z.string().max(2000).nullable().optional()

/** Price value (positive, max 10 digits with 2 decimal places) */
export const priceSchema = z.number().min(0).max(99_999_999.99)

/** Optional price */
export const optionalPriceSchema = priceSchema.nullable().optional()

/** Priority: 1=low, 2=medium, 3=high */
export const prioritySchema = z.number().int().min(1).max(3)

/** Currency code */
export const currencySchema = z.string().min(2).max(5).default('BRL')

/** URL (must be valid HTTP/HTTPS) */
export const urlSchema = z.string().url().max(2048)

// ============================================================================
// ITEM SCHEMAS
// ============================================================================

export const createItemSchema = z.object({
  name: nameSchema,
  categoryId: cuidSchema.nullable().optional(),
  priority: prioritySchema.optional().default(2),
  plannedPrice: optionalPriceSchema,
  notes: notesSchema,
})

export const updateItemSchema = z.object({
  name: nameSchema.optional(),
  categoryId: cuidSchema.nullable().optional(),
  priority: prioritySchema.optional(),
  plannedPrice: optionalPriceSchema,
  boughtPrice: optionalPriceSchema,
  notes: notesSchema,
  isBought: z.boolean().optional(),
})

export const toggleItemBoughtSchema = z.object({
  id: cuidSchema,
  boughtPrice: priceSchema.optional(),
})

export const updateBoughtPriceSchema = z.object({
  id: cuidSchema,
  boughtPrice: priceSchema,
})

// ============================================================================
// ITEM LINK SCHEMAS
// ============================================================================

export const addItemLinkSchema = z.object({
  itemId: cuidSchema,
  url: urlSchema,
  store: z.string().trim().min(1, 'Nome da loja é obrigatório').max(100),
  price: priceSchema,
  notes: notesSchema,
})

export const updateItemLinkSchema = z.object({
  linkId: cuidSchema,
  url: urlSchema.optional(),
  store: z.string().trim().min(1).max(100).optional(),
  price: priceSchema.optional(),
  notes: notesSchema,
})

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const createCategorySchema = z.object({
  name: nameSchema,
  icon: z.string().max(50).optional(),
  budget: priceSchema.optional(),
})

export const updateCategorySchema = z.object({
  id: cuidSchema,
  name: nameSchema.optional(),
  icon: z.string().max(50).optional(),
  budget: priceSchema.nullable().optional(),
  order: z.number().int().min(0).optional(),
})

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(cuidSchema).min(1).max(100),
})

// ============================================================================
// BUDGET SCHEMAS
// ============================================================================

export const setBudgetSchema = z.object({
  totalBudget: priceSchema,
  currency: currencySchema,
})

export const setCategoryAllocationSchema = z.object({
  categoryId: cuidSchema,
  allocation: priceSchema.nullable(),
})

// ============================================================================
// SUGGESTION SCHEMAS
// ============================================================================

export const createSuggestionSchema = z.object({
  name: nameSchema,
  categoryName: z.string().max(100).optional(),
  icon: z.string().max(50).optional(),
})

export const searchSuggestionsSchema = z.object({
  query: z.string().max(200),
  limit: z.number().int().min(1).max(50).optional().default(10),
})

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const registerSchema = z.object({
  nickname: z.string()
    .trim()
    .min(3, 'Nick deve ter entre 3 e 30 caracteres')
    .max(30, 'Nick deve ter entre 3 e 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nick só pode ter letras, números, _ e -'),
  password: z.string()
    .min(6, 'Senha deve ter ao menos 6 caracteres')
    .max(128),
})

export const loginSchema = z.object({
  nickname: z.string().trim().min(1, 'Nick é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
})
